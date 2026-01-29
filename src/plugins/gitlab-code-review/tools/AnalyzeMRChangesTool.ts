/**
 * AnalyzeMRChangesTool
 * 
 * 分析MR变更的工具
 */

import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';
import type { ICodeReviewService } from '../../../services/CodeReviewService.js';

/**
 * AnalyzeMRChangesTool 实现
 */
export class AnalyzeMRChangesTool extends Tool {
  readonly name = 'analyze_mr_changes';
  readonly description = '分析合并请求的文件变更和差异信息，为代码审查提供基础数据';
  readonly inputSchema = z.object({
    projectPath: z.string().describe('项目路径，格式: owner/repo'),
    mergeRequestIid: z.number().describe('合并请求的内部ID'),
    focusFiles: z.array(z.string()).optional().describe('重点关注的文件列表'),
  });
  readonly metadata = {
    category: 'code-review',
    tags: ['gitlab', 'mr', 'code-review', 'analysis'],
    plugin: 'gitlab-code-review',
    version: '1.0.0',
  };

  constructor(private codeReviewService: ICodeReviewService) {
    super();
  }

  async execute(params: any, context: ExecutionContext): Promise<ToolResult> {
    const { projectPath, mergeRequestIid, focusFiles } = params;

    try {
      const report = await this.codeReviewService.analyzeMergeRequest(
        projectPath,
        mergeRequestIid,
        {
          focusFiles,
        }
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                merge_request: {
                  project_path: report.projectPath,
                  iid: report.mrIid,
                },
                analysis_summary: {
                  total_files: report.totalFiles,
                  reviewed_files: report.reviewedFiles,
                  total_issues: report.totalIssues,
                  issues_by_severity: report.issuesBySeverity,
                },
                results: report.results.map((result) => ({
                  file_path: result.filePath,
                  issues_count: result.issues.length,
                  issues: result.issues.map((issue) => ({
                    rule_id: issue.ruleId,
                    check_id: issue.checkId,
                    severity: issue.severity,
                    message: issue.message,
                    suggestion: issue.suggestion,
                    line_number: issue.lineNumber,
                  })),
                })),
                analyzed_at: new Date().toISOString(),
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

