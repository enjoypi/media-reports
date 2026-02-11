/**
 * @module models/course-scan
 * @description 课程目录扫描结果模型
 */

export interface ScannedLesson {
  title: string;
  vttPath: string;
}

export interface ScannedWeek {
  number: number;
  path: string;
  lessons: ScannedLesson[];
}

export interface SubCourse {
  name: string;
  path: string;
  weeks: ScannedWeek[];
}

export interface ScannedCourse {
  name: string;
  path: string;
  type: 'single' | 'specialization';
  subCourses: SubCourse[];
}
