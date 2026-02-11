/**
 * @module cli/summarize
 * @description summarize 子命令 — 读取 VTT 字幕并生成课程总结
 * @depends services/course-scanner, services/summarizer, lib/llm-client, lib/config-loader
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { loadConfig } from '../lib/config-loader.js';
import { createLlmClient } from '../lib/llm-client.js';
import { scanCourse } from '../services/course-scanner.js';
import { summarizeSubCourse } from '../services/summarizer.js';
import { info, error as logError } from '../lib/logger.js';

export function registerSummarize(program: Command): void {
  program
    .command('summarize')
    .description('总结课程字幕内容，生成 Markdown 学习笔记')
    .argument('<course-paths...>', '课程目录路径（支持多个）')
    .option('-c, --config <path>', '配置文件路径')
    .option('-o, --output <dir>', '输出目录')
    .option('-f, --force', '覆盖已存在的总结文档', false)
    .action(async (coursePaths: string[], opts: { config?: string; output?: string; force?: boolean }) => {
      try {
        const config = loadConfig(opts.config);
        const client = createLlmClient(config.llm);
        const failures: string[] = [];

        for (const cp of coursePaths) {
          const absPath = resolve(cp);
          try {
            if (!existsSync(absPath)) {
              throw new Error(`目录不存在: ${absPath}`);
            }
            const course = scanCourse(absPath);
            info(`课程类型: ${course.type}，包含 ${course.subCourses.length} 个子课程`);

            for (const sc of course.subCourses) {
              const outDir = opts.output ? resolve(opts.output) : undefined;
              const summaryPath = resolve(outDir ?? sc.path, 'summary.md');

              if (!opts.force && existsSync(summaryPath)) {
                info(`跳过（已存在）: ${summaryPath}，使用 --force 覆盖`);
                continue;
              }
              await summarizeSubCourse(client, config, sc, { outputDir: outDir });
            }
          } catch (err) {
            logError(`课程处理失败 [${absPath}]: ${(err as Error).message}`);
            failures.push(absPath);
          }
        }

        if (failures.length > 0) {
          logError(`\n${failures.length} 个课程处理失败:`);
          failures.forEach((f) => logError(`  - ${f}`));
          process.exit(1);
        }
        info('全部完成');
      } catch (err) {
        logError((err as Error).message);
        process.exit(1);
      }
    });
}
