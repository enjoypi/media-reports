export interface LlmConfig {
  base_url: string;
  api_key: string;
  model: string;
  reasoning_effort: string;
  max_completion_tokens: number;
  timeout: number;
}

export interface SummarizeConfig {
  prompt: string;
  output_filename: string;
}

export interface RateLimiterConfig {
  rpm_to_ms_multiplier: number;
  min_delay_factor: number;
  max_delay_factor: number;
}

export interface PathBuilderConfig {
  number_padding_width: number;
}

export interface CourseScannerConfig {
  week_pattern: string;
  sub_course_pattern: string;
  subtitle_extension: string;
}

export interface SanitizeConfig {
  invalid_chars_pattern: string;
  whitespace_pattern: string;
  multiple_dash_pattern: string;
  leading_trailing_dash_pattern: string;
  replacement_char: string;
}

export interface UrlPatternsConfig {
  course_slug: string;
  specialization_slug: string;
  site_name_strip_www: string;
  site_name_default: string;
}

export interface ExitCodesConfig {
  success: number;
  auth_error: number;
  all_failed: number;
  general_error: number;
}

export interface DownloadConfig {
  prefix_padding_width: number;
}

export interface RateLimitConfig {
  default_requests_per_minute: number;
  domain_requests_per_minute: Record<string, number>;
}

export interface AppConfig {
  output_dir: string;
  cookies_file: string;
  concurrency: number;
  timeout: number;
  retry_max: number;
  preferred_lang: string;
  max_filename_length: number;
  retry_base_ms: number;
  user_agent: string;
  base_url: string;
  empty_subtitle_placeholder: string;
  rate_limit: RateLimitConfig;
  llm: LlmConfig;
  summarize: SummarizeConfig;
  rate_limiter: RateLimiterConfig;
  path_builder: PathBuilderConfig;
  course_scanner: CourseScannerConfig;
  sanitize: SanitizeConfig;
  url_patterns: UrlPatternsConfig;
  exit_codes: ExitCodesConfig;
  download: DownloadConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  output_dir: './subtitles',
  cookies_file: './cookies.txt',
  concurrency: 3,
  timeout: 30,
  retry_max: 3,
  preferred_lang: 'en',
  max_filename_length: 200,
  retry_base_ms: 1000,
  user_agent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  base_url: 'https://www.coursera.org',
  empty_subtitle_placeholder: '[字幕内容为空]',
  rate_limit: {
    default_requests_per_minute: 30,
    domain_requests_per_minute: {
      'www.coursera.org': 50,
    },
  },
  llm: {
    base_url: 'https://api.openai.com/v1',
    api_key: '',
    model: 'gpt-4o',
    reasoning_effort: '',
    max_completion_tokens: 0,
    timeout: 600_000,
  },
  summarize: {
    prompt: `请基于以下课程字幕内容，生成一份完整、连贯、结构化的课程学习笔记。
要求：
- 提取关键概念、重要定义、核心论点
- 按主题组织内容，消除重复
- 使用 Markdown 格式，层次分明
- 保留重要的专业术语（英文原文）`,
    output_filename: 'summary.md',
  },
  rate_limiter: {
    rpm_to_ms_multiplier: 60000,
    min_delay_factor: 0.5,
    max_delay_factor: 1.5,
  },
  path_builder: {
    number_padding_width: 2,
  },
  course_scanner: {
    week_pattern: '^Week\\s+(\\d+)$',
    sub_course_pattern: '^(\\d+)\\s*-\s*',
    subtitle_extension: '.vtt',
  },
  sanitize: {
    invalid_chars_pattern: '[<>"\":"/\\\\|?*&@#$%^(){}[\\];\',.!~`\\x00-\\x1f]',
    whitespace_pattern: '\\s+',
    multiple_dash_pattern: '-+',
    leading_trailing_dash_pattern: '^-+|-+$',
    replacement_char: '-',
  },
  url_patterns: {
    course_slug: 'coursera\\.org/learn/([^/?#]+)',
    specialization_slug: 'coursera\\.org/specializations/([^/?#]+)',
    site_name_strip_www: '^www\\.',
    site_name_default: 'unknown',
  },
  exit_codes: {
    success: 0,
    auth_error: 2,
    all_failed: 3,
    general_error: 1,
  },
  download: {
    prefix_padding_width: 2,
  },
};
