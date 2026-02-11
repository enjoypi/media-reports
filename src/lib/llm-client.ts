/**
 * @module lib/llm-client
 * @description OpenAI 兼容 LLM 客户端封装 — 支持代理、reasoning_effort、流式响应
 * @depends models/config
 */

import OpenAI from 'openai';
import type { ChatCompletionCreateParamsStreaming } from 'openai/resources/chat/completions.js';
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
  if (proxy) opts.fetchOptions = { dispatcher: new ProxyAgent({ uri: proxy, connectTimeout: config.timeout }) };
  return new OpenAI({ ...opts, timeout: config.timeout });
}

export async function chatComplete(
  client: OpenAI,
  config: LlmConfig,
  systemPrompt: string,
  userContent: string,
  retryMax: number,
  retryBaseMs: number,
): Promise<string> {
  return withRetry(
    async () => {
      const params: ChatCompletionCreateParamsStreaming = {
        model: config.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
      };
      if (config.reasoning_effort) {
        params.reasoning_effort = config.reasoning_effort as 'low' | 'medium' | 'high';
      }
      if (config.max_completion_tokens) {
        params.max_completion_tokens = config.max_completion_tokens;
      }
      const stream = await client.chat.completions.create(params);
      const chunks: string[] = [];
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) chunks.push(delta);
      }
      return chunks.join('');
    },
    retryMax,
    retryBaseMs,
    'LLM 调用',
  );
}
