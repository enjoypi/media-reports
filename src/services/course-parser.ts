import type { Course } from '../models/course.js';
import type { AppConfig } from '../models/config.js';
import { fetchCourseViaApi, fetchVideoSubtitles } from './api-fetcher.js';
import { fetchCourseViaHtml } from './html-fetcher.js';
import { HttpError } from '../lib/retry.js';
import { info, warn } from '../lib/logger.js';

export function extractSlug(url: string): string | null {
  const match = url.match(/coursera\.org\/learn\/([^/?#]+)/);
  return match ? match[1] : null;
}

export async function parseCourse(courseUrl: string, config: AppConfig): Promise<Course> {
  const slug = extractSlug(courseUrl);
  if (!slug) throw new Error(`无效的课程 URL: ${courseUrl}`);

  info(`解析课程: ${slug}`);

  try {
    const course = await fetchCourseViaApi(slug, config.timeout, config.user_agent);
    if (course) {
      await enrichSubtitles(course, config);
      logCourseInfo(course);
      return course;
    }
  } catch (err) {
    if (err instanceof HttpError && err.isAuthError) throw err;
    warn(`API 获取失败，尝试网页解析: ${(err as Error).message}`);
  }

  const course = await fetchCourseViaHtml(slug, config.timeout, config.user_agent);
  if (!course) throw new Error(`无法获取课程信息: ${slug}`);

  logCourseInfo(course);
  return course;
}

async function enrichSubtitles(course: Course, config: AppConfig): Promise<void> {
  for (const week of course.weeks) {
    for (const lesson of week.lessons) {
      if (lesson.subtitles.length === 0) {
        try {
          lesson.subtitles = await fetchVideoSubtitles(
            lesson.videoId,
            config.timeout,
            config.user_agent,
          );
        } catch {
          warn(`获取字幕信息失败: ${lesson.title}`);
        }
      }
    }
  }
}

function logCourseInfo(course: Course): void {
  const totalLessons = course.weeks.reduce((sum, w) => sum + w.lessons.length, 0);
  info(`课程: ${course.name} (${course.weeks.length} weeks, ${totalLessons} lessons)`);
}
