import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { sanitize } from '../lib/sanitize.js';

export function buildFilePath(
  outputDir: string,
  courseName: string,
  weekNumber: number,
  lessonTitle: string,
  format: string,
  maxFilenameLength: number,
  flat = false,
): string {
  const base = flat ? outputDir : join(outputDir, sanitize(courseName, maxFilenameLength));
  const dir = join(base, `Week ${weekNumber}`);
  return join(dir, `${sanitize(lessonTitle, maxFilenameLength)}.${format}`);
}

export function writeSubtitle(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, 'utf-8');
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}
