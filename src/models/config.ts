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
};
