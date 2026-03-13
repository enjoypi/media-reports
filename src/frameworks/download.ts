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

function isAuthError(msg: string): boolean {
  return msg.includes('认证失败') || msg.includes('无权访问');
}

export function registerDownload(program: Command): void {
  program
    .command('download')
    .description('下载在线课程字幕（支持 Coursera、Udemy 等）')
    .argument('<url>', '课程或 Specialization URL')
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
          console.error(
            '认证失败（Cookie 无效或已过期）。请重新导出 cookies.txt：\n' +
            '1. 在浏览器中登录目标网站\n' +
            '2. 使用浏览器扩展导出 cookies.txt\n' +
            '3. 确认已登录并有访问权限',
          );
          process.exit(2);
        }
        if (msg.includes('无权访问') || msg.includes('403')) {
          console.error(
            '无权访问（需要登录或付费）。请确认：\n' +
            '1. 在浏览器中登录目标网站\n' +
            '2. 使用浏览器扩展导出 cookies.txt\n' +
            '3. 确认有访问权限',
          );
          process.exit(2);
        }
        console.error(msg);
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
        courseUrl: `${config.base_url}/learn/${c.slug}`,
      });
      const results = await container.downloadSubtitlesUseCase.execute({
        course,
        preferredLang: config.preferred_lang,
        outputDir: courseOutputDir,
        concurrency: config.concurrency,
      });
      if (hasAllFailed(results)) totalFailed++;
    } catch (err) {
      if (isAuthError((err as Error).message)) {
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
