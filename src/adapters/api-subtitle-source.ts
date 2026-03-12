/**
 * @module adapters/api-subtitle-source
 * @description Coursera API 字幕数据源
 * @layer Adapters
 */

import type { SubtitleMeta, SubtitleSource, HttpClient } from '../ports.js';

interface VideoResponse {
  elements: unknown[];
  linked?: {
    'onDemandVideos.v1'?: {
      subtitles?: Record<string, string>;
      subtitlesVtt?: Record<string, string>;
    }[];
  };
}

export class ApiSubtitleSource implements SubtitleSource {
  private readonly baseUrl = 'https://www.coursera.org';

  constructor(private httpClient: HttpClient) {}

  async fetchForVideo(videoId: string): Promise<SubtitleMeta[]> {
    const url = `${this.baseUrl}/api/onDemandLectureVideos.v1/${videoId}?includes=video&fields=subtitles,subtitlesVtt`;
    const res = await this.httpClient.get(url);
    if (res.status !== 200) return [];

    let data: VideoResponse;
    try {
      data = JSON.parse(res.body);
    } catch {
      return [];
    }

    const video = data.linked?.['onDemandVideos.v1']?.[0];
    if (!video) return [];

    const vttSubs = video.subtitlesVtt ?? {};
    const srtSubs = video.subtitles ?? {};
    const result: SubtitleMeta[] = [];

    for (const lang of new Set([...Object.keys(srtSubs), ...Object.keys(vttSubs)])) {
      if (vttSubs[lang]) {
        result.push({ lang, format: 'vtt', url: this.toAbsoluteUrl(vttSubs[lang]) });
      } else if (srtSubs[lang]) {
        result.push({ lang, format: 'srt', url: this.toAbsoluteUrl(srtSubs[lang]) });
      }
    }

    return result;
  }

  private toAbsoluteUrl(path: string): string {
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }
}
