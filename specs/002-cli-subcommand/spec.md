# Feature Specification: CLI 子命令架构重构

**Feature Branch**: `002-cli-subcommand`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "将当前功能改成子命令"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 通过子命令执行字幕下载 (Priority: P1)

用户使用子命令格式（如 `coursera-subtitle-dl download <course-url>`）来执行字幕下载，
替代当前的直接位置参数方式（`coursera-subtitle-dl <course-url>`）。
现有的所有下载功能保持不变，仅改变调用方式。

**Why this priority**: 这是重构的核心——将现有功能迁移到子命令下，是后续扩展其他子命令的基础。

**Independent Test**: 运行 `coursera-subtitle-dl download <course-url>`，
验证字幕下载行为与重构前完全一致（目录结构、已存在文件跳过、进度日志、错误处理）。

**Acceptance Scenarios**:

1. **Given** 用户输入 `coursera-subtitle-dl download <有效课程URL>`，
   **When** 执行命令，
   **Then** 系统按原有逻辑下载字幕，行为与重构前一致。

2. **Given** 用户输入 `coursera-subtitle-dl download` 但未提供 URL，
   **When** 执行命令，
   **Then** 系统显示 download 子命令的帮助信息，提示需要提供课程 URL。

---

### User Story 2 - 查看帮助信息 (Priority: P2)

用户可以通过 `--help` 查看顶层帮助（列出所有子命令）或特定子命令的帮助。
帮助信息清晰展示命令层级关系和用法。

**Why this priority**: 子命令架构下，清晰的帮助信息是用户发现和使用功能的关键。

**Independent Test**: 分别运行 `coursera-subtitle-dl --help` 和 `coursera-subtitle-dl download --help`，
验证帮助信息正确展示命令结构和参数说明。

**Acceptance Scenarios**:

1. **Given** 用户运行 `coursera-subtitle-dl --help`，
   **When** 命令执行，
   **Then** 显示工具描述和所有可用子命令列表。

2. **Given** 用户运行 `coursera-subtitle-dl download --help`，
   **When** 命令执行，
   **Then** 显示 download 子命令的详细用法、参数和选项说明。

3. **Given** 用户输入 `coursera-subtitle-dl`（不带任何子命令），
   **When** 执行命令，
   **Then** 系统显示所有可用子命令的帮助信息。

### Edge Cases

- 用户输入未注册的子命令名称时（包括拼写错误），显示错误提示和可用子命令列表
- 用户使用旧的调用方式（直接传 URL 不带子命令）时，静默转发给 download 子命令执行（不输出任何兼容性警告），保持向后兼容

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统 MUST 将现有的字幕下载功能封装为 `download` 子命令
- **FR-002**: 系统 MUST 在无子命令时显示顶层帮助信息（包含所有可用子命令列表）
- **FR-003**: `download` 子命令 MUST 保留以下现有行为：URL 参数解析、config.yaml 配置加载、cookies.txt Cookie 认证、退出码（0=成功, 1=一般错误, 2=认证失败, 3=全部失败）、错误信息输出、已存在文件跳过、`[N/M]` 进度日志
- **FR-004**: 系统 MUST 支持 `--help` 在顶层和子命令层级分别显示对应的帮助信息
- **FR-005**: 系统 MUST 在用户输入未知子命令时显示错误提示和可用子命令列表
- **FR-006**: 系统 MUST 在检测到用户直接传入 URL（以 `http://` 或 `https://` 开头且不带子命令）时，静默转发给 download 子命令执行，保持向后兼容

### Key Entities

- **Program（顶层程序）**: 工具名称、版本、描述、子命令注册表
- **Subcommand（子命令）**: 命令名称、描述、参数定义、执行逻辑

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 所有现有的字幕下载功能在子命令架构下 100% 正常工作
- **SC-002**: `--help` 输出中包含所有子命令名称、描述和用法示例
- **SC-003**: 重构后 CLI 入口文件结构支持后续新增子命令，无需修改现有子命令代码

## Assumptions

- 使用 commander 库的子命令功能（`.command()`），无需引入新依赖
- `download` 作为第一个子命令名称，语义清晰且符合 CLI 工具惯例
- 现有的配置加载、Cookie 处理等逻辑不需要修改，仅调整 CLI 入口层的命令注册方式
- 保持向后兼容（详见 Clarifications）

## Clarifications

### Session 2026-02-11

- Q: 旧调用方式（直接传 URL 不带子命令）的向后兼容策略？ → A: 静默兼容，自动转发给 download 子命令执行
