import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import { AppConfig, DEFAULT_CONFIG } from '../entities/config.js';
import type { Logger } from '../usecases/ports.js';

const CONFIG_FILENAME = 'config.yaml';
const CONFIG_PATHS = [
  join(process.cwd(), CONFIG_FILENAME),
  join(homedir(), '.media-summ', CONFIG_FILENAME),
];

function loadDotEnv(): void {
  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

function applyEnvOverrides(config: AppConfig): void {
  if (process.env['LLM_API_KEY']) config.llm.api_key = process.env['LLM_API_KEY'];
  if (process.env['LLM_BASE_URL']) config.llm.base_url = process.env['LLM_BASE_URL'];
  if (process.env['LLM_MODEL']) config.llm.model = process.env['LLM_MODEL'];
}

function readAndMerge(p: string, logger?: Logger): AppConfig {
  logger?.info(`加载配置: ${p}`);
  const raw = readFileSync(p, 'utf-8');
  const parsed = parse(raw) as Partial<AppConfig> | null;
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    llm: { ...DEFAULT_CONFIG.llm, ...(parsed?.llm ?? {}) },
    summarize: { ...DEFAULT_CONFIG.summarize, ...(parsed?.summarize ?? {}) },
    rate_limit: {
      ...DEFAULT_CONFIG.rate_limit,
      ...(parsed?.rate_limit ?? {}),
      domain_concurrency: {
        ...DEFAULT_CONFIG.rate_limit.domain_concurrency,
        ...(parsed?.rate_limit?.domain_concurrency ?? {}),
      },
      domain_requests_per_minute: {
        ...DEFAULT_CONFIG.rate_limit.domain_requests_per_minute,
        ...(parsed?.rate_limit?.domain_requests_per_minute ?? {}),
      },
    },
  };
}

export function loadConfig(explicitPath?: string, logger?: Logger): AppConfig {
  loadDotEnv();
  let config: AppConfig;
  if (explicitPath) {
    if (!existsSync(explicitPath)) throw new Error(`配置文件不存在: ${explicitPath}`);
    config = readAndMerge(explicitPath, logger);
  } else {
    const found = CONFIG_PATHS.find((p) => existsSync(p));
    config = found ? readAndMerge(found, logger) : structuredClone(DEFAULT_CONFIG);
    if (!found) logger?.info('未找到配置文件，使用默认配置');
  }
  applyEnvOverrides(config);
  return config;
}
