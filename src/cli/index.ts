#!/usr/bin/env node

/**
 * @module cli/index
 * @description CLI 入口 — 注册子命令 + 向后兼容（直接传 URL 自动转发到 download）
 * @depends cli/download
 */

import { Command } from 'commander';
import { registerDownload } from './download.js';
import { registerSummarize } from './summarize.js';

const program = new Command();

program
  .name('coursera-subtitle-dl')
  .description('Coursera 课程英文字幕批量下载工具')
  .version('1.0.0');

registerDownload(program);
registerSummarize(program);

// 向后兼容：argv 中直接传入 URL 时，自动注入 download 子命令
const userArgStart = 2;
const args = process.argv.slice(userArgStart);
const firstNonOptionIdx = args.findIndex((a) => !a.startsWith('-'));
if (firstNonOptionIdx >= 0 && /^https?:\/\//.test(args[firstNonOptionIdx])) {
  process.argv.splice(userArgStart + firstNonOptionIdx, 0, 'download');
}

// 未知子命令错误处理（FR-005）
program.on('command:*', (operands: string[]) => {
  console.error(`错误: 未知子命令 '${operands[0]}'`);
  console.error(`可用子命令: ${program.commands.map((c) => c.name()).join(', ')}`);
  process.exit(1);
});

// 无参数时显示帮助
if (process.argv.length <= userArgStart) {
  program.help();
}

program.parse();
