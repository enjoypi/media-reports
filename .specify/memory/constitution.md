<!--
Sync Impact Report
- Version change: N/A → 1.0.0 (初始创建)
- Added sections:
  - Core Principles: 最高优先级规则 (5条)
  - Core Principles: 架构规则 (3条)
  - Core Principles: 实现规则 (7条)
  - Core Principles: 测试规则 (1条)
  - Core Principles: TypeScript/JavaScript/Node 规则 (4条)
  - 技术栈约束
  - 开发工作流
  - Governance
- Removed sections: N/A
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ 无需修改（Constitution Check 为动态引用）
  - .specify/templates/spec-template.md ✅ 无需修改
  - .specify/templates/tasks-template.md ✅ 无需修改
- Follow-up TODOs: 无
-->

# Media Reports Constitution

## Core Principles

### I. 最高优先级规则

- MUST 始终使用中文
- MUST 可选项有数字序号方便用户选择，在 IDE 中使用 GUI 菜单
- MUST NOT 自动生成文档
- MUST 单个文件大小不超过 512 行
- MUST 调用 CLI 工具使用非交互模式

### II. 架构规则

- MUST 使用 Clean 架构，坚持高内聚低耦合
- MUST 源代码文件顶部增加 LLM 所需索引，不超过 1000 字
- MUST 单个函数长度不超过 64 行

### III. 实现规则

- MUST 优先使用稳定第三方库，而非自己实现功能
- MUST 依赖库版本号用 `*` 来使用最新版本
- MUST 使用 context7 查询所有技术栈、依赖库的最新版
- MUST 仅对复杂业务或算法添加注释，禁止其他注释
- MUST 控制台输出方便 LLM 调试
- MUST 配置格式使用 `yaml`
- MUST 所有魔数放在配置文件里

### IV. 测试规则

- MUST 任何测试运行之前保证编译通过

### V. TypeScript/JavaScript/Node 规则

- MUST 使用 pnpm 替代 npm
- MUST 使用 `pnpm run` 替代 node
- MUST 直接运行 node 包使用 `pnpm dlx`
- MUST 使用 `pnpm update -L` 来使用最新版本的依赖库

## 技术栈约束

- 包管理器：pnpm（禁止 npm/yarn）
- 配置格式：YAML（禁止 JSON/TOML 用于配置）
- 架构模式：Clean Architecture
- 依赖版本策略：始终最新（`*`）

## 开发工作流

- 编码前：确认架构层级归属，确认是否有可复用的第三方库
- 编码中：遵循 512 行/文件、64 行/函数限制；文件顶部写 LLM 索引
- 编码后：编译通过后方可运行测试
- 配置变更：魔数提取到 YAML 配置文件，禁止硬编码

## Governance

- Constitution 优先级高于所有其他实践约定
- 修改 constitution MUST 记录变更内容、审批理由和迁移计划
- 所有 PR/代码审查 MUST 验证是否符合 constitution 原则
- 版本号遵循语义化版本：
  - MAJOR：原则删除或不兼容的重新定义
  - MINOR：新增原则或实质性扩展
  - PATCH：措辞澄清、笔误修正

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11
