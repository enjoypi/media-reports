# Claude Code Project Context

## Architecture
- Clean Architecture 四层：entities → usecases → adapters → frameworks
- **无 lib/ 目录** - 按功能分到四层：领域工具→entities，配置加载→frameworks

## Key Patterns
- Container 使用懒加载 getter（如 `getSummarizeUseCase()`），避免强制初始化未使用的依赖
- `ports.ts` 重新导出实体类型：`export { Foo } from '../entities/foo.js'`，不重复定义
- TypeScript ESM 模块，构建输出到 `dist/`
- Adapter 接收外部配置通过 options 对象（如 `{ baseUrl: config.coursera_base_url }`）

## Runtime
- `download` 子命令：**不需要** LLM API key，只需要 `cookies.txt`
- `summarize` 子命令：需要配置 `llm.api_key`
- 字幕下载到 `./downloads/<specialization>/<course>/`

## Environment
- `LLM_API_KEY` - LLM API 密钥（summarize 子命令必需）
- `LLM_BASE_URL` - 可选，自定义 LLM endpoint
- `LLM_MODEL` - 可选，覆盖默认模型
- `HTTPS_PROXY` - 可选，代理设置

## Commands
- `pnpm build` - 编译 TypeScript
- `node dist/frameworks/index.js download <url>` - 下载字幕（CLI 名：media-summ）
- `node dist/frameworks/index.js summarize <path>` - 总结课程
- `pnpm test` - vitest（目前没有测试文件）

## Configuration
- 本地配置：`./config.yaml`
- 全局配置：`~/.media-summ/config.yaml`
- 可配置项：`coursera_base_url`, `empty_subtitle_placeholder`, `llm.*`, `summarize.*`

## Prerequisites
- `cookies.txt` - Netscape 格式 Cookie 文件，需从浏览器导出 Coursera 登录状态

## Dependencies
- HTTP: `undici` (ProxyAgent)
- Parsing: `cheerio`, `@plussub/srt-vtt-parser`
- CLI: `commander`
- Config: `yaml`, `.env` 文件
