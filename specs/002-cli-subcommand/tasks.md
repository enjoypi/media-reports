# Tasks: CLI 子命令架构重构

**Input**: Design documents from `/specs/002-cli-subcommand/`
**Prerequisites**: plan.md, spec.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: User Story 1 - 通过子命令执行字幕下载 (Priority: P1) 🎯 MVP

**Goal**: 将现有下载逻辑提取为 `download` 子命令，保留全部原有行为，并支持旧调用方式的向后兼容

**Independent Test**: 运行 `coursera-subtitle-dl download <url>` 和 `coursera-subtitle-dl <url>`，验证行为与重构前一致

### Implementation for User Story 1

- [x] T001 [US1] 创建 download 子命令模块（含文件顶部 LLM 索引），将现有 action handler 提取为 `registerDownload(program: Command)` 函数，确保不依赖 index.ts 内部状态 in `src/cli/download.ts`
- [x] T002 [US1] 重写 CLI 入口为子命令架构（保留 shebang + 含文件顶部 LLM 索引）：注册 download 子命令 + 向后兼容逻辑（检测 argv 中直接传入的 URL 并注入 `download`） in `src/cli/index.ts`
- [x] T003 [US1] 编译验证：运行 `pnpm run build` 确认无错误

**Checkpoint**: `coursera-subtitle-dl download <url>` 和 `coursera-subtitle-dl <url>` 均可正常下载字幕（基础验证，Phase 2 T007 做回归验证）

---

## Phase 2: User Story 2 - 查看帮助信息 (Priority: P2)

**Goal**: 顶层和子命令层级的帮助信息正确展示

**Independent Test**: 运行 `coursera-subtitle-dl --help` 和 `coursera-subtitle-dl download --help`，验证输出内容

### Implementation for User Story 2

- [x] T004 [US2] 确认顶层 program 的 name/description/version 正确，无参数时自动显示帮助 in `src/cli/index.ts`
- [x] T005 [US2] 确认 download 子命令的 description 和参数说明完整 in `src/cli/download.ts`
- [x] T006 [US2] 配置未知子命令的错误处理：显示错误提示和可用子命令列表（FR-005） in `src/cli/index.ts`
- [x] T007 [US2] 验证：`coursera-subtitle-dl <url>`（旧方式）静默转发正常（FR-006）、无参数时显示帮助、未知子命令显示错误提示

**Checkpoint**: `--help` 在顶层和子命令层级均显示正确的帮助信息，未知子命令显示错误提示，旧调用方式静默转发正常

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: 无依赖，直接开始
- **Phase 2 (US2)**: 依赖 Phase 1 完成（帮助信息基于子命令注册结果）

### Within User Story 1

- T001 和 T002 有依赖关系（T002 import T001 的导出），但属于同一次重构，建议顺序执行
- T003 依赖 T001 + T002 完成

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. 完成 T001-T002：提取子命令 + 重写入口
2. T003：编译验证
3. **STOP and VALIDATE**: 手动测试 `download <url>` 和直接传 URL 两种方式
4. 确认无误后继续 Phase 2

### Incremental Delivery

1. User Story 1 → 核心子命令架构就位，功能完整可用
2. User Story 2 → 帮助信息完善，用户体验提升

---

## Notes

- 总任务数: 7
- US1: 3 个任务, US2: 4 个任务
- 并行机会: T004 和 T005 可并行 [P]（不同文件，无依赖）
- MVP 范围: User Story 1 (T001-T003)
