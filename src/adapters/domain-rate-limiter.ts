/**
 * @module adapters/domain-rate-limiter
 * @description 基于域名的请求间隔限流器（根据 RPM 计算随机延迟）
 * @layer Adapters
 */

import type { Logger } from '../usecases/ports.js';

export interface DomainRateLimiterOptions {
  defaultRequestsPerMinute: number;
  domainRequestsPerMinute?: Record<string, number>;
}

export class DomainRateLimiter {
  constructor(
    private options: DomainRateLimiterOptions,
    private logger: Logger,
  ) {}

  async acquire(url: string): Promise<() => void> {
    const domain = this.extractDomain(url);
    const rpm = this.getRequestsPerMinute(domain);

    // 根据 RPM 计算随机延迟
    await this.applyRandomDelay(rpm, domain);

    return () => this.release(domain);
  }

  private release(domain: string): void {
    this.logger.debug(`[${domain}] 请求完成`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async applyRandomDelay(rpm: number, domain: string): Promise<void> {
    const avgInterval = 60000 / rpm;
    // 最小间隔为平均间隔的一半，最大为1.5倍，确保不会 burst
    const minDelay = avgInterval / 2;
    const maxDelay = avgInterval * 1.5;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);
    this.logger.debug(`[${domain}] 间隔 ${Math.round(delay)}ms (RPM: ${rpm})`);
    await this.sleep(delay);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private getRequestsPerMinute(domain: string): number {
    return this.options.domainRequestsPerMinute?.[domain] ?? this.options.defaultRequestsPerMinute;
  }
}
