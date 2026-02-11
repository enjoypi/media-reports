/**
 * API 路径:
 * 1. /api/courses.v1?q=slug&slug={slug} → 课程元信息（名称等）
 * 2. /api/onDemandCourseMaterials.v2/?q=slug&slug={slug} → 课程模块
 * 3. /api/onDemandLectureVideos.v1/{courseId~itemId} → 视频字幕
 */

import type { Course, Week, Lesson, SubtitleMeta } from '../models/course.js';
import { httpGet, throwOnAuthError } from '../lib/http-client.js';
import { COURSERA_API_BASE as BASE } from '../lib/constants.js';

function toAbsoluteUrl(path: string): string {
  return path.startsWith('http') ? path : `${BASE}${path}`;
}

interface LinkedModule {
  id: string;
  name: string;
}

interface LinkedLesson {
  id: string;
  itemIds: string[];
  moduleId: string;
}

interface LinkedItem {
  id: string;
  name: string;
  contentSummary: { typeName: string };
}

interface MaterialsResponse {
  elements: { id: string; moduleIds?: string[] }[];
  linked?: {
    'onDemandCourseMaterialModules.v1'?: LinkedModule[];
    'onDemandCourseMaterialLessons.v1'?: LinkedLesson[];
    'onDemandCourseMaterialItems.v2'?: LinkedItem[];
  };
}

interface VideoResponse {
  elements: unknown[];
  linked?: {
    'onDemandVideos.v1'?: {
      subtitles?: Record<string, string>;
      subtitlesVtt?: Record<string, string>;
    }[];
  };
}

export async function fetchCourseName(
  slug: string,
  timeout: number,
  userAgent: string,
): Promise<string> {
  const url = `${BASE}/api/courses.v1?q=slug&slug=${slug}&fields=name`;
  try {
    const res = await httpGet(url, timeout, userAgent);
    if (res.status === 200) {
      const data = JSON.parse(res.body) as { elements?: { name?: string }[] };
      const name = data.elements?.[0]?.name?.trim();
      if (name) return name;
    }
  } catch { /* fallback below */ }
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchCourseViaApi(
  slug: string,
  timeout: number,
  userAgent: string,
): Promise<Course | null> {
  const url =
    `${BASE}/api/onDemandCourseMaterials.v2/?q=slug&slug=${slug}` +
    '&includes=modules,lessons,items' +
    '&fields=moduleIds,' +
    'onDemandCourseMaterialModules.v1(name,slug,lessonIds),' +
    'onDemandCourseMaterialLessons.v1(name,slug,itemIds,moduleId),' +
    'onDemandCourseMaterialItems.v2(name,slug,contentSummary,lessonId)';

  const res = await httpGet(url, timeout, userAgent);
  throwOnAuthError(res.status);
  if (res.status !== 200) return null;

  let data: MaterialsResponse;
  try { data = JSON.parse(res.body); } catch { return null; }
  if (!data.elements?.length) return null;

  const courseId = data.elements[0].id;
  const linked = data.linked ?? {};
  const modules = linked['onDemandCourseMaterialModules.v1'] ?? [];
  const lessons = linked['onDemandCourseMaterialLessons.v1'] ?? [];
  const items = linked['onDemandCourseMaterialItems.v2'] ?? [];

  const itemMap = new Map(
    items.filter((i) => i.contentSummary?.typeName === 'lecture').map((i) => [i.id, i]),
  );

  const weeks: Week[] = modules.map((mod, idx) => {
    const weekLessons: Lesson[] = [];
    for (const les of lessons.filter((l) => l.moduleId === mod.id)) {
      for (const itemId of les.itemIds) {
        const item = itemMap.get(itemId);
        if (item) {
          weekLessons.push({ title: item.name, videoId: `${courseId}~${item.id}`, subtitles: [] });
        }
      }
    }
    return { number: idx + 1, title: mod.name, lessons: weekLessons };
  });

  if (weeks.length === 0) weeks.push({ number: 1, title: 'Week 1', lessons: [] });

  const courseName = await fetchCourseName(slug, timeout, userAgent);
  return { slug, name: courseName, url: `https://www.coursera.org/learn/${slug}`, weeks };
}

export async function fetchVideoSubtitles(
  videoId: string,
  timeout: number,
  userAgent: string,
): Promise<SubtitleMeta[]> {
  const url = `${BASE}/api/onDemandLectureVideos.v1/${videoId}?includes=video&fields=subtitles,subtitlesVtt`;
  const res = await httpGet(url, timeout, userAgent);
  if (res.status !== 200) return [];

  let data: VideoResponse;
  try { data = JSON.parse(res.body); } catch { return []; }

  const video = data.linked?.['onDemandVideos.v1']?.[0];
  if (!video) return [];

  const vttSubs = video.subtitlesVtt ?? {};
  const srtSubs = video.subtitles ?? {};
  const result: SubtitleMeta[] = [];

  for (const lang of new Set([...Object.keys(srtSubs), ...Object.keys(vttSubs)])) {
    if (vttSubs[lang]) result.push({ lang, format: 'vtt', url: toAbsoluteUrl(vttSubs[lang]) });
    else if (srtSubs[lang]) result.push({ lang, format: 'srt', url: toAbsoluteUrl(srtSubs[lang]) });
  }

  return result;
}
