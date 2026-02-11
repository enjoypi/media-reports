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
  llm: LlmConfig;
  summarize: SummarizeConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  output_dir: './downloads',
  cookies_file: './cookies.txt',
  concurrency: 3,
  timeout: 30,
  retry_max: 3,
  preferred_lang: 'en',
  max_filename_length: 200,
  retry_base_ms: 1000,
  user_agent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  llm: {
    base_url: 'https://api.openai.com/v1',
    api_key: '',
    model: 'gpt-4o',
    reasoning_effort: '',
    max_completion_tokens: 0,
    timeout: 600_000,
  },
  summarize: {
    prompt: '',
  },
};
