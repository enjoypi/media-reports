# Tasks: 课程字幕内容总结

**Input**: Design documents from `/specs/001-subtitle-summary/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: 安装新增依赖

- [X] T001 安装依赖 `pnpm add openai@* @plussub/srt-vtt-parser@*` 并执行 `pnpm update -L`

---

## Phase 2: Foundational

**Purpose**: 扩展配置模型和基础设施，所有 User Story 的前置条件

**⚠️ CRITICAL**: 必须完成后才能开始 User Story 实现

- [X] T002 扩展 AppConfig 接口，新增 `llm` 和 `summarize` 配置字段 in `src/models/config.ts`
- [X] T003 更新 `config.example.yaml` 添加 llm 和 summarize 基础配置结构
- [X] T004 [P] 创建 LLM 客户端封装（OpenAI SDK + 自定义 baseURL；集成现有 `withRetry` 重试机制；api_key 或 base_url 缺失时抛出明确错误）in `src/lib/llm-client.ts`
- [X] T005 [P] 创建 VTT 解析服务（使用 @plussub/srt-vtt-parser 提取纯文本；文本为空或极短时返回标记）in `src/services/vtt-parser.ts`
- [X] T006 [P] 创建课程目录扫描模型（ScannedCourse/SubCourse/ScannedWeek/ScannedLesson 接口）in `src/models/course-scan.ts`

**Checkpoint**: 基础设施就绪，可开始 User Story 实现

---

## Phase 3: User Story 1 - 总结单个课程的字幕内容 (Priority: P1) 🎯 MVP

**Goal**: 用户指定课程目录，系统读取 VTT 字幕、调用 LLM 总结、生成 Markdown 文档

**Independent Test**: `pnpm run start -- summarize ./downloads/Ai\ For\ Everyone` 生成 `downloads/Ai For Everyone/summary.md`

### Implementation

- [X] T007 [US1] 实现课程目录扫描服务（识别单课程和 Specialization 两种结构，按 Week/课时排序；扫描结果为空时抛出明确错误）in `src/services/course-scanner.ts`
- [X] T008 [US1] 实现总结服务核心逻辑（按 Week 分段调用 LLM、合并生成 Markdown 文档、内置默认 Prompt；LLM 调用失败时写入已完成 Week 的部分结果；处理目录不存在、VTT 解析失败等错误）in `src/services/summarizer.ts`
- [X] T009 [US1] 创建 summarize CLI 子命令（接收课程路径、--config、--output、--force 选项；默认跳过已存在的 summary.md，--force 时覆盖）in `src/cli/summarize.ts`
- [X] T010 [US1] 在 CLI 入口注册 summarize 子命令 in `src/cli/index.ts`
- [X] T011 [US1] 编译验证 `pnpm run build && pnpm run lint`

**Checkpoint**: 单课程总结功能完整可用，可独立测试

---

## Phase 4: User Story 2 - 自定义总结 Prompt (Priority: P2)

**Goal**: 用户通过 config.yaml 中的 `summarize.prompt` 字段自定义总结 Prompt

**Independent Test**: 修改 config.yaml 中的 prompt 后执行总结，验证输出风格与 Prompt 一致

### Implementation

- [X] T012 [US2] 在 summarizer 服务中读取配置的自定义 Prompt，为空时回退到默认 Prompt 并输出提示 in `src/services/summarizer.ts`
- [X] T013 [US2] 编译验证 `pnpm run build && pnpm run lint`

**Checkpoint**: 自定义 Prompt 功能可用，修改配置后立即生效

---

## Phase 5: User Story 3 - 批量总结多个课程 (Priority: P3)

**Goal**: 用户一次指定多个课程目录，系统依次处理并为每个课程生成独立总结

**Independent Test**: `pnpm run start -- summarize ./downloads/Ai\ For\ Everyone ./downloads/Learning\ How\ To\ Learn` 分别生成两份 summary.md

### Implementation

- [X] T014 [US3] 在 summarize CLI 中支持多个课程路径参数，循环调用总结服务，单个失败不中断、记录并汇总报告 in `src/cli/summarize.ts`
- [X] T015 [US3] 编译验证 `pnpm run build && pnpm run lint`

**Checkpoint**: 批量总结功能可用，失败课程被记录并报告

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完善错误处理和配置示例

- [X] T016 更新 `config.example.yaml` 完善 summarize prompt 示例内容和注释
- [X] T017 运行 quickstart.md 验证：按 `specs/001-subtitle-summary/quickstart.md` 步骤端到端测试

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 无依赖，立即开始
- **Phase 2 (Foundational)**: 依赖 Phase 1 完成
- **Phase 3-5 (User Stories)**: 全部依赖 Phase 2 完成
- **Phase 6 (Polish)**: 依赖所有 User Story 完成

### User Story Dependencies

- **US1 (P1)**: Phase 2 完成后即可开始，无其他依赖
- **US2 (P2)**: 依赖 US1（在 summarizer.ts 基础上添加 Prompt 配置读取）
- **US3 (P3)**: 依赖 US1（在 summarize.ts 基础上添加多路径循环）

### Within Each User Story

- Models → Services → CLI → 编译验证

### Parallel Opportunities

- T004、T005、T006 可并行（不同文件，无依赖）
- US2 和 US3 在 US1 完成后可并行（修改不同文件）

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: 安装依赖（T001）
2. Phase 2: 基础设施（T002-T006）
3. Phase 3: User Story 1（T007-T011）
4. **STOP and VALIDATE**: 对一个课程执行总结，验证输出

### Incremental Delivery

1. Setup + Foundational → 基础就绪
2. US1 → 单课程总结可用（MVP）
3. US2 → 自定义 Prompt 可用
4. US3 → 批量处理可用
5. Polish → 完善配置示例和端到端验证

---

## Notes

- 所有新文件顶部添加 `@module/@description/@depends` LLM 索引注释（属于 constitution 架构规则要求，不受"禁止其他注释"限制）
- 每个文件 ≤512 行，每个函数 ≤64 行
- 日志和错误信息使用中文
- 依赖版本使用 `*`
