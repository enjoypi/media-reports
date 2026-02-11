import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { parse } from 'yaml';
import { AppConfig, DEFAULT_CONFIG } from '../models/config.js';
import { info } from './logger.js';

const CONFIG_FILENAME = 'config.yaml';
const CONFIG_PATHS = [
  join(process.cwd(), CONFIG_FILENAME),
  join(homedir(), '.coursera-subtitle-dl', CONFIG_FILENAME),
];

export function loadConfig(): AppConfig {
  for (const p of CONFIG_PATHS) {
    if (existsSync(p)) {
      info(`加载配置: ${p}`);
      const raw = readFileSync(p, 'utf-8');
      const parsed = parse(raw) as Partial<AppConfig> | null;
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  }
  info('未找到配置文件，使用默认配置');
  return { ...DEFAULT_CONFIG };
}
