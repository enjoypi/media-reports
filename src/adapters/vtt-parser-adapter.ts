/**
 * @module adapters/vtt-parser
 * @description VTT 文件解析器（使用 @plussub/srt-vtt-parser）
 * @layer Adapters
 */

import { readFileSync } from 'node:fs';
import { parse } from '@plussub/srt-vtt-parser';
import type { VttParser } from '../ports.js';

export class LibVttParser implements VttParser {
  parse(filePath: string): string {
    const raw = readFileSync(filePath, 'utf-8');
    const { entries } = parse(raw);
    const text = entries.map((e: { text: string }) => e.text).join('\n');
    if (!text.trim()) return '[字幕内容为空]';
    return text;
  }
}
