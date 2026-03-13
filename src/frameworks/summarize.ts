/**
 * @module frameworks/summarize
 * @description summarize 子命令 — 使用 Clean Architecture 依赖注入
 * @layer Frameworks
 */

import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Command } from 'commander';
import { createContainer } from './container.js';
import { error as logError } from '../adapters/logger.js';

const DEFAULT_PROMPT = `请基于以下课程字幕内容，生成一份完整、连贯、结构化的课程学习笔记。
要求：
- 提取关键概念、重要定义、核心论点
- 按主题组织内容，消除重复
- 使用 Markdown 格式，层次分明
- 保留重要的专业术语（英文原文）`;

export function registerSummarize(program: Command): void {
  program
    .command('summarize')
    .description('总结课程字幕内容，生成 Markdown 学习笔记')
    .argument('<course-paths...>', '课程目录路径（支持多个）')
    .option('-c, --config <path>', '配置文件路径')
    .option('-o, --output <dir>', '输出目录')
    .option('-f, --force', '覆盖已存在的总结文档', false)
    .action(async (coursePaths: string[], opts: { config?: string; output?: string; force?: boolean }) => {
      const container = createContainer(opts.config);
      const config = container.config;
      const failures: string[] = [];

      const systemPrompt = config.summarize.prompt?.trim() || DEFAULT_PROMPT;
      if (!config.summarize.prompt?.trim()) {
        container.logger.info('未配置自定义 Prompt，使用默认 Prompt');
      }

      for (const cp of coursePaths) {
        const absPath = resolve(cp);
        try {
          if (!existsSync(absPath)) {
            throw new Error(`目录不存在: ${absPath}`);
          }

          const course = container.courseScanner.scan(absPath);
          container.logger.info(`课程类型: ${course.type}，包含 ${course.subCourses.length} 个子课程`);

          for (const sc of course.subCourses) {
            const outDir = opts.output ? resolve(opts.output) : undefined;
            const summaryPath = resolve(outDir ?? sc.path, 'summary.md');

            if (!opts.force && existsSync(summaryPath)) {
              container.logger.info(`跳过（已存在）: ${summaryPath}，使用 --force 覆盖`);
              continue;
            }

            await container.getSummarizeUseCase().execute({
              subCourse: sc,
              outputDir: outDir ?? sc.path,
              systemPrompt,
            });
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
      container.logger.info('全部完成');
    });
}
