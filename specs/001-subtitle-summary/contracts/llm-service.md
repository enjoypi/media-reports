# LLM Service Contract

**Feature**: 001-subtitle-summary
**Date**: 2026-02-11

## 接口

使用 OpenAI Chat Completions API 格式。

### 请求

```
POST {base_url}/chat/completions
```

**Headers**:
```
Authorization: Bearer {api_key}
Content-Type: application/json
```

**Body**:
```json
{
  "model": "{config.llm.model}",
  "messages": [
    {
      "role": "system",
      "content": "{config.summarize.prompt}"
    },
    {
      "role": "user",
      "content": "## Week {N}\n\n{week_subtitle_text}"
    }
  ]
}
```

### 响应

```json
{
  "choices": [
    {
      "message": {
        "content": "总结内容..."
      }
    }
  ]
}
```

## 调用模式

1. 每个 Week 独立调用一次 LLM
2. 所有 Week 总结完成后，合并为完整文档
3. 失败时使用现有 `withRetry` 机制重试
