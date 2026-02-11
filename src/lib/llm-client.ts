/**
 * @module lib/llm-client
 * @description OpenAI 兼容 LLM 客户端封装 — 支持自定义 baseURL
 * @depends models/config
 */

import OpenAI from 'openai';
import { ProxyAgent } from 'undici';
import type { LlmConfig } from '../models/config.js';
import { withRetry } from './retry.js';

export function createLlmClient(config: LlmConfig): OpenAI {
  if (!config.api_key) throw new Error('LLM 配置错误: api_key 未设置');
  if (!config.base_url) throw new Error('LLM 配置错误: base_url 未设置');
  const opts: ConstructorParameters<typeof OpenAI>[0] = {
    apiKey: config.api_key,
    baseURL: config.base_url,
  };
  const proxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];
  if (proxy) opts.fetchOptions = { dispatcher: new ProxyAgent(proxy) };
  return new OpenAI(opts);
}

export async function chatComplete(
  client: OpenAI,
  model: string,
  systemPrompt: string,
  userContent: string,
  retryMax: number,
  retryBaseMs: number,
): Promise<string> {
  const result = await withRetry(
    async () => {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      });
      return completion.choices[0]?.message?.content ?? '';
    },
    retryMax,
    retryBaseMs,
    'LLM 调用',
  );
  return result;
}
