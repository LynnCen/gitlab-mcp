/**
 * UpdateMergeRequestDescriptionTool
 * 
 * 更新合并请求描述的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * UpdateMergeRequestDescriptionTool 实现
 */
export class UpdateMergeRequestDescriptionTool extends Tool {
  readonly name = 'update_merge_request_description';
  readonly description = '更新指定合并请求的描述信息，支持Markdown格式';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    mergeRequestIid: z.number().describe('合并请求的内部ID'),
    description: z.string().describe('新的描述内容，支持Markdown格式'),
  });
  readonly metadata = {
    category: 'merge-request',
    tags: ['gitlab', 'mr', 'write', 'update'],
    plugin: 'gitlab-mr',
    version: '1.0.0',
  };

  constructor(private mrService: IMergeRequestService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, mergeRequestIid, description } = params as {
      projectPath: string;
      mergeRequestIid: number;
      description: string;
    };

    try {
      const updatedMr = await this.mrService.updateMergeRequestDescription(
        projectPath,
        mergeRequestIid,
        description
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: true,
                message: '合并请求描述更新成功',
                merge_request: {
                  id: updatedMr.id,
                  iid: updatedMr.iid,
                  title: updatedMr.title,
                  description: updatedMr.description,
                  state: updatedMr.state,
                  author: updatedMr.author as Record<string, unknown>,
                  source_branch: String(updatedMr.source_branch),
                  target_branch: String(updatedMr.target_branch),
                  created_at: updatedMr.created_at,
                  updated_at: updatedMr.updated_at,
                  web_url: String(updatedMr.web_url || ''),
                  description_length: updatedMr.description
                    ? updatedMr.description.length
                    : 0,
                },
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

