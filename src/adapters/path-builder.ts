/**
 * @module adapters/path-builder
 * @description 文件路径构建器
 * @layer Adapters
 */

import { join } from 'node:path';
import type { PathBuilder } from '../ports.js';

export interface PathBuilderOptions {
  maxFilenameLength: number;
}

function sanitize(filename: string): string {
  return filename
    .replace(/[<>]/g, '')
    .replace(/[:"|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export class DefaultPathBuilder implements PathBuilder {
  constructor(private options: PathBuilderOptions) {}

  build(
    outputDir: string,
    courseName: string,
    weekNumber: number,
    lessonTitle: string,
    format: string,
  ): string {
    const safeCourse = sanitize(courseName);
    const safeLesson = sanitize(lessonTitle).slice(0, this.options.maxFilenameLength);
    const filename = `${weekNumber.toString().padStart(2, '0')} - ${safeLesson}.${format}`;
    return join(outputDir, safeCourse, filename);
  }
}
