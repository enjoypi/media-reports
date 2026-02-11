/**
 * @module services/course-scanner
 * @description 课程目录扫描 — 识别单课程和 Specialization 两种结构
 * @depends models/course-scan
 */

import { readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import type { ScannedCourse, SubCourse, ScannedWeek, ScannedLesson } from '../models/course-scan.js';

const WEEK_PATTERN = /^Week\s+(\d+)$/i;
const SUB_COURSE_PATTERN = /^(\d+)\s*-\s*/;

function scanLessons(weekPath: string): ScannedLesson[] {
  return readdirSync(weekPath)
    .filter((f) => extname(f).toLowerCase() === '.vtt')
    .sort()
    .map((f) => ({ title: basename(f, extname(f)), vttPath: join(weekPath, f) }));
}

function scanWeeks(coursePath: string): ScannedWeek[] {
  return readdirSync(coursePath)
    .filter((d) => WEEK_PATTERN.test(d) && statSync(join(coursePath, d)).isDirectory())
    .map((d) => {
      const num = parseInt(WEEK_PATTERN.exec(d)![1], 10);
      const wPath = join(coursePath, d);
      return { number: num, path: wPath, lessons: scanLessons(wPath) };
    })
    .filter((w) => w.lessons.length > 0)
    .sort((a, b) => a.number - b.number);
}

function isSpecialization(coursePath: string): boolean {
  const entries = readdirSync(coursePath);
  return entries.some((e) => SUB_COURSE_PATTERN.test(e) && statSync(join(coursePath, e)).isDirectory());
}

function scanSubCourses(specPath: string): SubCourse[] {
  return readdirSync(specPath)
    .filter((d) => SUB_COURSE_PATTERN.test(d) && statSync(join(specPath, d)).isDirectory())
    .sort()
    .map((d) => {
      const scPath = join(specPath, d);
      return { name: d, path: scPath, weeks: scanWeeks(scPath) };
    })
    .filter((sc) => sc.weeks.length > 0);
}

export function scanCourse(coursePath: string): ScannedCourse {
  const name = basename(coursePath);
  if (isSpecialization(coursePath)) {
    const subCourses = scanSubCourses(coursePath);
    if (subCourses.length === 0) throw new Error(`扫描失败: Specialization "${name}" 中未找到有效子课程`);
    return { name, path: coursePath, type: 'specialization', subCourses };
  }
  const weeks = scanWeeks(coursePath);
  if (weeks.length === 0) throw new Error(`扫描失败: 课程 "${name}" 中未找到包含 VTT 文件的 Week 目录`);
  return { name, path: coursePath, type: 'single', subCourses: [{ name, path: coursePath, weeks }] };
}
