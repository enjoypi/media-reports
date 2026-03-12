/**
 * @module usecases/summarize-course
 * @description 课程总结用例
 * @layer Use Cases
 */

import type { SubCourse, LlmClient, Logger, FileSystem, VttParser, DownloadResult, DownloadStatus } from './ports.js';

export interface SummarizeCourseInput {
  subCourse: SubCourse;
  outputDir: string;
  systemPrompt: string;
}

export class SummarizeCourseUseCase {
  constructor(
    private llmClient: LlmClient,
    private vttParser: VttParser,
    private fileSystem: FileSystem,
    private logger: Logger,
  ) {}

  async execute(input: SummarizeCourseInput): Promise<string> {
    const outPath = this.resolveOutputPath(input);

    this.logger.info(`开始总结: ${input.subCourse.name}（${input.subCourse.weeks.length} 个 Week）`);

    const content = this.buildFullContent(input.subCourse);
    this.logger.info(`字幕合并完成，正在调用 LLM...`);

    const summary = await this.llmClient.complete(
      input.systemPrompt,
      `# ${input.subCourse.name}\n\n${content}`,
    );

    const doc = `# ${input.subCourse.name}\n\n${summary}\n`;
    this.fileSystem.write(outPath, doc);

    this.logger.info(`总结已保存: ${outPath}`);
    return outPath;
  }

  private resolveOutputPath(input: SummarizeCourseInput): string {
    // 简化路径处理，实际应使用路径库
    const dir = input.outputDir || input.subCourse.path;
    return `${dir}/summary.md`;
  }

  private buildFullContent(subCourse: SubCourse): string {
    return subCourse.weeks
      .map((week) => {
        const lessons = week.lessons
          .map((l) => {
            const text = this.vttParser.parse(l.vttPath);
            return `### ${l.title}\n\n${text}`;
          })
          .join('\n\n');
        return `## Week ${week.number}\n\n${lessons}`;
      })
      .join('\n\n');
  }
}
