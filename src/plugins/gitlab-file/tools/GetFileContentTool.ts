/**
 * GetFileContentTool
 * 
 * 获取文件内容的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { IFileOperationService } from '../../../services/FileOperationService.js';

/**
 * GetFileContentTool 实现
 */
export class GetFileContentTool extends Tool {
  readonly name = 'get_file_content';
  readonly description = '获取指定项目的文件内容';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    filePath: z.string().describe('文件路径'),
    ref: z.string().optional().default('main').describe('分支或标签，默认为 main'),
  });
  readonly metadata = {
    category: 'file-operation',
    tags: ['gitlab', 'file', 'read'],
    plugin: 'gitlab-file',
    version: '1.0.0',
  };

  constructor(private fileService: IFileOperationService) {
    super();
  }

  async execute(params: any, context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, filePath, ref = 'main' } = params;

    try {
      const file = await this.fileService.getFileContent(projectPath, filePath, {
        ref,
        includeContent: true,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                file_name: file.file_name,
                file_path: file.file_path,
                size: file.size,
                encoding: file.encoding,
                content: file.content,
                ref: file.ref,
                commit_id: file.commit_id,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }
}

