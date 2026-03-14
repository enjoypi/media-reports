/**
 * @module adapters/path-builder
 * @description 文件路径构建器
 * @layer Adapters
 */

import { join } from 'node:path';
import type { PathBuilder } from '../usecases/ports.js';
import type { SanitizeConfig } from '../entities/config.js';
import { sanitize } from '../entities/sanitize.js';

export interface PathBuilderOptions {
  maxFilenameLength: number;
  numberPaddingWidth: number;
  sanitizeConfig: SanitizeConfig;
}

export class DefaultPathBuilder implements PathBuilder {
  constructor(private options: PathBuilderOptions) {}

  build(
    outputDir: string,
    courseName: string,
    weekNumber: number,
    lessonIndex: number,
    lessonTitle: string,
    format: string,
  ): string {
    const safeCourse = sanitize(courseName, this.options.maxFilenameLength, this.options.sanitizeConfig);
    const safeLesson = sanitize(lessonTitle, this.options.maxFilenameLength, this.options.sanitizeConfig);
    const width = this.options.numberPaddingWidth;
    const filename = `${weekNumber.toString().padStart(width, '0')}-${lessonIndex.toString().padStart(width, '0')}-${safeLesson}.${format}`;
    return join(outputDir, safeCourse, filename);
  }
}
