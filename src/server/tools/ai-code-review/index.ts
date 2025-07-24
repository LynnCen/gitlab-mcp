import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {  z } from "zod";
import { GitLabClient } from "../../../gitlab/client";
import type { 
  CodeReviewIssue, 
    } from "../../../config/types";
import { analyzeDiffLines, filterReviewableChanges, getCodeReviewRules, getExclusionReason, getFileExtension, shouldReviewFile } from "./helper";




/**
 * 评论分级策略
 */
class CommentPushStrategy {
  static determineCommentType(issue: CodeReviewIssue, lineNumber: number | null): 'inline' | 'file' | 'summary' {
    // Critical问题且有精确行号 -> 行内评论
    if (issue.severity === 'critical' && lineNumber) {
      return 'inline';
    }
    
    // Warning问题且有行号 -> 行内评论
    if (issue.severity === 'warning' && lineNumber) {
      return 'inline';
    }
    
    // 其他问题 -> 文件级评论
    if (lineNumber || issue.severity === 'warning') {
      return 'file';
    }
    
    // 建议类问题 -> 汇总评论
    return 'summary';
  }
  
  static formatInlineComment(issue: CodeReviewIssue, filePath: string): string {
    const severityEmoji = {
      'critical': '🚨',
      'warning': '⚠️', 
      'suggestion': '💡'
    };
    
    return `${severityEmoji[issue.severity]} **${issue.title}**

${issue.description}

**💡 建议**: ${issue.suggestion}

---
*${issue.category} | ${issue.rule_source}*`;
  }
}

/**
 * 注册AI代码审查相关的工具
 */
