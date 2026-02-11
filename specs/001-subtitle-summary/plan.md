# Implementation Plan: 课程字幕内容总结

**Branch**: `001-subtitle-summary` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-subtitle-summary/spec.md`

## Summary

为现有 Coursera 字幕下载工具新增 `summarize` 子命令，读取已下载的 VTT 字幕文件，通过兼容 OpenAI 格式的 LLM 接口生成课程核心内容总结文档。支持自定义 Prompt、两种课程目录结构识别、超长内容分段处理和批量课程处理。

## Technical Context

**Language/Version**: TypeScript (ES2022, NodeNext modules)
**Primary Dependencies**: commander (CLI)、yaml (配置)、p-limit (并发控制)、openai (LLM 客户端)、@plussub/srt-vtt-parser (VTT 解析)
**Storage**: 本地文件系统（VTT 读取 + Markdown 写入）
**Testing**: vitest
**Target Platform**: macOS / Node.js
**Project Type**: single
**Performance Goals**: 单课程总结 5 分钟内完成
**Constraints**: 单文件 ≤512 行、单函数 ≤64 行、YAML 配置、pnpm 包管理
**Scale/Scope**: 8 个课程、564 个 VTT 文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 规则 | 状态 | 说明 |
|------|------|------|
| 始终使用中文 | ✅ | 日志和错误信息使用中文 |
| 单个文件 ≤512 行 | ✅ | 按职责拆分模块 |
| CLI 非交互模式 | ✅ | 所有参数通过命令行和配置文件传入 |
| Clean 架构 | ✅ | models/services/cli 分层 |
| 文件顶部 LLM 索引 | ✅ | 每个源文件添加模块注释 |
| 单函数 ≤64 行 | ✅ | 拆分为小函数 |
| 优先使用第三方库 | ✅ | VTT 解析用 @plussub/srt-vtt-parser、LLM 用 openai |
| 依赖版本用 `*` | ✅ | package.json 中使用 `*` |
| 配置格式 YAML | ✅ | 扩展现有 config.yaml |
| 魔数放配置文件 | ✅ | LLM 参数、分段大小等放入配置 |
| 控制台输出方便 LLM 调试 | ✅ | 逐 Week 输出处理进度和结果 |
| context7 查询最新版 | ✅ | 实现时使用 context7 确认依赖库最新 API |
| pnpm 替代 npm | ✅ | 使用 pnpm |

**GATE 结果**: ✅ 通过

## Project Structure

### Documentation (this feature)

```text
specs/001-subtitle-summary/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── models/
│   └── config.ts          # 扩展：新增 LLM 和 summarize 配置字段
├── services/
│   ├── vtt-parser.ts      # 新增：VTT 文件解析，提取纯文本
│   ├── course-scanner.ts  # 新增：课程目录扫描，识别两种结构
│   └── summarizer.ts      # 新增：LLM 调用、分段总结、文档生成
├── cli/
│   ├── index.ts           # 修改：注册 summarize 子命令
│   └── summarize.ts       # 新增：summarize 子命令定义
└── lib/
    └── llm-client.ts      # 新增：OpenAI 兼容 LLM 客户端封装

tests/
├── unit/
└── integration/
```

**Structure Decision**: 沿用现有 single project 结构（models/services/cli/lib 分层），新增模块按职责归入对应目录。

## Complexity Tracking

无违规项，无需记录。

## Post-Design Constitution Re-check

| 规则 | 状态 | 说明 |
|------|------|------|
| 始终使用中文 | ✅ | 日志、错误信息、默认 Prompt 均使用中文 |
| 单个文件 ≤512 行 | ✅ | 6 个新增/修改文件，职责单一 |
| CLI 非交互模式 | ✅ | 所有参数通过命令行选项和 config.yaml 传入 |
| Clean 架构 | ✅ | models → services → cli 分层，依赖方向正确 |
| 文件顶部 LLM 索引 | ✅ | 每个新文件添加 @module/@description/@depends 注释 |
| 单函数 ≤64 行 | ✅ | 各函数职责单一 |
| 优先使用第三方库 | ✅ | VTT 解析用 @plussub/srt-vtt-parser，LLM 用 openai |
| 依赖版本用 `*` | ✅ | 新增依赖使用 `*` |
| 配置格式 YAML | ✅ | 扩展现有 config.yaml |
| 魔数放配置文件 | ✅ | LLM 参数、模型名、Prompt 均在配置中 |
| 控制台输出方便 LLM 调试 | ✅ | 逐 Week 输出处理进度和结果 |
| context7 查询最新版 | ✅ | 实现时使用 context7 确认依赖库最新 API |
| pnpm 替代 npm | ✅ | 使用 pnpm |

**GATE 结果**: ✅ 通过
