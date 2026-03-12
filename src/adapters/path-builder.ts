/**
 * @module adapters/path-builder
 * @description 文件路径构建器
 * @layer Adapters
 */

import { join } from 'node:path';
import type { PathBuilder } from '../usecases/ports.js';
import { sanitize } from '../lib/sanitize.js';

export interface PathBuilderOptions {
  maxFilenameLength: number;
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
    const safeCourse = sanitize(courseName, this.options.maxFilenameLength);
    const safeLesson = sanitize(lessonTitle, this.options.maxFilenameLength);
    const filename = `${weekNumber.toString().padStart(2, '0')} - ${safeLesson}.${format}`;
    return join(outputDir, safeCourse, filename);
  }
}
