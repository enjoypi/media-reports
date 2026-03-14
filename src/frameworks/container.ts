/**
 * @module frameworks/container
 * @description 依赖注入容器 — 在 Frameworks 层组装所有依赖
 * @layer Frameworks
 *
 * 这是唯一知道所有具体实现的地方，负责将 Adapter 注入到 Use Case
 */

import type { AppConfig } from '../usecases/ports.js';
import { ParseCourseUseCase } from '../usecases/parse-course.js';
import { DownloadSubtitlesUseCase } from '../usecases/download-subtitles.js';
import { SummarizeCourseUseCase } from '../usecases/summarize-course.js';
import { FetchHttpClient } from '../adapters/fetch-http-client.js';
import { ConsoleLogger } from '../adapters/console-logger.js';
import { CourseraCourseFetcher } from '../adapters/coursera/course-fetcher.js';
import { CourseraSubtitleSource } from '../adapters/coursera/subtitle-source.js';
import { ExponentialRetryPolicy } from '../adapters/exponential-retry.js';
import { NodeFileSystem } from '../adapters/node-file-system.js';
import { DefaultPathBuilder } from '../adapters/path-builder.js';
import { FileSystemCourseScanner } from '../adapters/fs-course-scanner.js';
import { LibVttParser } from '../adapters/vtt-parser-adapter.js';
import { OpenAiLlmClient } from '../adapters/openai-llm-client.js';
import { CourseraHtmlCourseFetcher } from '../adapters/coursera/html-course-fetcher.js';
import { CourseraSpecializationFetcher } from '../adapters/coursera/specialization-fetcher.js';
import { DomainRateLimiter } from '../adapters/domain-rate-limiter.js';
import { loadConfig } from './config-loader.js';
import { loadCookies } from '../adapters/cookie-loader.js';

export interface Container {
  parseCourseUseCase: ParseCourseUseCase;
  downloadSubtitlesUseCase: DownloadSubtitlesUseCase;
  courseScanner: FileSystemCourseScanner;
  specializationFetcher: CourseraSpecializationFetcher;
  httpClient: FetchHttpClient;
  config: AppConfig;
  logger: ConsoleLogger;
  getSummarizeUseCase(): SummarizeCourseUseCase;
}

export function createContainer(explicitConfigPath?: string): Container {
  const logger = new ConsoleLogger();
  const config = loadConfig(explicitConfigPath, logger);

  // 基础设施
  const cookieJar = loadCookies(config.cookies_file, logger);
  const httpClient = new FetchHttpClient({
    timeout: config.timeout,
    userAgent: config.user_agent,
    cookieJar: cookieJar || undefined,
  });

  const retryPolicy = new ExponentialRetryPolicy(
    { maxRetries: config.retry_max, baseDelayMs: config.retry_base_ms },
    logger,
  );

  // 域名限流器
  const rateLimiter = new DomainRateLimiter(
    {
      defaultRequestsPerMinute: config.rate_limit.default_requests_per_minute,
      domainRequestsPerMinute: config.rate_limit.domain_requests_per_minute,
      rpmToMsMultiplier: config.rate_limiter.rpm_to_ms_multiplier ?? 60000,
      minDelayFactor: config.rate_limiter.min_delay_factor ?? 0.5,
      maxDelayFactor: config.rate_limiter.max_delay_factor ?? 1.5,
    },
    logger,
  );

  // Adapters
  const courseFetcher = new CourseraCourseFetcher(httpClient, { baseUrl: config.base_url });
  const subtitleSource = new CourseraSubtitleSource(httpClient, { baseUrl: config.base_url });
  const fileSystem = new NodeFileSystem();
  const pathBuilder = new DefaultPathBuilder({ maxFilenameLength: config.max_filename_length, numberPaddingWidth: config.path_builder.number_padding_width ?? 2, sanitizeConfig: config.sanitize });
  const courseScanner = new FileSystemCourseScanner({
    weekPattern: config.course_scanner.week_pattern,
    subCoursePattern: config.course_scanner.sub_course_pattern,
    subtitleExtension: config.course_scanner.subtitle_extension,
  });
  const vttParser = new LibVttParser({ emptyPlaceholder: config.empty_subtitle_placeholder });
  const specializationFetcher = new CourseraSpecializationFetcher(httpClient, { baseUrl: config.base_url, specializationSlugPattern: config.url_patterns.specialization_slug });

  // Use Cases (注入依赖)
  const htmlCourseFetcher = new CourseraHtmlCourseFetcher(httpClient, { baseUrl: config.base_url });
  const parseCourseUseCase = new ParseCourseUseCase(
    courseFetcher,
    htmlCourseFetcher, // 备用 fetcher
    subtitleSource,
    retryPolicy,
    logger,
    { courseSlugPattern: config.url_patterns.course_slug },
  );

  const downloadSubtitlesUseCase = new DownloadSubtitlesUseCase(
    httpClient,
    fileSystem,
    pathBuilder,
    retryPolicy,
    rateLimiter,
    logger,
  );

  // 延迟创建 LLM 相关依赖（仅 summarize 子命令需要）
  const getSummarizeUseCase = (): SummarizeCourseUseCase => {
    const llmClient = new OpenAiLlmClient(config.llm);
    return new SummarizeCourseUseCase(llmClient, vttParser, fileSystem, logger);
  };

  return {
    parseCourseUseCase,
    downloadSubtitlesUseCase,
    courseScanner,
    specializationFetcher,
    httpClient,
    config,
    logger,
    getSummarizeUseCase,
  };
}
