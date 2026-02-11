/**
 * @module cli/download
 * @description download 子命令 — 支持单课程和 Specialization 的字幕下载
 * @depends services/course-parser, services/subtitle-downloader, services/specialization-parser, lib/*
 */

import { join } from 'node:path';
import { Command } from 'commander';
import { loadConfig } from '../lib/config-loader.js';
import type { AppConfig } from '../models/config.js';
import { loadCookies } from '../lib/cookie-loader.js';
import { setCookieJar } from '../lib/http-client.js';
import { parseCourse } from '../services/course-parser.js';
import { downloadSubtitles, type DownloadOptions } from '../services/subtitle-downloader.js';
import { extractSpecSlug, parseSpecialization } from '../services/specialization-parser.js';
import { HttpError } from '../lib/retry.js';
import { DownloadStatus, type DownloadResult } from '../models/download-result.js';
import { info, error as logError } from '../lib/logger.js';

function initCookies(config: AppConfig): void {
  const jar = loadCookies(config.cookies_file);
  if (jar) setCookieJar(jar);
}

async function downloadCourse(
  courseUrl: string,
  config: AppConfig,
  options: DownloadOptions = {},
): Promise<DownloadResult[]> {
  const course = await parseCourse(courseUrl, config);
  return downloadSubtitles(course, config, options);
}

function hasAllFailed(results: DownloadResult[]): boolean {
  return results.length > 0 && results.every((r) => r.status === DownloadStatus.Failed);
}

export function registerDownload(program: Command): void {
  program
    .command('download')
    .description('下载 Coursera 课程或 Specialization 的英文字幕')
    .argument('<url>', 'Coursera 课程或 Specialization URL')
    .option('-o, --output <dir>', '输出目录')
    .action(async (url: string, opts: { output?: string }) => {
      try {
        const config = loadConfig();
        if (opts.output) config.output_dir = opts.output;
        initCookies(config);

        const specSlug = extractSpecSlug(url);
        if (specSlug) {
          await handleSpecialization(specSlug, config);
        } else {
          const results = await downloadCourse(url, config);
          process.exit(hasAllFailed(results) ? 3 : 0);
        }
      } catch (err) {
        if (err instanceof HttpError && err.isAuthError) {
          const hint = err.status === 401
            ? '认证失败（Cookie 无效或已过期）。请重新导出 cookies.txt：\n'
            : '无权访问（未 Enroll 或需要付费）。请确认：\n';
          logError(
            hint +
            '1. 在浏览器中登录 Coursera\n' +
            '2. 使用浏览器扩展导出 cookies.txt\n' +
            '3. 确认已 Enroll 该课程',
          );
          process.exit(2);
        }
        logError((err as Error).message);
        process.exit(1);
      }
    });
}

async function handleSpecialization(slug: string, config: AppConfig): Promise<void> {
  info(`解析 Specialization: ${slug}`);
  const spec = await parseSpecialization(slug, config.timeout, config.user_agent);
  if (!spec) throw new Error(`无法获取 Specialization 信息: ${slug}`);

  info(`${spec.name} (${spec.courses.length} 门课程)`);
  let totalFailed = 0;

  for (const c of spec.courses) {
    const prefix = String(c.index).padStart(2, '0');
    const courseConfig = { ...config, output_dir: join(config.output_dir, spec.name, `${prefix} - ${c.name}`) };
    info(`\n[${c.index}/${spec.courses.length}] ${c.name}`);
    try {
      const results = await downloadCourse(`https://www.coursera.org/learn/${c.slug}`, courseConfig, { flat: true });
      if (hasAllFailed(results)) totalFailed++;
    } catch (err) {
      if (err instanceof HttpError && err.isAuthError) {
        logError(`跳过 ${c.name}: 需要认证或付费`);
        totalFailed++;
      } else {
        throw err;
      }
    }
  }

  info(`\nSpecialization 下载完成: ${spec.courses.length - totalFailed} 成功, ${totalFailed} 失败`);
  process.exit(totalFailed === spec.courses.length ? 3 : 0);
}
