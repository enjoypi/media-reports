/**
 * @module frameworks/download
 * @description download 子命令 — 使用 Clean Architecture 依赖注入
 * @layer Frameworks
 */

import { join } from 'node:path';
import { Command } from 'commander';
import { createContainer, extractSpecSlug } from './container.js';
import { DownloadStatus } from '../usecases/ports.js';
import type { DownloadResult } from '../usecases/ports.js';
import { error as logError } from '../adapters/logger.js';

function extractSiteName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '') || 'unknown';
  } catch {
    return 'unknown';
  }
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
      const container = createContainer();
      const config = container.config;
      if (opts.output) config.output_dir = opts.output;

      try {
        const siteName = extractSiteName(url);
        const baseOutputDir = join(config.output_dir, siteName);
        const specSlug = extractSpecSlug(url);
        if (specSlug) {
          await handleSpecialization(specSlug, container, baseOutputDir);
        } else {
          const course = await container.parseCourseUseCase.execute({ courseUrl: url });
          const results = await container.downloadSubtitlesUseCase.execute({
            course,
            preferredLang: config.preferred_lang,
            outputDir: baseOutputDir,
            concurrency: config.concurrency,
          });
          process.exit(hasAllFailed(results) ? 3 : 0);
        }
      } catch (err) {
        const error = err as Error;
        const msg = error.message;

        if (msg.includes('认证失败') || msg.includes('401')) {
          logError(
            '认证失败（Cookie 无效或已过期）。请重新导出 cookies.txt：\n' +
            '1. 在浏览器中登录 Coursera\n' +
            '2. 使用浏览器扩展导出 cookies.txt\n' +
            '3. 确认已 Enroll 该课程',
          );
          process.exit(2);
        }
        if (msg.includes('无权访问') || msg.includes('403')) {
          logError(
            '无权访问（未 Enroll 或需要付费）。请确认：\n' +
            '1. 在浏览器中登录 Coursera\n' +
            '2. 使用浏览器扩展导出 cookies.txt\n' +
            '3. 确认已 Enroll 该课程',
          );
          process.exit(2);
        }
        logError(msg);
        process.exit(1);
      }
    });
}

async function handleSpecialization(
  slug: string,
  container: ReturnType<typeof createContainer>,
  baseOutputDir: string,
): Promise<void> {
  const config = container.config;
  container.logger.info(`解析 Specialization: ${slug}`);

  const spec = await container.specializationFetcher.fetchBySlug(slug);
  if (!spec) throw new Error(`无法获取 Specialization 信息: ${slug}`);

  container.logger.info(`${spec.name} (${spec.courses.length} 门课程)`);
  let totalFailed = 0;

  for (const c of spec.courses) {
    const prefix = String(c.index).padStart(2, '0');
    const courseOutputDir = join(baseOutputDir, spec.name, `${prefix} - ${c.name}`);
    container.logger.info(`\n[${c.index}/${spec.courses.length}] ${c.name}`);

    try {
      const course = await container.parseCourseUseCase.execute({
        courseUrl: `${config.coursera_base_url}/learn/${c.slug}`,
      });
      const results = await container.downloadSubtitlesUseCase.execute({
        course,
        preferredLang: config.preferred_lang,
        outputDir: courseOutputDir,
        concurrency: config.concurrency,
      });
      if (hasAllFailed(results)) totalFailed++;
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('认证失败') || msg.includes('无权访问')) {
        container.logger.error(`跳过 ${c.name}: 需要认证或付费`);
        totalFailed++;
      } else {
        throw err;
      }
    }
  }

  container.logger.info(`\nSpecialization 下载完成: ${spec.courses.length - totalFailed} 成功, ${totalFailed} 失败`);
  process.exit(totalFailed === spec.courses.length ? 3 : 0);
}
