# Claude Code Project Context

## Architecture
- Clean Architecture 四层：entities → usecases → adapters → frameworks
- **无 lib/ 目录** - 按功能分到四层：领域工具→entities，配置加载→frameworks

## Key Patterns
- Container 使用懒加载 getter（如 `getSummarizeUseCase()`），避免强制初始化未使用的依赖
- `ports.ts` 重新导出实体类型：`export { Foo } from '../entities/foo.js'`，不重复定义
- TypeScript ESM 模块，构建输出到 `dist/`

## Runtime
- `download` 子命令：**不需要** LLM API key，只需要 `cookies.txt`
- `summarize` 子命令：需要配置 `llm.api_key`
- 字幕下载到 `./downloads/<specialization>/<course>/`

## Commands
- `pnpm build` - 编译 TypeScript
- `pnpm start download <url>` - 下载字幕
- `pnpm test` - vitest（目前没有测试文件）

## Dependencies
- HTTP: `undici` (ProxyAgent)
- Parsing: `cheerio`, `@plussub/srt-vtt-parser`
- CLI: `commander`
- Config: `yaml`, `.env` 文件
