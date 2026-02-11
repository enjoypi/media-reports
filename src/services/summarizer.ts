/**
 * @module services/summarizer
 * @description 课程字幕总结服务 — 全部字幕合并后一次性调用 LLM 生成总结
 * @depends lib/llm-client, services/vtt-parser, models/course-scan, models/config
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type OpenAI from 'openai';
import type { AppConfig } from '../models/config.js';
import type { SubCourse, ScannedWeek } from '../models/course-scan.js';
import { parseVttFile } from './vtt-parser.js';
import { chatComplete } from '../lib/llm-client.js';
import { info, error as logError } from '../lib/logger.js';

const DEFAULT_PROMPT = `请基于以下课程字幕内容，生成一份完整、连贯、结构化的课程学习笔记。
要求：
- 提取关键概念、重要定义、核心论点
- 按主题组织内容，消除重复
- 使用 Markdown 格式，层次分明
- 保留重要的专业术语（英文原文）`;

function getPrompt(config: AppConfig): string {
  const custom = config.summarize.prompt?.trim();
  if (!custom) {
    info('未配置自定义 Prompt，使用默认 Prompt');
    return DEFAULT_PROMPT;
  }
  return custom;
}

function buildFullContent(subCourse: SubCourse): string {
  return subCourse.weeks.map((week) => {
    const lessons = week.lessons.map((l) => {
      const text = parseVttFile(l.vttPath);
      return `### ${l.title}\n\n${text}`;
    }).join('\n\n');
    return `## Week ${week.number}\n\n${lessons}`;
  }).join('\n\n');
}

export interface SummarizeOptions {
  outputDir?: string;
  force?: boolean;
}

export async function summarizeSubCourse(
  client: OpenAI,
  config: AppConfig,
  subCourse: SubCourse,
  options: SummarizeOptions = {},
): Promise<string> {
  const outDir = options.outputDir ?? subCourse.path;
  const outPath = join(outDir, 'summary.md');
  const prompt = getPrompt(config);

  info(`开始总结: ${subCourse.name}（${subCourse.weeks.length} 个 Week）`);

  const content = buildFullContent(subCourse);
  info(`字幕合并完成，正在调用 LLM...`);

  try {
    const summary = await chatComplete(
      client, config.llm.model, prompt,
      `# ${subCourse.name}\n\n${content}`,
      config.retry_max, config.retry_base_ms,
    );
    const doc = `# ${subCourse.name}\n\n${summary}\n`;
    writeFileSync(outPath, doc, 'utf-8');
    info(`总结已保存: ${outPath}`);
  } catch (err) {
    logError(`总结失败: ${(err as Error).message}`);
    throw err;
  }

  return outPath;
}
