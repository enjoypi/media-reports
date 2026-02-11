# Data Model: 课程字幕内容总结

**Feature**: 001-subtitle-summary
**Date**: 2026-02-11

## Entities

### SummarizeConfig（扩展 AppConfig）

新增配置字段，集成到现有 `AppConfig` 接口中。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| llm.base_url | string | `https://api.openai.com/v1` | LLM API endpoint |
| llm.api_key | string | (必填) | API 密钥 |
| llm.model | string | `gpt-4o` | 模型名称 |
| summarize.prompt | string | (内置默认) | 总结用 Prompt 模板 |

### ScannedCourse

课程目录扫描结果。

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 课程名称（目录名） |
| path | string | 课程目录绝对路径 |
| type | `'single' \| 'specialization'` | 课程类型 |
| subCourses | SubCourse[] | 子课程列表（specialization 时有多个） |

### SubCourse

单个课程（或 specialization 中的子课程）。

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 子课程名称 |
| path | string | 子课程目录路径 |
| weeks | ScannedWeek[] | 按编号排序的 Week 列表 |

### ScannedWeek

一个 Week 的内容。

| 字段 | 类型 | 说明 |
|------|------|------|
| number | number | Week 编号 |
| path | string | Week 目录路径 |
| lessons | ScannedLesson[] | 按文件名排序的课时列表 |

### ScannedLesson

一个课时。

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 课时标题（VTT 文件名去扩展名） |
| vttPath | string | VTT 文件绝对路径 |

## Relationships

```
ScannedCourse 1──* SubCourse 1──* ScannedWeek 1──* ScannedLesson
```

- 单课程：ScannedCourse 包含 1 个 SubCourse
- Specialization：ScannedCourse 包含多个 SubCourse（按编号排序）

## State Transitions

```
扫描目录 → 解析 VTT → 按 Week 分段总结 → 合并文档 → 写入文件
```

每个 SubCourse 独立经历完整流程。
