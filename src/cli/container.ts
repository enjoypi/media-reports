/**
 * @module cli/container
 * @description 依赖注入容器 — 在 Frameworks 层组装所有依赖
 * @layer Frameworks
 *
 * 这是唯一知道所有具体实现的地方，负责将 Adapter 注入到 Use Case
 */

import type { AppConfig } from '../ports.js';
import { ParseCourseUseCase } from '../usecases/parse-course.js';
import { DownloadSubtitlesUseCase } from '../usecases/download-subtitles.js';
import { SummarizeCourseUseCase } from '../usecases/summarize-course.js';
import { FetchHttpClient } from '../adapters/fetch-http-client.js';
import { ConsoleLogger } from '../adapters/console-logger.js';
import { ApiCourseFetcher } from '../adapters/api-course-fetcher.js';
import { ApiSubtitleSource } from '../adapters/api-subtitle-source.js';
import { ExponentialRetryPolicy } from '../adapters/exponential-retry.js';
import { NodeFileSystem } from '../adapters/node-file-system.js';
import { DefaultPathBuilder } from '../adapters/path-builder.js';
import { FileSystemCourseScanner } from '../adapters/fs-course-scanner.js';
import { LibVttParser } from '../adapters/vtt-parser-adapter.js';
import { OpenAiLlmClient } from '../adapters/openai-llm-client.js';
import { HtmlCourseFetcher } from '../adapters/html-course-fetcher.js';
import { ApiSpecializationFetcher, extractSpecSlug } from '../adapters/api-specialization-fetcher.js';
import { loadConfig } from '../lib/config-loader.js';
import { loadCookies } from '../lib/cookie-loader.js';

export interface Container {
  parseCourseUseCase: ParseCourseUseCase;
  downloadSubtitlesUseCase: DownloadSubtitlesUseCase;
  summarizeCourseUseCase: SummarizeCourseUseCase;
  courseScanner: FileSystemCourseScanner;
  specializationFetcher: ApiSpecializationFetcher;
  httpClient: FetchHttpClient;
  config: AppConfig;
  logger: ConsoleLogger;
}

export { extractSpecSlug };

export function createContainer(explicitConfigPath?: string): Container {
  const config = loadConfig(explicitConfigPath);
  const logger = new ConsoleLogger();

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

  // Adapters
  const courseFetcher = new ApiCourseFetcher(httpClient, logger);
  const subtitleSource = new ApiSubtitleSource(httpClient);
  const fileSystem = new NodeFileSystem();
  const pathBuilder = new DefaultPathBuilder({ maxFilenameLength: config.max_filename_length });
  const courseScanner = new FileSystemCourseScanner();
  const vttParser = new LibVttParser();
  const specializationFetcher = new ApiSpecializationFetcher(httpClient, logger);

  // Use Cases (注入依赖)
  const htmlCourseFetcher = new HtmlCourseFetcher(httpClient, logger);
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
    logger,
  );

  const llmClient = new OpenAiLlmClient(config.llm, logger);
  const summarizeCourseUseCase = new SummarizeCourseUseCase(
    llmClient,
    vttParser,
    fileSystem,
    logger,
  );

  return {
    parseCourseUseCase,
    downloadSubtitlesUseCase,
    summarizeCourseUseCase,
    courseScanner,
    specializationFetcher,
    httpClient,
    config,
    logger,
  };
}