export function registerAICodeReviewTools(server: McpServer, gitlabClient: GitLabClient): void {
  
  // 获取文件特定的代码审查规则
  server.registerTool(
    "get_file_code_review_rules",
    {
      title: "获取文件代码审查规则",
      description: "根据文件类型和路径获取相应的代码审查规则",
      inputSchema: {
        filePath: z.string().describe("文件路径"),
        fileExtension: z.string().optional().describe("文件扩展名")
      }
    },
    async ({ filePath, fileExtension }) => {
      try {
        const ext = fileExtension || getFileExtension(filePath);
        const rules = getCodeReviewRules(ext);
        const shouldReview = shouldReviewFile(filePath, ext);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                file_path: filePath,
                extension: ext,
                rules,
                should_review: shouldReview,
                message: shouldReview ? "文件需要审查" : "文件已被过滤，不需要审查"
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        throw new Error(`获取代码审查规则失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // 分析MR变更并提供差异信息
  server.registerTool(
    "analyze_mr_changes",
    {
      title: "分析MR变更",
      description: "分析合并请求的文件变更和差异信息，为代码审查提供基础数据",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        focusFiles: z.array(z.string()).optional().describe("重点关注的文件列表")
      }
    },
    async ({ projectPath, mergeRequestIid, focusFiles }) => {
      try {
        console.log(`🔍 开始分析MR变更: ${projectPath}#${mergeRequestIid}`);
        
        // 1. 获取MR基本信息和变更
        const project = await gitlabClient.getProject(projectPath);
        const mr = await gitlabClient.getMergeRequest(project.id, mergeRequestIid);
        const changes = await gitlabClient.getMergeRequestChanges(project.id, mergeRequestIid);
        
        console.log(`📋 MR信息: ${mr.title} by ${mr.author.username}`);
        console.log(`📁 总文件变更: ${changes.changes.length}个`);
        
        // 2. 过滤和预处理文件
        const filteredChanges = filterReviewableChanges(changes.changes, focusFiles);
        console.log(`📋 过滤后需要审查的文件: ${filteredChanges.length}个`);
        
        // 3. 分析每个文件的差异
        const fileAnalysis = filteredChanges.map(change => {
          const diffAnalysis = change.diff ? analyzeDiffLines(change.diff) : null;
          return {
            file_path: change.new_path,
            change_type: change.new_file ? 'new' : change.deleted_file ? 'deleted' : 'modified',
            extension: getFileExtension(change.new_path),
            diff_lines: change.diff ? change.diff.split('\n').length : 0,
            diff_analysis: diffAnalysis,
            raw_diff: change.diff
          };
        });
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                merge_request: {
                  title: mr.title,
                  author: mr.author.username,
                  source_branch: mr.source_branch,
                  target_branch: mr.target_branch,
                  web_url: mr.web_url
                },
                analysis_summary: {
                  total_files: changes.changes.length,
                  reviewable_files: filteredChanges.length,
                  excluded_files: changes.changes.length - filteredChanges.length
                },
                file_analysis: fileAnalysis,
                analyzed_at: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        console.error('❌ MR变更分析失败:', error);
        throw new Error(`MR变更分析失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // 推送代码审查评论（由cursor传入评论内容）
  server.registerTool(
    "push_code_review_comments",
    {
      title: "推送代码审查评论",
      description: "将cursor生成的代码审查评论推送到GitLab MR，支持行内评论和文件级评论",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        reviewComments: z.array(z.object({
          filePath: z.string().describe("文件路径"),
          lineNumber: z.number().optional().describe("行号（可选，用于行内评论）"),
          severity: z.enum(["critical", "warning", "suggestion"]).describe("问题严重级别"),
          title: z.string().describe("问题标题"),
          description: z.string().describe("问题描述"),
          suggestion: z.string().describe("修改建议"),
          category: z.string().optional().default("代码质量").describe("问题分类"),
          autoFixable: z.boolean().optional().default(false).describe("是否可自动修复")
        })).describe("代码审查评论列表"),
        summaryComment: z.string().optional().describe("总体审查评论（可选）"),
        commentStyle: z.enum(["detailed", "summary", "minimal"]).optional().default("detailed").describe("评论风格")
      }
    },
    async ({ projectPath, mergeRequestIid, reviewComments, summaryComment, commentStyle = "detailed" }) => {
      try {
        console.log(`🚀 开始推送代码审查评论: ${projectPath}#${mergeRequestIid}`);
        console.log(`📝 评论数量: ${reviewComments.length}个`);
        
        const project = await gitlabClient.getProject(projectPath);
        
        // 1. 添加总体审查评论（如果提供）
        let summaryResult = null;
        if (summaryComment) {
          try {
            summaryResult = await gitlabClient.addMergeRequestNote(
              project.id, 
              mergeRequestIid, 
              summaryComment
            );
            console.log('✅ 总体审查评论已添加');
          } catch (error) {
            console.warn('⚠️  添加总体审查评论失败:', error);
          }
        }

        // 2. 构建精确的评论请求
        const commentRequests = reviewComments.map(comment => ({
          filePath: comment.filePath,
          lineNumber: comment.lineNumber,
          body: CommentPushStrategy.formatInlineComment({
            line_number: comment.lineNumber,
            severity: comment.severity,
            category: comment.category,
            title: comment.title,
            description: comment.description,
            suggestion: comment.suggestion,
            auto_fixable: comment.autoFixable,
            rule_source: 'Cursor AI Review'
          }, comment.filePath),
          severity: comment.severity
        }));

        // 3. 批量创建评论
        const commentResults = await gitlabClient.batchCreateReviewComments(
          project.id,
          mergeRequestIid,
          commentRequests
        );

        const successCount = commentResults.filter(r => r.success).length;
        const failureCount = commentResults.filter(r => !r.success).length;
        const inlineCount = commentResults.filter(r => r.success && r.lineNumber).length;
        const fileCount = commentResults.filter(r => r.success && !r.lineNumber).length;

        console.log(`✅ 评论推送完成: ${successCount} 成功, ${failureCount} 失败`);
        console.log(`📍 行内评论: ${inlineCount}个, 文件评论: ${fileCount}个`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                summary: {
                  total_comments: reviewComments.length,
                  successful_comments: successCount,
                  failed_comments: failureCount,
                  inline_comments: inlineCount,
                  file_comments: fileCount,
                  summary_comment_added: !!summaryResult
                },
                summary_comment: summaryResult ? { id: summaryResult.id } : null,
                comment_results: commentResults,
                message: `已成功推送 ${successCount} 条代码审查评论到 MR #${mergeRequestIid}`,
                pushed_at: new Date().toISOString()
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        console.error('❌ 推送评论失败:', error);
        throw new Error(`推送评论失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // 调试工具：检查MR的SHA信息
  server.registerTool(
    "debug_mr_sha_info",
    {
      title: "调试MR SHA信息",
      description: "检查合并请求的版本信息、diff_refs和commits，用于调试行内评论问题",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID")
      }
    },
    async ({ projectPath, mergeRequestIid }) => {
      try {
        console.log(`🔍 调试MR SHA信息: ${projectPath}#${mergeRequestIid}`);
        
        const project = await gitlabClient.getProject(projectPath);
        const debugInfo: any = {
          project_id: project.id,
          mr_iid: mergeRequestIid,
          timestamp: new Date().toISOString()
        };

        // 1. 尝试获取版本信息
        try {
          const versions = await (gitlabClient as any).getMergeRequestVersions(project.id, mergeRequestIid);
          debugInfo.versions = {
            success: true,
            count: versions?.length || 0,
            data: versions,
            latest_version: versions?.[0] || null
          };
        } catch (error) {
          debugInfo.versions = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }

        // 2. 获取MR基本信息
        try {
          const mr = await gitlabClient.getMergeRequest(project.id, mergeRequestIid);
          debugInfo.merge_request = {
            success: true,
            sha: (mr as any).sha,
            diff_refs: (mr as any).diff_refs,
            source_branch: (mr as any).source_branch,
            target_branch: (mr as any).target_branch,
            state: (mr as any).state
          };
        } catch (error) {
          debugInfo.merge_request = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }

        // 3. 获取commits信息
        try {
          const commits = await gitlabClient.getMergeRequestCommits(project.id, mergeRequestIid);
          debugInfo.commits = {
            success: true,
            count: commits?.length || 0,
            first_commit: commits?.[0] ? {
              id: commits[0].id,
              short_id: commits[0].short_id,
              title: commits[0].title
            } : null,
            last_commit: commits?.length > 0 ? {
              id: commits[commits.length - 1].id,
              short_id: commits[commits.length - 1].short_id,
              title: commits[commits.length - 1].title
            } : null
          };
        } catch (error) {
          debugInfo.commits = {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          };
        }

        // 4. 分析可用的SHA来源
        const shaAnalysis: any = {
          available_sources: [],
          recommended_method: null
        };

        if (debugInfo.versions.success && debugInfo.versions.latest_version) {
          const v = debugInfo.versions.latest_version;
          const base_sha = v.base_commit_sha || v.base_sha;
          const start_sha = v.start_commit_sha || v.start_sha;
          const head_sha = v.head_commit_sha || v.head_sha;
          
          if (base_sha && start_sha && head_sha) {
            shaAnalysis.available_sources.push({
              method: 'versions_api',
              priority: 1,
              base_sha: base_sha?.substring(0, 8),
              start_sha: start_sha?.substring(0, 8),
              head_sha: head_sha?.substring(0, 8),
              complete: true
            });
            shaAnalysis.recommended_method = 'versions_api';
          }
        }

        if (debugInfo.merge_request.success && debugInfo.merge_request.diff_refs) {
          const dr = debugInfo.merge_request.diff_refs;
          if (dr.base_sha && dr.start_sha && dr.head_sha) {
            shaAnalysis.available_sources.push({
              method: 'diff_refs',
              priority: 2,
              base_sha: dr.base_sha?.substring(0, 8),
              start_sha: dr.start_sha?.substring(0, 8),
              head_sha: dr.head_sha?.substring(0, 8),
              complete: true
            });
            if (!shaAnalysis.recommended_method) {
              shaAnalysis.recommended_method = 'diff_refs';
            }
          }
        }

        if (debugInfo.commits.success && debugInfo.commits.count > 0) {
          shaAnalysis.available_sources.push({
            method: 'commits',
            priority: 3,
            base_sha: debugInfo.commits.first_commit?.id?.substring(0, 8),
            start_sha: debugInfo.commits.first_commit?.id?.substring(0, 8),
            head_sha: debugInfo.commits.last_commit?.id?.substring(0, 8),
            complete: !!(debugInfo.commits.first_commit && debugInfo.commits.last_commit),
            note: '备用方案，可能不够准确'
          });
          if (!shaAnalysis.recommended_method) {
            shaAnalysis.recommended_method = 'commits';
          }
        }

        debugInfo.sha_analysis = shaAnalysis;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(debugInfo, null, 2)
            }
          ]
        };
        
      } catch (error) {
        console.error('❌ 调试信息获取失败:', error);
        throw new Error(`调试信息获取失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // 批量文件过滤工具
  server.registerTool(
    "filter_reviewable_files",
    {
      title: "过滤可审查文件",
      description: "根据配置规则过滤出需要代码审查的文件",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        focusFiles: z.array(z.string()).optional().describe("重点关注的文件列表")
      }
    },
    async ({ projectPath, mergeRequestIid, focusFiles }) => {
      try {
        const project = await gitlabClient.getProject(projectPath);
        const changes = await gitlabClient.getMergeRequestChanges(project.id, mergeRequestIid);
        
        const filteredChanges = filterReviewableChanges(changes.changes, focusFiles);
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                total_files: changes.changes.length,
                reviewable_files: filteredChanges.length,
                filtered_files: filteredChanges.map(change => ({
                  path: change.new_path,
                  extension: getFileExtension(change.new_path),
                  change_type: change.new_file ? 'new' : change.deleted_file ? 'deleted' : 'modified',
                  diff_lines: change.diff ? change.diff.split('\n').length : 0
                })),
                excluded_files: changes.changes
                  .filter(change => !filteredChanges.includes(change))
                  .map(change => ({
                    path: change.new_path,
                    reason: getExclusionReason(change)
                  }))
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        throw new Error(`文件过滤失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}
