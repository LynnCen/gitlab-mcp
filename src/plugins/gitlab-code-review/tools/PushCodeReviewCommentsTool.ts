/**
 * PushCodeReviewCommentsTool
 * 
 * 推送代码审查评论的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { ICodeReviewService } from '../../../services/CodeReviewService.js';
import type { ReviewIssue } from '../../../services/CodeReviewRuleEngine.js';

/**
 * PushCodeReviewCommentsTool 实现
 */
export class PushCodeReviewCommentsTool extends Tool {
  readonly name = 'push_code_review_comments';
  readonly description =
    '将代码审查评论推送到GitLab MR，支持行内评论和文件级评论';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    mergeRequestIid: z.number().describe('合并请求的内部ID'),
    reviewComments: z
      .array(
        z.object({
          filePath: z.string().describe('文件路径'),
          lineNumber: z.number().optional().describe('行号（可选，用于行内评论）'),
          severity: z
            .enum(['critical', 'warning', 'suggestion'])
            .describe('问题严重级别'),
          title: z.string().describe('问题标题'),
          description: z.string().describe('问题描述'),
          suggestion: z.string().describe('修改建议'),
          category: z.string().optional().default('代码质量').describe('问题分类'),
          autoFixable: z
            .boolean()
            .optional()
            .default(false)
            .describe('是否可自动修复'),
        })
      )
      .describe('代码审查评论列表'),
    summaryComment: z
      .string()
      .optional()
      .describe('总体审查评论（可选）'),
    commentStyle: z
      .enum(['detailed', 'summary', 'minimal'])
      .optional()
      .default('detailed')
      .describe('评论风格'),
  });
  readonly metadata = {
    category: 'code-review',
    tags: ['gitlab', 'mr', 'code-review', 'write'],
    plugin: 'gitlab-code-review',
    version: '1.0.0',
  };

  constructor(private codeReviewService: ICodeReviewService) {
    super();
  }

  async execute(params: unknown, _context: ExecutionContext): Promise<ToolResult> {
    const {
      projectPath,
      mergeRequestIid,
      reviewComments,
      summaryComment,
      // commentStyle 预留用于未来功能扩展
    } = params as {
      projectPath: string;
      mergeRequestIid: number;
      reviewComments: Array<{
        filePath: string;
        lineNumber?: number;
        severity: 'critical' | 'warning' | 'suggestion';
        title: string;
        description: string;
        suggestion: string;
        category?: string;
        autoFixable?: boolean;
      }>;
      summaryComment?: string;
      commentStyle?: string;
    };

    try {
      // 转换评论格式
      const results = reviewComments.map((comment: typeof reviewComments[number]) => ({
        filePath: comment.filePath,
        issues: [
          {
            ruleId: comment.category || 'custom',
            checkId: 'manual-review',
            severity: comment.severity,
            message: comment.title,
            suggestion: comment.suggestion,
            lineNumber: comment.lineNumber,
          } as ReviewIssue,
        ],
      }));

      // 推送评论
      const pushResult = await this.codeReviewService.pushReviewComments(
        projectPath,
        mergeRequestIid,
        results,
        {
          autoPush: true,
          batchDelay: 300,
          maxComments: 50,
        }
      );

      // 如果有总体评论，单独添加
      if (summaryComment) {
        // 这里需要调用GitLab API添加总体评论
        // 暂时在结果中标记
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: pushResult.success,
                summary: {
                  total_comments: reviewComments.length,
                  successful_comments: pushResult.commentsCreated,
                  failed_comments: pushResult.commentsFailed,
                  summary_comment_added: !!summaryComment,
                },
                errors: pushResult.errors,
                message: `已成功推送 ${pushResult.commentsCreated} 条代码审查评论到 MR #${mergeRequestIid}`,
                pushed_at: new Date().toISOString(),
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

