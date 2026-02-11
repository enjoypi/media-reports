/**
 * @module services/vtt-parser
 * @description VTT 字幕文件解析 — 提取纯文本内容
 * @depends @plussub/srt-vtt-parser
 */

import { readFileSync } from 'node:fs';
import { parse } from '@plussub/srt-vtt-parser';

export function parseVttFile(filePath: string): string {
  const raw = readFileSync(filePath, 'utf-8');
  const { entries } = parse(raw);
  const text = entries.map((e: { text: string }) => e.text).join('\n');
  if (!text.trim()) return '[字幕内容为空]';
  return text;
}
