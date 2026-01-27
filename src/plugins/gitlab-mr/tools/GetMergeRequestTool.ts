/**
 * GetMergeRequestTool
 * 
 * 获取合并请求信息的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { IMergeRequestService } from '../../../services/MergeRequestService.js';
import type { IProjectService } from '../../../services/ProjectService.js';

/**
 * GetMergeRequestTool 实现
 */
export class GetMergeRequestTool extends Tool {
  readonly name = 'get_merge_request';
  readonly description = '获取指定项目的合并请求信息';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    mergeRequestIid: z.number().describe('合并请求的内部ID'),
  });
  readonly metadata = {
    category: 'merge-request',
    tags: ['gitlab', 'mr', 'read'],
    plugin: 'gitlab-mr',
    version: '1.0.0',
  };

  constructor(
    private mrService: IMergeRequestService,
    _projectService: IProjectService  // 预留用于未来扩展
  ) {
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, mergeRequestIid } = params as {
      projectPath: string;
      mergeRequestIid: number;
    };

    try {
      const mr = await this.mrService.getMergeRequest(projectPath, mergeRequestIid);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: mr.id,
                iid: mr.iid,
                title: mr.title,
                description: mr.description,
                state: mr.state,
                author: mr.author,
                source_branch: mr.source_branch,
                target_branch: mr.target_branch,
                created_at: mr.created_at,
                updated_at: mr.updated_at,
                web_url: mr.web_url,
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

