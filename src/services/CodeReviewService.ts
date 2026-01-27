/**
 * CodeReviewService
 * 
 * 代码审查相关的业务逻辑服务
 */

import type { IGitLabRepository } from '../repositories/GitLabRepository.js';
import type { ILogger } from '../logging/types.js';
import { CodeReviewRuleEngine } from './CodeReviewRuleEngine.js';
import type { MergeRequestService } from './MergeRequestService.js';
import type {
  ReviewResult,
  ReviewIssue,
  ReviewRule,
} from './CodeReviewRuleEngine.js';
import type { MergeRequestChangesResult } from './types.js';
import type { GitLabPosition } from '../repositories/types.js';

/**
 * 审查选项
 */
export interface ReviewOptions {
  /**
   * 重点关注的文件
   */
  focusFiles?: string[];

  /**
   * 自定义规则
   */
  customRules?: ReviewRule[];

  /**
   * 严重级别过滤
   */
  severityFilter?: ('critical' | 'warning' | 'suggestion')[];
}

/**
 * 审查报告
 */
export interface ReviewReport {
  projectPath: string;
  mrIid: number;
  totalFiles: number;
  reviewedFiles: number;
  totalIssues: number;
  issuesBySeverity: {
    critical: number;
    warning: number;
    suggestion: number;
  };
  results: ReviewResult[];
}

/**
 * 推送选项
 */
export interface PushOptions {
  /**
   * 是否自动推送（否则只返回评论）
   */
  autoPush?: boolean;

  /**
   * 批量推送延迟（毫秒）
   */
  batchDelay?: number;

  /**
   * 最大评论数
   */
  maxComments?: number;
}

/**
 * 推送结果
 */
export interface PushResult {
  success: boolean;
  commentsCreated: number;
  commentsFailed: number;
  errors?: string[];
}

/**
 * CodeReviewService 接口
 */
export interface ICodeReviewService {
  /**
   * 分析合并请求变更
   */
  analyzeMergeRequest(
    projectPath: string,
    mrIid: number,
    options?: ReviewOptions
  ): Promise<ReviewReport>;

  /**
   * 应用审查规则
   */
  applyReviewRules(
    changes: MergeRequestChangesResult,
    options?: ReviewOptions
  ): Promise<ReviewResult[]>;

  /**
   * 推送审查评论
   */
  pushReviewComments(
    projectPath: string,
    mrIid: number,
    results: ReviewResult[],
    options?: PushOptions
  ): Promise<PushResult>;
}

/**
 * CodeReviewService 实现
 */
export class CodeReviewService implements ICodeReviewService {
  private ruleEngine: CodeReviewRuleEngine;

  constructor(
    private gitlabRepo: IGitLabRepository,
    private mrService: MergeRequestService,
    private logger?: ILogger
  ) {
    this.ruleEngine = new CodeReviewRuleEngine(logger);
  }

  /**
   * 分析合并请求变更
   */
  async analyzeMergeRequest(
    projectPath: string,
    mrIid: number,
    options: ReviewOptions = {}
  ): Promise<ReviewReport> {
    // 加载自定义规则
    if (options.customRules) {
      this.ruleEngine.loadRules(options.customRules);
    }

    // 获取 MR 变更
    const changes = await this.mrService.getMergeRequestChanges(
      projectPath,
      mrIid,
      {
        includeContent: true,
        focusFiles: options.focusFiles,
      }
    );

    // 应用审查规则
    const results = await this.applyReviewRules(changes, options);

    // 过滤严重级别
    let filteredResults = results;
    if (options.severityFilter && options.severityFilter.length > 0) {
      filteredResults = results.map((result) => ({
        ...result,
        issues: result.issues.filter((issue) =>
          options.severityFilter!.includes(issue.severity)
        ),
      })).filter((result) => result.issues.length > 0);
    }

    // 统计信息
    const totalIssues = filteredResults.reduce(
      (sum, result) => sum + result.issues.length,
      0
    );
    const issuesBySeverity = {
      critical: filteredResults.reduce(
        (sum, result) =>
          sum + result.issues.filter((i) => i.severity === 'critical').length,
        0
      ),
      warning: filteredResults.reduce(
        (sum, result) =>
          sum + result.issues.filter((i) => i.severity === 'warning').length,
        0
      ),
      suggestion: filteredResults.reduce(
        (sum, result) =>
          sum +
          result.issues.filter((i) => i.severity === 'suggestion').length,
        0
      ),
    };

    return {
      projectPath,
      mrIid,
      totalFiles: changes.changes.length,
      reviewedFiles: filteredResults.length,
      totalIssues,
      issuesBySeverity,
      results: filteredResults,
    };
  }

