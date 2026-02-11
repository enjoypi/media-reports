import * as cheerio from 'cheerio';
import type { Course, Week, Lesson } from '../models/course.js';
import { httpGet, throwOnAuthError } from '../lib/http-client.js';

interface NextDataModule {
  name: string;
  items?: NextDataItem[];
}

interface NextDataItem {
  name: string;
  id: string;
  typeName?: string;
  content?: { subtitles?: Record<string, string> };
}

export async function fetchCourseViaHtml(
  slug: string,
  timeout: number,
  userAgent: string,
): Promise<Course | null> {
  const url = `https://www.coursera.org/learn/${slug}`;
  const res = await httpGet(url, timeout, userAgent);

  throwOnAuthError(res.status);
  if (res.status !== 200) return null;

  const $ = cheerio.load(res.body);
  const scriptEl = $('script#__NEXT_DATA__');
  if (!scriptEl.length) return null;

  let nextData: Record<string, unknown>;
  try { nextData = JSON.parse(scriptEl.text()); } catch { return null; }

  const pageProps = (nextData as { props?: { pageProps?: Record<string, unknown> } })?.props
    ?.pageProps;
  if (!pageProps) return null;

  const courseName = (pageProps.courseMetadata as { name?: string })?.name ?? slug;
  const modules = (pageProps.modules as NextDataModule[]) ?? [];

  const weeks: Week[] = modules.map((mod, idx) => {
    const lessons: Lesson[] = (mod.items ?? [])
      .filter((item) => item.typeName === 'lecture' || item.content?.subtitles)
      .map((item) => ({
        title: item.name,
        videoId: item.id,
        subtitles: item.content?.subtitles
          ? Object.entries(item.content.subtitles).map(([lang, subtitleUrl]) => ({
              lang,
              format: subtitleUrl.endsWith('.vtt') ? 'vtt' : 'srt',
              url: subtitleUrl,
            }))
          : [],
      }));
    return { number: idx + 1, title: mod.name, lessons };
  });

  if (weeks.length === 0) weeks.push({ number: 1, title: 'Week 1', lessons: [] });

  return { slug, name: courseName, url, weeks };
}
