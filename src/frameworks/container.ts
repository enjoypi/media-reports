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
import { CourseraSpecializationFetcher, extractSpecSlug } from '../adapters/coursera/specialization-fetcher.js';
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

export { extractSpecSlug };

export function createContainer(explicitConfigPath?: string): Container {
  const logger = new ConsoleLogger();
  const config = loadConfig(explicitConfigPath, logger);

  // 基础设施
  const cookieJar = loadCookies(config.cookies_file);
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
      defaultConcurrency: config.rate_limit.default_concurrency,
      domainConcurrency: config.rate_limit.domain_concurrency,
      defaultRequestsPerMinute: config.rate_limit.default_requests_per_minute,
      domainRequestsPerMinute: config.rate_limit.domain_requests_per_minute,
    },
    logger,
  );

  // Adapters
  const courseFetcher = new CourseraCourseFetcher(httpClient, logger, { baseUrl: config.base_url });
  const subtitleSource = new CourseraSubtitleSource(httpClient, { baseUrl: config.base_url });
  const fileSystem = new NodeFileSystem();
  const pathBuilder = new DefaultPathBuilder({ maxFilenameLength: config.max_filename_length });
  const courseScanner = new FileSystemCourseScanner();
  const vttParser = new LibVttParser({ emptyPlaceholder: config.empty_subtitle_placeholder });
  const specializationFetcher = new CourseraSpecializationFetcher(httpClient, logger, { baseUrl: config.base_url });

  // Use Cases (注入依赖)
  const htmlCourseFetcher = new CourseraHtmlCourseFetcher(httpClient, logger, { baseUrl: config.base_url });
  const parseCourseUseCase = new ParseCourseUseCase(
    courseFetcher,
    htmlCourseFetcher, // 备用 fetcher
    subtitleSource,
    retryPolicy,
    logger,
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
    const llmClient = new OpenAiLlmClient(config.llm, logger);
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
