/**
 * @module adapters/fs-course-scanner
 * @description 文件系统课程扫描器
 * @layer Adapters
 */

import { readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import type { CourseScanner, ScannedCourse, ScannedLesson, ScannedWeek, SubCourse } from '../usecases/ports.js';

const WEEK_PATTERN = /^Week\s+(\d+)$/i;
const SUB_COURSE_PATTERN = /^(\d+)\s*-\s*/;

export class FileSystemCourseScanner implements CourseScanner {
  scan(coursePath: string): ScannedCourse {
    const name = basename(coursePath);

    if (this.isSpecialization(coursePath)) {
      const subCourses = this.scanSubCourses(coursePath);
      if (subCourses.length === 0) {
        throw new Error(`扫描失败: Specialization "${name}" 中未找到有效子课程`);
      }
      return { name, path: coursePath, type: 'specialization', subCourses };
    }

    const weeks = this.scanWeeks(coursePath);
    if (weeks.length === 0) {
      throw new Error(`扫描失败: 课程 "${name}" 中未找到包含 VTT 文件的 Week 目录`);
    }
    return { name, path: coursePath, type: 'single', subCourses: [{ name, path: coursePath, weeks }] };
  }

  private isSpecialization(coursePath: string): boolean {
    const entries = readdirSync(coursePath);
    return entries.some((e) => SUB_COURSE_PATTERN.test(e) && statSync(join(coursePath, e)).isDirectory());
  }

  private scanSubCourses(specPath: string): SubCourse[] {
    return readdirSync(specPath)
      .filter((d) => SUB_COURSE_PATTERN.test(d) && statSync(join(specPath, d)).isDirectory())
      .sort()
      .map((d) => {
        const scPath = join(specPath, d);
        return { name: d, path: scPath, weeks: this.scanWeeks(scPath) };
      })
      .filter((sc) => sc.weeks.length > 0);
  }

  private scanWeeks(coursePath: string): ScannedWeek[] {
    return readdirSync(coursePath)
      .filter((d) => WEEK_PATTERN.test(d) && statSync(join(coursePath, d)).isDirectory())
      .map((d) => {
        const num = parseInt(WEEK_PATTERN.exec(d)![1], 10);
        const wPath = join(coursePath, d);
        return { number: num, path: wPath, lessons: this.scanLessons(wPath) };
      })
      .filter((w) => w.lessons.length > 0)
      .sort((a, b) => a.number - b.number);
  }

  private scanLessons(weekPath: string): ScannedLesson[] {
    return readdirSync(weekPath)
      .filter((f) => extname(f).toLowerCase() === '.vtt')
      .sort()
      .map((f) => ({ title: basename(f, extname(f)), vttPath: join(weekPath, f) }));
  }
}
