/**
 * @module ports
 * @description 整洁架构 Ports 层 — 定义所有外部依赖的接口
 * @layer Use Cases (内层)
 *
 * 依赖规则：
 * - 此文件位于 Use Cases 层
 * - 只定义接口，不依赖任何外部实现
 * - Adapters 层实现这些接口
 * - CLI/Frameworks 层负责注入具体实现
 */

import type { Course, SubtitleMeta } from '../entities/course.js';
import type { ScannedCourse } from '../entities/course-scan.js';

// =============================================================================
// Entity: 纯业务实体（重新导出，统一入口）
// =============================================================================

export type { Course, Week, Lesson, SubtitleMeta } from '../entities/course.js';
export type { ScannedCourse, SubCourse, ScannedWeek, ScannedLesson } from '../entities/course-scan.js';
export type { AppConfig, LlmConfig } from '../entities/config.js';
export { DownloadStatus } from '../entities/download-result.js';
export type { DownloadResult } from '../entities/download-result.js';

// =============================================================================
// Ports: 用例层定义的外部依赖接口
// =============================================================================

/**
 * 课程数据源 — 从外部 API/网页获取课程元数据
 */
export interface CourseFetcher {
  fetchBySlug(slug: string): Promise<Course | null>;
  fetchName(slug: string): Promise<string | null>;
}

/**
 * 视频字幕数据源
 */
export interface SubtitleSource {
  fetchForVideo(videoId: string): Promise<SubtitleMeta[]>;
}

/**
 * Specialization 数据源
 */
export interface SpecializationFetcher {
  fetchBySlug(slug: string): Promise<{ name: string; courses: Array<{ index: number; slug: string; name: string }> } | null>;
}

/**
 * HTTP 客户端抽象
 */
export interface HttpClient {
  get(url: string): Promise<{ status: number; body: string }>;
}

/**
 * 日志抽象
 */
export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * 文件系统操作抽象
 */
export interface FileSystem {
  exists(path: string): boolean;
  write(path: string, content: string): void;
  read(path: string): string;
}

/**
 * 路径构建器
 */
export interface PathBuilder {
  build(outputDir: string, courseName: string, weekNumber: number, lessonIndex: number, lessonTitle: string, format: string): string;
}

/**
 * VTT 解析器
 */
export interface VttParser {
  parse(filePath: string): string;
}

/**
 * 课程扫描器（本地文件系统）
 */
export interface CourseScanner {
  scan(coursePath: string): ScannedCourse;
}

/**
 * LLM 客户端抽象
 */
export interface LlmClient {
  complete(systemPrompt: string, userContent: string): Promise<string>;
}

/**
 * 重试策略
 */
export interface RetryPolicy {
  execute<T>(operation: () => Promise<T>, label: string): Promise<T>;
}

