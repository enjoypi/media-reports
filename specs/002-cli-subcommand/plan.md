# Implementation Plan: CLI 子命令架构重构

**Branch**: `002-cli-subcommand` | **Date**: 2026-02-11 | **Spec**: [spec.md](./spec.md)

## Summary

将现有的单命令 CLI（`coursera-subtitle-dl <url>`）重构为子命令架构（`coursera-subtitle-dl download <url>`），同时保持向后兼容。使用 commander 库的 `.command()` API 实现，无需新增依赖。

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 18+
**Primary Dependencies**: commander（已有）
**Storage**: N/A
**Testing**: vitest
**Target Platform**: macOS / Linux CLI
**Project Type**: single
**Constraints**: 单文件 ≤512 行，单函数 ≤64 行

## Constitution Check

| 规则 | 状态 |
|------|------|
| 单个文件 ≤512 行 | ✅ 重构后文件更小 |
| 单个函数 ≤64 行 | ✅ action handler 提取为独立函数 |
| Clean 架构 | ✅ CLI 入口与业务逻辑分离 |
| 文件顶部 LLM 索引 | ✅ 新文件添加索引 |
| pnpm | ✅ 已使用 |
| 无新依赖 | ✅ 仅用 commander 现有 API |
| 仅复杂业务添加注释 | ✅ 遵循 |
| 控制台输出方便 LLM 调试 | ✅ 保留现有日志格式 |
| 配置格式 yaml | N/A 本次不涉及配置变更 |
| 魔数放配置文件 | N/A 本次不引入新魔数 |
| 非交互模式 | N/A 本次不涉及 CLI 交互 |

## Project Structure

### Documentation (this feature)

```text
specs/002-cli-subcommand/
├── plan.md              # This file
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts         # 顶层程序：注册子命令 + 向后兼容逻辑
│   └── download.ts      # download 子命令：从 index.ts 提取的下载逻辑
├── models/              # 不变
├── services/            # 不变
└── lib/                 # 不变
```

**Structure Decision**: 将 `src/cli/index.ts` 中的下载 action 逻辑提取到 `src/cli/download.ts`，index.ts 仅负责顶层程序定义和子命令注册。

## Implementation Phases

### Phase 1: 提取 download 子命令

1. 创建 `src/cli/download.ts`，将现有 `index.ts` 中的 action handler 提取为独立的 `registerDownload(program: Command)` 函数
2. 重写 `src/cli/index.ts`：
   - 顶层 program 不再绑定 `.argument()` 和 `.action()`
   - 调用 `registerDownload(program)` 注册 download 子命令
   - 添加向后兼容逻辑：检测 `process.argv` 中是否直接传入 URL（以 `http://` 或 `https://` 开头且不是已注册子命令），若是则注入 `download` 到参数中
3. 验证：`pnpm run build` 编译通过

### Phase 2: 验证功能完整性

1. 验证 `coursera-subtitle-dl download <url>` 正常工作
2. 验证 `coursera-subtitle-dl <url>`（旧方式）静默转发正常
3. 验证 `coursera-subtitle-dl --help` 显示子命令列表
4. 验证 `coursera-subtitle-dl download --help` 显示子命令帮助
5. 验证无参数时显示帮助信息

## Key Design Decisions

1. **向后兼容实现方式**: 在 `program.parse()` 之前检测 argv，若第一个非 option 参数以 `http://` 或 `https://` 开头，则在 argv 中插入 `download`。这比 commander 的 default command 更可控。
2. **文件拆分策略**: 每个子命令一个文件（`download.ts`），通过 `register*` 函数模式注册到顶层 program，便于后续扩展。
3. **退出码保持不变**: download 子命令保留原有的退出码语义（0=成功, 1=一般错误, 2=认证失败, 3=全部失败）。
