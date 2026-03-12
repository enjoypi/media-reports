/**
 * @module adapters/console-logger
 * @description 控制台日志实现
 * @layer Adapters
 */

import type { Logger } from '../usecases/ports.js';

export class ConsoleLogger implements Logger {
  debug(message: string): void {
    console.debug(`[DEBUG] ${message}`);
  }

  info(message: string): void {
    console.info(message);
  }

  warn(message: string): void {
    console.warn(`[WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}
