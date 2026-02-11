# Feature Specification: 课程字幕内容总结

**Feature Branch**: `001-subtitle-summary`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "从课程字幕中总结出课程核心内容，生成完整文档。其中总结用的prompt可以配置。"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 总结单个课程的字幕内容 (Priority: P1)

用户指定一个课程目录（如 `downloads/Financial Markets Global`），系统自动识别目录结构（单课程或 Specialization 专项课程），读取其下所有 VTT 字幕文件，按章节和课时顺序提取文本内容，使用默认 Prompt 调用 LLM 进行总结，生成一份结构化的课程核心内容 Markdown 文档。

**Why this priority**: 这是功能的核心价值——将分散在多个字幕文件中的课程内容转化为一份完整可读的总结文档。

**Independent Test**: 指定一个已下载的课程目录，运行总结命令，验证输出文档包含各 Week 的核心内容且结构完整。

**Acceptance Scenarios**:

1. **Given** 用户指定一个包含 VTT 字幕文件的课程目录，**When** 用户执行 `summarize` 命令，**Then** 系统生成一份 Markdown 格式的课程总结文档
2. **Given** 课程包含多个 Week 和多个课时，**When** 总结完成，**Then** 输出文档按 Week 和课时结构组织内容
3. **Given** 字幕文件格式正确，**When** 总结完成，**Then** 文档包含课程主题、各章节关键知识点和重要概念
4. **Given** 用户指定一个 Specialization 专项课程目录（含多个子课程），**When** 执行总结，**Then** 系统为每个子课程分别生成独立的总结文档

---

### User Story 2 - 自定义总结 Prompt (Priority: P2)

用户可以在配置文件中自定义总结 Prompt，以控制总结的风格、侧重点和输出格式。例如侧重实操步骤、侧重理论概念、或生成特定格式的笔记。

**Why this priority**: Prompt 可配置是用户明确提出的需求，使功能具备灵活性。

**Independent Test**: 修改配置文件中的 Prompt 后执行总结，验证输出文档的风格和内容与 Prompt 指令一致。

**Acceptance Scenarios**:

1. **Given** 用户在配置文件中设置了自定义 Prompt，**When** 执行总结操作，**Then** 系统使用自定义 Prompt 进行总结
2. **Given** 用户未配置自定义 Prompt，**When** 执行总结操作，**Then** 系统使用默认 Prompt
3. **Given** 用户配置了侧重"实操步骤"的 Prompt，**When** 对同一课程执行总结，**Then** 输出文档侧重于操作步骤而非理论概念

---

### User Story 3 - 批量总结多个课程 (Priority: P3)

用户可以一次性指定多个课程目录或整个 downloads 目录，系统依次处理每个课程并生成独立的总结文档。

**Why this priority**: 批量处理提升效率，但核心价值已在 P1 中实现，此为增强功能。

**Independent Test**: 指定多个课程目录，验证每个课程都生成了对应的总结文档。

**Acceptance Scenarios**:

1. **Given** 用户指定了多个课程目录，**When** 执行总结操作，**Then** 系统为每个课程生成独立的总结文档
2. **Given** 批量处理中某个课程处理失败，**When** 系统继续处理剩余课程，**Then** 失败的课程被记录并报告给用户

---

### Edge Cases

- 课程目录下无 VTT 文件时，系统应提示无可用字幕内容
- VTT 文件内容极少（如仅几秒钟）时，系统应正常处理但可在总结中标注
- 字幕内容超过 LLM 上下文窗口限制时，系统应分段总结再合并
- 自定义 Prompt 为空时，系统应回退到默认 Prompt 并提示用户
- LLM 服务不可用或返回错误时，系统应提示具体错误原因并保留已完成的部分结果
- 课程目录已存在总结文档时，默认跳过；使用 `--force` 选项时覆盖

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须能解析 VTT 格式字幕文件，提取纯文本内容（去除时间轴标记）
- **FR-002**: 系统必须自动识别两种课程目录结构：单课程（`课程名/Week N/`）和 Specialization 专项课程（`专项名/NN - 子课程名/Week N/`），并按章节和课时顺序有序读取字幕文件
- **FR-003**: 系统必须使用可配置的 Prompt 调用 LLM 对字幕内容进行总结
- **FR-004**: 系统必须提供默认的总结 Prompt，用户无需配置即可使用
- **FR-005**: 用户必须能够通过 YAML 配置文件修改总结 Prompt
- **FR-006**: 系统必须生成结构化的 Markdown 格式总结文档，保存到对应课程目录下（Specialization 专项课程为每个子课程分别生成）
- **FR-007**: 系统必须支持批量处理多个课程目录
- **FR-008**: 系统必须在处理失败时提供清晰的错误信息
- **FR-009**: 系统必须能处理超长字幕内容（分段总结再合并）
- **FR-010**: 系统必须通过兼容 OpenAI 格式的通用接口调用 LLM，用户可在配置文件中设置 endpoint 和 API Key，以支持 OpenAI、本地模型等多种后端

### Key Entities

- **课程目录（Course Directory）**: 输入源，包含按 Week 组织的 VTT 字幕文件
- **总结 Prompt（Summary Prompt）**: YAML 配置项，定义总结的风格、结构和侧重点
- **总结文档（Summary Document）**: 输出产物，Markdown 格式的课程核心内容文档

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户从执行命令到获得总结文档的完整流程可在 5 分钟内完成（单个课程）
- **SC-002**: 生成的总结文档覆盖课程中 90% 以上的核心知识点
- **SC-003**: 用户修改 Prompt 配置后，下次执行总结时立即生效
- **SC-004**: VTT 字幕文件解析成功率达到 99% 以上

## Assumptions

- 字幕文件均为 VTT 格式（与现有下载工具输出一致）
- 字幕语言以英文为主
- 课程目录结构遵循现有两种模式：`downloads/课程名/Week N/课时.vtt` 或 `downloads/专项名/NN - 子课程名/Week N/课时.vtt`
- 总结 Prompt 配置集成到现有的 YAML 配置文件中
- 用户已具备兼容 OpenAI 格式的 LLM 服务访问凭证（API Key 和 endpoint）
