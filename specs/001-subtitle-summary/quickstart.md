# Quickstart: 课程字幕内容总结

## 前置条件

1. 已安装 pnpm 和 Node.js
2. 已下载课程字幕（`downloads/` 目录下有 VTT 文件）
3. 拥有兼容 OpenAI 格式的 LLM API 访问凭证

## 配置

在 `config.yaml` 中添加：

```yaml
llm:
  base_url: https://api.openai.com/v1
  api_key: your-api-key
  model: gpt-4o

summarize:
  prompt: |
    请总结以下课程字幕内容的核心知识点，生成结构化的学习笔记。
    要求：提取关键概念、重要定义、核心论点。
```

## 使用

```bash
# 构建
pnpm run build

# 总结单个课程
pnpm run start -- summarize ./downloads/Ai\ For\ Everyone

# 总结 Specialization 专项课程
pnpm run start -- summarize ./downloads/Financial-Engineering-Specialization
```

## 输出

总结文档生成在课程目录下：
- `downloads/Ai For Everyone/summary.md`
- `downloads/Financial-Engineering-Specialization/01 - .../summary.md`

## 常用选项

```bash
# 强制覆盖已有总结
pnpm run start -- summarize ./downloads/Ai\ For\ Everyone --force
```
