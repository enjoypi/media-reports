import pLimit from 'p-limit';
import type { Course, SubtitleMeta } from '../models/course.js';
import type { AppConfig } from '../models/config.js';
import { DownloadStatus, type DownloadResult } from '../models/download-result.js';
import { httpGet } from '../lib/http-client.js';
import { withRetry, HttpError } from '../lib/retry.js';
import { info, warn, error as logError } from '../lib/logger.js';
import { buildFilePath, writeSubtitle, fileExists } from './file-manager.js';

interface DownloadTask {
  weekNumber: number;
  lessonTitle: string;
  subtitleUrl: string;
  format: string;
  index: number;
  total: number;
}

function pickEnglishSubtitle(
  subtitles: SubtitleMeta[],
  preferredLang: string,
): Pick<SubtitleMeta, 'format' | 'url'> | null {
  return (
    subtitles.find((s) => s.lang === preferredLang) ??
    subtitles.find((s) => s.lang.startsWith('en')) ??
    null
  );
}

function buildTasks(course: Course, preferredLang: string): DownloadTask[] {
  const tasks: DownloadTask[] = [];
  for (const week of course.weeks) {
    for (const lesson of week.lessons) {
      const sub = pickEnglishSubtitle(lesson.subtitles, preferredLang);
      if (sub) {
        tasks.push({
          weekNumber: week.number,
          lessonTitle: lesson.title,
          subtitleUrl: sub.url,
          format: sub.format,
          index: tasks.length + 1,
          total: 0,
        });
      }
    }
  }
  for (const t of tasks) t.total = tasks.length;
  return tasks;
}

async function downloadOne(
  task: DownloadTask,
  config: AppConfig,
  courseName: string,
  flat: boolean,
): Promise<DownloadResult> {
  const filePath = buildFilePath(
    config.output_dir,
    courseName,
    task.weekNumber,
    task.lessonTitle,
    task.format,
    config.max_filename_length,
    flat,
  );
  const label = `[${task.index}/${task.total}] Week ${task.weekNumber} / ${task.lessonTitle}.${task.format}`;

  if (fileExists(filePath)) {
    info(`${label} ... skipped (已存在)`);
    return { lesson: task.lessonTitle, status: DownloadStatus.Skipped, reason: '已存在', filePath };
  }

  try {
    const content = await withRetry(
      async () => {
        const res = await httpGet(task.subtitleUrl, config.timeout, config.user_agent);
        if (res.status !== 200) throw new HttpError(res.status, `HTTP ${res.status}`);
        return res.body;
      },
      config.retry_max,
      config.retry_base_ms,
      label,
    );
    writeSubtitle(filePath, content);
    info(`${label} ... done`);
    return { lesson: task.lessonTitle, status: DownloadStatus.Success, filePath };
  } catch (err) {
    logError(`${label} ... failed (${(err as Error).message})`);
    return { lesson: task.lessonTitle, status: DownloadStatus.Failed, reason: (err as Error).message };
  }
}

export interface DownloadOptions {
  flat?: boolean;
}

export async function downloadSubtitles(
  course: Course,
  config: AppConfig,
  options: DownloadOptions = {},
): Promise<DownloadResult[]> {
  const tasks = buildTasks(course, config.preferred_lang);
  if (tasks.length === 0) {
    warn('未找到英文字幕');
    return [];
  }

  const flat = options.flat ?? false;
  const limit = pLimit(config.concurrency);
  const results = await Promise.all(
    tasks.map((task) => limit(() => downloadOne(task, config, course.name, flat))),
  );

  const counts = { success: 0, skipped: 0, failed: 0 };
  for (const r of results) {
    if (r.status === DownloadStatus.Success) counts.success++;
    else if (r.status === DownloadStatus.Skipped) counts.skipped++;
    else counts.failed++;
  }
  info(`完成: ${counts.success} 成功, ${counts.skipped} 跳过, ${counts.failed} 失败`);

  return results;
}