  /**
   * 应用审查规则
   */
  async applyReviewRules(
    changes: MergeRequestChangesResult,
    options: ReviewOptions = {}
  ): Promise<ReviewResult[]> {
    return this.ruleEngine.reviewMergeRequestChanges(changes.changes);
  }

  /**
   * 推送审查评论
   */
  async pushReviewComments(
    projectPath: string,
    mrIid: number,
    results: ReviewResult[],
    options: PushOptions = {}
  ): Promise<PushResult> {
    const projectId = await this.getProjectId(projectPath);
    const maxComments = options.maxComments || 50;
    const batchDelay = options.batchDelay || 300;

    let commentsCreated = 0;
    let commentsFailed = 0;
    const errors: string[] = [];

    // 获取 MR 信息以获取 SHA
    const mr = await this.mrService.getMergeRequest(projectPath, mrIid);
    const changes = await this.mrService.getMergeRequestChanges(
      projectPath,
      mrIid
    );

    // 构建文件路径到变更的映射
    const changeMap = new Map(
      changes.changes.map((change) => [
        change.new_path || change.old_path,
        change,
      ])
    );

    // 按严重级别排序（critical > warning > suggestion）
    const sortedResults = results
      .flatMap((result) =>
        result.issues.map((issue) => ({ result, issue }))
      )
      .sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, suggestion: 2 };
        return (
          severityOrder[a.issue.severity] - severityOrder[b.issue.severity]
        );
      })
      .slice(0, maxComments);

    for (const { result, issue } of sortedResults) {
      try {
        const change = changeMap.get(result.filePath);
        if (!change) {
          continue;
        }

        // 构建评论内容
        const commentBody = this.formatComment(issue, result.filePath);

        // 如果是行内评论，尝试创建讨论
        if (issue.lineNumber && change.new_file) {
          try {
            // 获取 MR 版本信息以获取 SHA
            const versions = await this.gitlabRepo.getMergeRequestVersions(
              projectId,
              mrIid
            );
            const latestVersion = versions[0];

            const position: GitLabPosition = {
              base_sha: latestVersion?.base_commit_sha || '',
              start_sha: latestVersion?.start_commit_sha || '',
              head_sha: latestVersion?.head_commit_sha || '',
              old_path: result.filePath,
              new_path: result.filePath,
              position_type: 'text',
              new_line: issue.lineNumber,
            };

            await this.gitlabRepo.createDiscussion(
              projectId,
              mrIid,
              commentBody,
              position
            );
            commentsCreated++;
          } catch (error) {
            // 如果行内评论失败，降级为普通评论
            this.logger?.warn('Failed to create inline comment, falling back to note', {
              error,
            });
            await this.gitlabRepo.createNote(projectId, mrIid, commentBody);
            commentsCreated++;
          }
        } else {
          // 普通评论
          await this.gitlabRepo.createNote(projectId, mrIid, commentBody);
          commentsCreated++;
        }

        // 批量延迟
        if (commentsCreated < sortedResults.length) {
          await this.sleep(batchDelay);
        }
      } catch (error) {
        commentsFailed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to create comment for ${result.filePath}: ${errorMsg}`);
        this.logger?.error('Failed to create review comment', {
          projectPath,
          mrIid,
          filePath: result.filePath,
          error,
        });
      }
    }

    return {
      success: commentsFailed === 0,
      commentsCreated,
      commentsFailed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * 格式化评论内容
   */
  private formatComment(issue: ReviewIssue, filePath: string): string {
    const severityEmoji = {
      critical: '🔴',
      warning: '🟡',
      suggestion: '💡',
    };

    return `## ${severityEmoji[issue.severity]} ${issue.severity.toUpperCase()}: ${issue.message}

**文件**: \`${filePath}\`
${issue.lineNumber ? `**行号**: ${issue.lineNumber}` : ''}

**建议**: ${issue.suggestion}

${issue.code ? `\`\`\`\n${issue.code}\n\`\`\`` : ''}
`;
  }

  /**
   * 获取项目 ID
   */
  private async getProjectId(projectPath: string): Promise<string | number> {
    const project = await this.gitlabRepo.getProject(projectPath);
    return project.id;
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

