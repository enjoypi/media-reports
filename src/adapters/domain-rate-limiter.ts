/**
 * @module adapters/domain-rate-limiter
 * @description 基于域名的并发和速率限流器
 * @layer Adapters
 */

import type { Logger } from '../usecases/ports.js';

export interface DomainRateLimiterOptions {
  defaultConcurrency: number;
  domainConcurrency?: Record<string, number>;
  defaultRequestsPerMinute: number;
  domainRequestsPerMinute?: Record<string, number>;
}

interface DomainState {
  // 可用许可数（信号量）
  available: number;
  // 当前运行数
  running: number;
  // 等待队列
  queue: Array<() => void>;
  // 速率控制
  requestTimestamps: number[];
  // 互斥锁
  locked: boolean;
  lockQueue: Array<() => void>;
}

export class DomainRateLimiter {
  private domains = new Map<string, DomainState>();

  constructor(
    private options: DomainRateLimiterOptions,
    private logger: Logger,
  ) {}

  async acquire(url: string): Promise<() => void> {
    const domain = this.extractDomain(url);
    const state = this.getOrCreateState(domain);

    // 获取互斥锁
    await this.lock(state);

    try {
      const concurrency = this.getConcurrency(domain);
      const rpm = this.getRequestsPerMinute(domain);

      // 检查速率限制
      await this.checkRateLimit(domain, state, rpm);

      // 应用基于RPM的随机延迟
      await this.applyRandomDelay(rpm);

      if (state.available > 0) {
        // 有可用许可
        state.available--;
        state.running++;
        this.recordRequest(state);
        this.logger.debug(`[${domain}] 获取锁，运行: ${state.running}/${concurrency}, 可用: ${state.available}, RPM: ${state.requestTimestamps.length}/${rpm}`);
        return () => this.release(domain);
      }

      // 需要等待
      this.logger.debug(`[${domain}] 等待锁，运行: ${state.running}/${concurrency}`);
      return new Promise((resolve) => {
        state.queue.push(() => {
          this.recordRequest(state);
          this.logger.debug(`[${domain}] 获取锁（从队列），运行: ${state.running}/${concurrency}, RPM: ${state.requestTimestamps.length}/${rpm}`);
          resolve(() => this.release(domain));
        });
      });
    } finally {
      this.unlock(state);
    }
  }

  private release(domain: string): void {
    const state = this.domains.get(domain);
    if (!state) return;

    state.running--;

    // 有等待任务，直接传递许可
    const next = state.queue.shift();
    if (next) {
      this.logger.debug(`[${domain}] 释放锁，传递给队列任务`);
      next();
      return;
    }

    // 没有等待任务，归还许可
    state.available++;
    this.logger.debug(`[${domain}] 释放锁，可用许可: ${state.available}`);
  }

  private async checkRateLimit(domain: string, state: DomainState, rpm: number): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // 清理一分钟前的记录
    state.requestTimestamps = state.requestTimestamps.filter(ts => ts > oneMinuteAgo);

    // 如果超过速率限制，等待到下一分钟
    if (state.requestTimestamps.length >= rpm) {
      const oldestTs = state.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestTs) + 100;
      this.logger.debug(`[${domain}] 速率限制触发，等待 ${waitTime}ms`);

      // 先释放互斥锁，避免阻塞其他域名
      this.unlock(state);
      await this.sleep(waitTime);
      await this.lock(state);

      // 递归检查
      return this.checkRateLimit(domain, state, rpm);
    }
  }

  private recordRequest(state: DomainState): void {
    state.requestTimestamps.push(Date.now());
  }

  private async lock(state: DomainState): Promise<void> {
    if (!state.locked) {
      state.locked = true;
      return;
    }
    return new Promise(resolve => state.lockQueue.push(resolve));
  }

  private unlock(state: DomainState): void {
    const next = state.lockQueue.shift();
    if (next) {
      next();
    } else {
      state.locked = false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async applyRandomDelay(rpm: number): Promise<void> {
    const avgInterval = 60000 / rpm;
    const delay = Math.random() * avgInterval * 2;
    if (delay > 10) {
      await this.sleep(delay);
    }
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private getConcurrency(domain: string): number {
    return this.options.domainConcurrency?.[domain] ?? this.options.defaultConcurrency;
  }

  private getRequestsPerMinute(domain: string): number {
    return this.options.domainRequestsPerMinute?.[domain] ?? this.options.defaultRequestsPerMinute;
  }

  private getOrCreateState(domain: string): DomainState {
    let state = this.domains.get(domain);
    if (!state) {
      const concurrency = this.getConcurrency(domain);
      state = {
        available: concurrency,
        running: 0,
        queue: [],
        requestTimestamps: [],
        locked: false,
        lockQueue: [],
      };
      this.domains.set(domain, state);
    }
    return state;
  }
}
