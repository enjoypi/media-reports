# CLI Contract: summarize 子命令

**Feature**: 001-subtitle-summary
**Date**: 2026-02-11

## 命令格式

```bash
coursera-subtitle-dl summarize <course-path> [options]
```

## 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| course-path | string | 是 | 课程目录路径（US1 单个，US3 扩展为多个） |

## 选项

| 选项 | 短写 | 类型 | 默认值 | 说明 |
|------|------|------|--------|------|
| --config | -c | string | (现有默认查找逻辑) | 显式指定配置文件路径，未指定时按现有逻辑查找 |
| --output | -o | string | 课程目录下 | 输出目录 |
| --force | -f | boolean | false | 覆盖已存在的总结文档 |

## 输出

- 成功：在课程目录下生成 `summary.md`
- 进度：逐 Week 输出处理进度
- 错误：输出具体错误原因和失败的课程/Week

## 示例

```bash
# 总结单个课程
coursera-subtitle-dl summarize ./downloads/Financial\ Markets\ Global

# 总结多个课程
coursera-subtitle-dl summarize ./downloads/Ai\ For\ Everyone ./downloads/Learning\ How\ To\ Learn

# 使用自定义配置
coursera-subtitle-dl summarize ./downloads/Financial\ Markets\ Global -c my-config.yaml

# 强制覆盖已有总结
coursera-subtitle-dl summarize ./downloads/Financial\ Markets\ Global --force
```

## 退出码

| 码 | 说明 |
|----|------|
| 0 | 全部成功 |
| 1 | 部分或全部失败 |
