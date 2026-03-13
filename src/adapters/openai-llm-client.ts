/**
 * @module adapters/openai-llm-client
 * @description OpenAI 兼容 LLM 客户端
 * @layer Adapters
 */

import OpenAI from 'openai';
import { ProxyAgent } from 'undici';
import type { LlmClient, LlmConfig } from '../usecases/ports.js';

export class OpenAiLlmClient implements LlmClient {
  private client: OpenAI;

  constructor(private config: LlmConfig) {
    if (!config.api_key) throw new Error('LLM 配置错误: api_key 未设置');
    if (!config.base_url) throw new Error('LLM 配置错误: base_url 未设置');

    const opts: ConstructorParameters<typeof OpenAI>[0] = {
      apiKey: config.api_key,
      baseURL: config.base_url,
      timeout: config.timeout,
    };

    const proxy = process.env['HTTPS_PROXY'] || process.env['https_proxy'];
    if (proxy) {
      opts.fetchOptions = { dispatcher: new ProxyAgent({ uri: proxy, connectTimeout: config.timeout }) };
    }

    this.client = new OpenAI(opts);
  }

  async complete(systemPrompt: string, userContent: string): Promise<string> {
    const params = {
      model: this.config.model,
      stream: true as const,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userContent },
      ],
      ...(this.config.reasoning_effort && {
        reasoning_effort: this.config.reasoning_effort as 'low' | 'medium' | 'high',
      }),
      ...(this.config.max_completion_tokens && {
        max_completion_tokens: this.config.max_completion_tokens,
      }),
    };

    const stream = await this.client.chat.completions.create(params);
    const chunks: string[] = [];

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) chunks.push(delta);
    }

    return chunks.join('');
  }
}
