# Research: 课程字幕内容总结

**Feature**: 001-subtitle-summary
**Date**: 2026-02-11

## Decision 1: VTT 解析库

**Decision**: 使用 `@plussub/srt-vtt-parser`

**Rationale**: 零依赖、TypeScript 原生支持、同时支持 SRT 和 VTT 格式。API 简洁，直接返回结构化的 cue 数组（含 text 字段），可轻松提取纯文本。

**Alternatives considered**:
- `subtitle`：功能更丰富（流式处理），但对本场景过重
- `node-webvtt`：功能类似但维护频率较低
- 手写解析：VTT 格式简单可行，但违反 constitution "优先使用第三方库"原则

## Decision 2: LLM 客户端

**Decision**: 使用 `openai` 官方 Node.js SDK，通过 `baseURL` 参数支持自定义 endpoint

**Rationale**: OpenAI SDK 原生支持自定义 `baseURL`，初始化时传入即可兼容任意 OpenAI 格式的 API（本地模型、第三方服务等）。TypeScript 类型完善，社区活跃。

**用法**:
```typescript
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: config.llm.api_key,
  baseURL: config.llm.base_url,
});
const result = await client.chat.completions.create({
  model: config.llm.model,
  messages: [{ role: 'user', content: prompt }],
});
```

**Alternatives considered**:
- 直接用 `fetch` 调用：可行但需手动处理类型、错误、重试
- `langchain`：过重，本场景只需简单的 chat completion

## Decision 3: 超长内容分段策略

**Decision**: 按 Week 为单位分段总结，最后合并为完整文档

**Rationale**:
- 课程天然按 Week 组织，每个 Week 是一个语义完整的单元
- 单个 Week 的字幕文本量通常在 LLM 上下文窗口内
- 按 Week 分段后，最终合并时保持文档结构清晰
- 如果单个 Week 仍超长，可进一步按课时拆分

**Alternatives considered**:
- 按固定 token 数切分：会破坏语义完整性
- 整体一次性发送：可能超出上下文窗口
- 使用 map-reduce 模式：增加复杂度，Week 粒度已足够

## Decision 4: 配置结构

**Decision**: 在现有 `config.yaml` 中新增 `llm` 和 `summarize` 配置段

**Rationale**: 复用现有配置加载机制（`config-loader.ts`），用户无需管理额外配置文件。

**配置结构**:
```yaml
llm:
  base_url: https://api.openai.com/v1
  api_key: sk-xxx
  model: gpt-4o

summarize:
  prompt: |
    请总结以下课程字幕内容的核心知识点...
```

## Decision 5: 输出文档结构

**Decision**: 每个课程（或子课程）生成一个 `summary.md`，保存在对应课程目录下

**Rationale**: 与现有字幕文件的目录结构保持一致，便于查找和管理。

**输出路径**:
- 单课程：`downloads/课程名/summary.md`
- Specialization：`downloads/专项名/NN - 子课程名/summary.md`
