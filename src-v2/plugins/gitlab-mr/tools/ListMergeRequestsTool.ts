/**
 * ListMergeRequestsTool
 * 
 * 列出合并请求的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';

/**
 * ListMergeRequestsTool 实现
 */
export class ListMergeRequestsTool extends Tool {
  readonly name = 'list_merge_requests';
  readonly description = '列出项目的合并请求';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    state: z.enum(['opened', 'closed', 'merged', 'all']).optional().default('opened').describe('合并请求状态'),
    perPage: z.number().optional().default(20).describe('每页返回的数量'),
    page: z.number().optional().default(1).describe('页码'),
  });
  readonly metadata = {
    category: 'merge-request',
    tags: ['gitlab', 'mr', 'list', 'read'],
    plugin: 'gitlab-mr',
    version: '1.0.0',
  };

  constructor(private mrService: IMergeRequestService) {
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, state = 'opened', perPage = 20, page = 1 } = params as {
      projectPath: string;
      state?: 'opened' | 'closed' | 'merged' | 'all';
      perPage?: number;
      page?: number;
    };

    try {
      const mrs = await this.mrService.listMergeRequests(projectPath, {
        state,
        per_page: perPage,
        page,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                total: mrs.length,
                merge_requests: mrs.map((mr) => ({
                  id: mr.id,
                  iid: mr.iid,
                  title: mr.title,
                  state: mr.state,
                  author: mr.author,
                  source_branch: mr.source_branch,
                  target_branch: mr.target_branch,
                  created_at: mr.created_at,
                  updated_at: mr.updated_at,
                  web_url: mr.web_url,
                })),
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

