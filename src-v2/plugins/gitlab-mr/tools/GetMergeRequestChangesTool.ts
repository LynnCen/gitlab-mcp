/**
 * GetMergeRequestChangesTool
 * 
 * 获取合并请求变更的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * GetMergeRequestChangesTool 实现
 */
export class GetMergeRequestChangesTool extends Tool {
  readonly name = 'get_merge_request_changes';
  readonly description = '获取合并请求的文件变更列表';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    mergeRequestIid: z.number().describe('合并请求的内部ID'),
    includeContent: z.boolean().optional().default(false).describe('是否包含文件内容'),
    focusFiles: z.array(z.string()).optional().describe('重点关注的文件列表'),
  });
  readonly metadata = {
    category: 'merge-request',
    tags: ['gitlab', 'mr', 'changes', 'read'],
    plugin: 'gitlab-mr',
    version: '1.0.0',
  };

  constructor(private mrService: IMergeRequestService) {
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, mergeRequestIid, includeContent = false, focusFiles } = params as {
      projectPath: string;
      mergeRequestIid: number;
      includeContent?: boolean;
      focusFiles?: string[];
    };

    try {
      const changes = await this.mrService.getMergeRequestChanges(projectPath, mergeRequestIid, {
        includeContent,
        focusFiles,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                changes: changes.changes.map((change) => ({
                  old_path: change.old_path,
                  new_path: change.new_path,
                  new_file: change.new_file,
                  deleted_file: change.deleted_file,
                  renamed_file: change.renamed_file,
                  diff: includeContent ? change.diff : undefined,
                })),
                summary: changes.summary,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: unknown) {
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

