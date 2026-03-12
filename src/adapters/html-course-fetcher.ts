/**
 * @module adapters/html-course-fetcher
 * @description HTML 页面解析课程数据（API 失败时的备用方案）
 * @layer Adapters
 */

import * as cheerio from 'cheerio';
import type { Course, Week, Lesson, CourseFetcher, HttpClient, Logger } from '../ports.js';

interface NextDataModule {
  name: string;
  items?: Array<{
    name: string;
    id: string;
    typeName?: string;
    content?: { subtitles?: Record<string, string> };
  }>;
}

export class HtmlCourseFetcher implements CourseFetcher {
  constructor(
    private httpClient: HttpClient,
    private logger: Logger,
  ) {}

  async fetchBySlug(slug: string): Promise<Course | null> {
    const url = `https://www.coursera.org/learn/${slug}`;
    const res = await this.httpClient.get(url);

    if (res.status === 401) {
      throw new Error('认证失败（Cookie 无效）');
    }
    if (res.status === 403) {
      throw new Error('无权访问（未 Enroll 或需要付费）');
    }
    if (res.status !== 200) return null;

    const $ = cheerio.load(res.body);
    const scriptEl = $('script#__NEXT_DATA__');
    if (!scriptEl.length) return null;

    let nextData: Record<string, unknown>;
    try {
      nextData = JSON.parse(scriptEl.text());
    } catch {
      return null;
    }

    const pageProps = (nextData as { props?: { pageProps?: Record<string, unknown> } })?.props?.pageProps;
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

    if (weeks.length === 0) {
      weeks.push({ number: 1, title: 'Week 1', lessons: [] });
    }

    return { slug, name: courseName, url, weeks };
  }

  async fetchName(slug: string): Promise<string | null> {
    // HTML fetcher 在 fetchBySlug 中已经返回完整课程名
    const course = await this.fetchBySlug(slug);
    return course?.name ?? null;
  }
}
