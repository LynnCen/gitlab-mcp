import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GitLabClient } from "../../gitlab/client";
import type { 
  AICodeReviewResult, 
  CodeReviewIssue, 
  CodeReviewRules, 
  FileFilterConfig,
  CodeReviewReport,
  GitLabFileChange 
} from "../../config/types";

/**
 * 代码审查规则配置
 */
const CODE_REVIEW_RULES: Record<string, CodeReviewRules> = {
  '.ts': {
    focus_areas: ['类型安全', '性能优化', '代码规范', '错误处理'],
    specific_rules: [
      '确保所有函数都有明确的返回类型',
      '避免使用 any 类型，使用具体类型或泛型',
      '异步函数必须正确处理错误',
      '组件和函数名使用 PascalCase 或 camelCase',
      '避免在循环中进行异步操作',
      '使用 const assertions 来获得更精确的类型推断'
    ],
    ignore_patterns: ['*.d.ts', '*.test.ts', '*.spec.ts'],
    severity_mapping: {
      'any类型使用': 'warning',
      '未处理的Promise': 'critical',
      '循环中的异步操作': 'warning',
      '缺少类型注解': 'suggestion'
    }
  },
  '.vue': {
    focus_areas: ['组件设计', '性能优化', 'Vue最佳实践', '可访问性'],
    specific_rules: [
      'template 中避免复杂的表达式',
      '合理使用 computed 和 watch',
      '确保组件的 props 有正确的类型定义',
      'emit 事件需要明确定义类型',
      '避免在 template 中直接修改 props',
      '使用正确的生命周期钩子'
    ],
    ignore_patterns: [],
    severity_mapping: {
      'template表达式过于复杂': 'warning',
      'props缺少类型': 'warning',
      '直接修改props': 'critical'
    }
  },
  '.js': {
    focus_areas: ['ES6+语法', '性能', '错误处理', '代码规范'],
    specific_rules: [
      '使用 const/let 替代 var',
      '使用箭头函数或 function 声明',
      '避免回调地狱，使用 Promise 或 async/await',
      '正确处理异常和错误',
      '使用严格模式',
      '避免全局变量污染'
    ],
    ignore_patterns: ['*.min.js', '*.bundle.js'],
    severity_mapping: {
      '使用var声明': 'suggestion',
      '回调地狱': 'warning',
      '未处理异常': 'critical'
    }
  }
};

/**
 * 文件过滤配置
 */
const FILE_FILTER_CONFIG: FileFilterConfig = {
  includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.cs', '.go', '.rs'],
  excludePatterns: [
    /node_modules/,
    /dist/,
    /build/,
    /\.git/,
    /coverage/,
    /\.nyc_output/,
    /\.next/,
    /\.nuxt/,
    /\.vuepress/,
    /\.temp/,
    /\.cache/,
    /\.DS_Store/,
    /\.env/,
    /\.log$/,
    /\.lock$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /\.map$/,
    /\.min\./,
    /\.d\.ts$/,
    /\.test\./,
    /\.spec\./,
    /\.stories\./,
    /\.config\./,
    /\.md$/,
    /README/i,
    /CHANGELOG/i,
    /LICENSE/i
  ],
  maxFileSize: 100 * 1024, // 100KB
  maxDiffLines: 500
};

/**
 * 注册AI代码审查相关的工具
 */
export function registerAICodeReviewTools(server: McpServer, gitlabClient: GitLabClient): void {
  
  // 获取文件特定的代码审查规则
  server.tool(
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
        const rules = getCodeReviewRules(ext, filePath);
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

  // AI代码审查主工具
  server.tool(
    "ai_code_review",
    {
      title: "AI代码审查",
      description: "对指定的合并请求进行智能代码审查，基于最佳实践和规则引擎",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        autoComment: z.boolean().optional().default(false).describe("是否自动添加审查评论到MR"),
        reviewDepth: z.enum(["quick", "standard", "thorough"]).optional().default("standard").describe("审查深度"),
        focusFiles: z.array(z.string()).optional().describe("重点审查的文件列表，留空则审查所有相关文件"),
        commentStyle: z.enum(["detailed", "summary", "minimal"]).optional().default("detailed").describe("评论风格")
      }
    },
    async ({ projectPath, mergeRequestIid, autoComment = false, reviewDepth = "standard", focusFiles, commentStyle = "detailed" }) => {
      try {
        console.log(`🔍 开始AI代码审查: ${projectPath}#${mergeRequestIid}`);
        
        // 1. 获取MR基本信息和变更
        const project = await gitlabClient.getProject(projectPath);
        const mr = await gitlabClient.getMergeRequest(project.id, mergeRequestIid);
        const changes = await gitlabClient.getMergeRequestChanges(project.id, mergeRequestIid);
        
        console.log(`📋 MR信息: ${mr.title} by ${mr.author.username}`);
        console.log(`📁 总文件变更: ${changes.changes.length}个`);
        
        // 2. 过滤和预处理文件
        const filteredChanges = filterReviewableChanges(changes.changes, focusFiles);
        console.log(`📋 过滤后需要审查的文件: ${filteredChanges.length}个`);
        
        if (filteredChanges.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  message: "没有找到需要审查的文件",
                  total_changes: changes.changes.length,
                  filtered_files: filteredChanges.map(c => c.new_path),
                  skipped_reason: "所有文件都被过滤规则排除或不在支持的文件类型范围内"
                }, null, 2)
              }
            ]
          };
        }
        
        // 3. 进行AI审查
        const reviewResults = await performBatchAIReview(filteredChanges, reviewDepth);
        
        // 4. 生成审查报告
        const reviewReport = generateReviewReport(reviewResults, mr);
        
        // 5. 如果启用自动评论，推送到GitLab
        let commentResult = null;
        if (autoComment && reviewResults.length > 0) {
          commentResult = await pushReviewCommentsToGitLab(
            gitlabClient, 
            project.id, 
            mergeRequestIid, 
            reviewResults, 
            reviewReport,
            commentStyle
          );
        }
        
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
                review_summary: reviewReport,
                detailed_results: reviewResults,
                auto_commented: autoComment,
                comment_result: commentResult,
                reviewed_at: new Date().toISOString(),
                review_settings: {
                  depth: reviewDepth,
                  focus_files: focusFiles,
                  comment_style: commentStyle
                }
              }, null, 2)
            }
          ]
        };
        
      } catch (error) {
        console.error('❌ AI代码审查失败:', error);
        throw new Error(`AI代码审查失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
  
  // 手动推送审查评论
  server.tool(
    "push_review_comments",
    {
      title: "推送审查评论",
      description: "将代码审查结果手动推送到GitLab MR评论",
      inputSchema: {
        projectPath: z.string().describe("项目路径，格式: owner/repo"),
        mergeRequestIid: z.number().describe("合并请求的内部ID"),
        reviewResults: z.string().describe("审查结果JSON字符串"),
        reviewReport: z.string().optional().describe("审查报告JSON字符串"),
        commentStyle: z.enum(["detailed", "summary", "minimal"]).optional().default("detailed").describe("评论风格")
      }
    },
    async ({ projectPath, mergeRequestIid, reviewResults, reviewReport, commentStyle = "detailed" }) => {
      try {
        const project = await gitlabClient.getProject(projectPath);
        
        // 解析JSON字符串
        const parsedResults: AICodeReviewResult[] = JSON.parse(reviewResults);
        const parsedReport = reviewReport ? JSON.parse(reviewReport) : null;
        
        const pushResult = await pushReviewCommentsToGitLab(
          gitlabClient, 
          project.id, 
          mergeRequestIid, 
          parsedResults, 
          parsedReport,
          commentStyle
        );
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(pushResult, null, 2)
            }
          ]
        };
      } catch (error) {
        throw new Error(`推送评论失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );

  // 批量文件过滤工具
  server.tool(
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

/**
 * 获取文件扩展名
 */
function getFileExtension(filePath: string): string {
  const match = filePath.match(/\.([^.]+)$/);
  return match ? `.${match[1]}` : '';
}

/**
 * 获取文件的代码审查规则
 */
function getCodeReviewRules(extension: string, filePath: string): CodeReviewRules {
  const rules = CODE_REVIEW_RULES[extension];
  if (!rules) {
    return {
      focus_areas: ['基础代码质量', '可读性', '维护性'],
      specific_rules: [
        '确保代码逻辑清晰',
        '避免过度复杂的嵌套',
        '函数和变量命名要有意义',
        '添加必要的注释'
      ],
      ignore_patterns: [],
      severity_mapping: {}
    };
  }
  
  return rules;
}

/**
 * 判断文件是否需要审查
 */
function shouldReviewFile(filePath: string, extension: string): boolean {
  // 检查扩展名
  if (!FILE_FILTER_CONFIG.includedExtensions.includes(extension)) {
    return false;
  }
  
  // 检查排除模式
  for (const pattern of FILE_FILTER_CONFIG.excludePatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 过滤可审查的变更
 */
function filterReviewableChanges(changes: GitLabFileChange[], focusFiles?: string[]): GitLabFileChange[] {
  return changes.filter(change => {
    // 如果指定了重点文件，只审查指定文件
    if (focusFiles && focusFiles.length > 0) {
      return focusFiles.some(file => change.new_path.includes(file));
    }
    
    // 排除删除的文件
    if (change.deleted_file) {
      return false;
    }
    
    // 检查文件是否应该被审查
    const extension = getFileExtension(change.new_path);
    if (!shouldReviewFile(change.new_path, extension)) {
      return false;
    }
    
    // 检查diff大小
    if (change.diff && change.diff.split('\n').length > FILE_FILTER_CONFIG.maxDiffLines) {
      console.log(`⚠️  文件 ${change.new_path} diff过大，跳过审查`);
      return false;
    }
    
    return true;
  });
}

/**
 * 获取文件被排除的原因
 */
function getExclusionReason(change: GitLabFileChange): string {
  if (change.deleted_file) {
    return '文件已删除';
  }
  
  const extension = getFileExtension(change.new_path);
  if (!FILE_FILTER_CONFIG.includedExtensions.includes(extension)) {
    return '文件类型不支持';
  }
  
  for (const pattern of FILE_FILTER_CONFIG.excludePatterns) {
    if (pattern.test(change.new_path)) {
      return '匹配排除模式';
    }
  }
  
  if (change.diff && change.diff.split('\n').length > FILE_FILTER_CONFIG.maxDiffLines) {
    return 'diff过大';
  }
  
  return '未知原因';
}

/**
 * 批量进行AI审查 (模拟实现)
 */
async function performBatchAIReview(
  changes: GitLabFileChange[], 
  reviewDepth: string
): Promise<AICodeReviewResult[]> {
  const results: AICodeReviewResult[] = [];
  
  console.log(`🤖 开始进行批量AI审查，深度: ${reviewDepth}...`);
  
  for (const change of changes) {
    try {
      const extension = getFileExtension(change.new_path);
      const rules = getCodeReviewRules(extension, change.new_path);
      
      // 这里应该调用实际的LLM API，目前使用模拟实现
      const result = await simulateAIReview(change, rules, reviewDepth);
      
      results.push({
        file_path: change.new_path,
        overall_score: result.overall_score,
        issues: result.issues,
        suggestions: result.suggestions,
        compliance_status: result.compliance_status
      });
      
      console.log(`✅ 审查完成: ${change.new_path} (评分: ${result.overall_score})`);
      
    } catch (error) {
      console.error(`❌ 审查文件 ${change.new_path} 失败:`, error);
      // 继续处理其他文件
    }
  }
  
  return results;
}

/**
 * 模拟AI审查 (在实际使用中应该替换为真实的LLM调用)
 */
async function simulateAIReview(
  change: GitLabFileChange, 
  rules: CodeReviewRules,
  reviewDepth: string
): Promise<{
  overall_score: number;
  issues: CodeReviewIssue[];
  suggestions: string[];
  compliance_status: 'PASS' | 'WARNING' | 'CRITICAL';
}> {
  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockIssues: CodeReviewIssue[] = [];
  const mockSuggestions: string[] = [];
  
  // 根据文件类型和内容生成模拟问题
  const extension = getFileExtension(change.new_path);
  
  if (extension === '.ts' || extension === '.js') {
    if (change.diff?.includes('console.log')) {
      mockIssues.push({
        line_number: Math.floor(Math.random() * 50) + 1,
        severity: 'warning',
        category: '代码质量',
        title: '包含调试语句',
        description: '代码中包含console.log调试语句',
        suggestion: '移除console.log语句或使用正式的日志框架',
        auto_fixable: true,
        rule_source: '代码清理最佳实践'
      });
    }
    
    if (change.diff?.includes('any')) {
      mockIssues.push({
        line_number: Math.floor(Math.random() * 50) + 1,
        severity: 'warning',
        category: '类型安全',
        title: '使用了any类型',
        description: '使用any类型会失去TypeScript的类型检查优势',
        suggestion: '使用具体的类型定义或泛型来替代any',
        auto_fixable: false,
        rule_source: 'TypeScript最佳实践'
      });
    }
  }
  
  if (extension === '.vue') {
    mockSuggestions.push('建议使用Composition API来提高代码复用性');
    mockSuggestions.push('考虑为组件添加必要的prop验证');
  }
  
  // 根据审查深度调整问题数量
  const issueMultiplier = reviewDepth === 'quick' ? 0.5 : reviewDepth === 'thorough' ? 1.5 : 1;
  const finalIssueCount = Math.max(1, Math.floor(mockIssues.length * issueMultiplier));
  
  if (mockIssues.length === 0) {
    mockSuggestions.push('代码质量良好，建议继续保持');
    mockSuggestions.push('考虑添加更多的单元测试覆盖');
  }
  
  const criticalCount = mockIssues.filter(i => i.severity === 'critical').length;
  const warningCount = mockIssues.filter(i => i.severity === 'warning').length;
  
  const overall_score = Math.max(60, 100 - (criticalCount * 20) - (warningCount * 10) - (mockIssues.length * 2));
  const compliance_status = criticalCount > 0 ? 'CRITICAL' : warningCount > 0 ? 'WARNING' : 'PASS';
  
  return {
    overall_score,
    issues: mockIssues.slice(0, finalIssueCount),
    suggestions: mockSuggestions,
    compliance_status
  };
}

/**
 * 生成审查报告
 */
function generateReviewReport(results: AICodeReviewResult[], mr: any): CodeReviewReport {
  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const criticalIssues = results.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.severity === 'critical').length, 0);
  const warnings = results.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.severity === 'warning').length, 0);
  const suggestions = results.reduce((sum, result) => 
    sum + result.issues.filter(issue => issue.severity === 'suggestion').length, 0);
  
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, result) => sum + result.overall_score, 0) / results.length)
    : 0;
  
  const overallStatus = criticalIssues > 0 ? 'CRITICAL' : 
                       warnings > 0 ? 'WARNING' : 'PASS';
  
  const recommendations = generateOverallRecommendations(results, mr);
  
  return {
    summary: {
      files_reviewed: results.length,
      total_issues: totalIssues,
      critical_issues: criticalIssues,
      warnings: warnings,
      suggestions: suggestions,
      average_score: averageScore,
      overall_status: overallStatus
    },
    recommendations,
    review_metadata: {
      reviewed_by: 'AI Code Reviewer',
      review_time: new Date().toISOString(),
      mr_info: {
        title: mr.title,
        author: mr.author.username,
        changes_count: results.length
      }
    }
  };
}

/**
 * 生成总体建议
 */
function generateOverallRecommendations(results: AICodeReviewResult[], mr: any): string[] {
  const recommendations: string[] = [];
  
  const criticalCount = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.severity === 'critical').length, 0);
  const warningCount = results.reduce((sum, r) => 
    sum + r.issues.filter(i => i.severity === 'warning').length, 0);
  
  if (criticalCount > 0) {
    recommendations.push(`🚨 发现 ${criticalCount} 个严重问题，强烈建议在合并前修复`);
  }
  
  if (warningCount > 3) {
    recommendations.push(`⚠️  发现较多警告问题 (${warningCount}个)，建议优先处理`);
  }
  
  if (results.length > 15) {
    recommendations.push('📊 此MR涉及文件较多，建议考虑拆分为更小的MR便于审查和测试');
  }
  
  const lowScoreFiles = results.filter(r => r.overall_score < 70);
  if (lowScoreFiles.length > 0) {
    recommendations.push(`📉 ${lowScoreFiles.length} 个文件质量评分较低(<70分)，需要重点关注`);
  }
  
  // 基于文件类型的建议
  const hasTestFiles = results.some(r => r.file_path.includes('.test.') || r.file_path.includes('.spec.'));
  const hasSourceFiles = results.some(r => !r.file_path.includes('.test.') && !r.file_path.includes('.spec.'));
  
  if (hasSourceFiles && !hasTestFiles) {
    recommendations.push('🧪 建议为新功能添加相应的单元测试');
  }
  
  return recommendations;
}

/**
 * 推送审查评论到GitLab
 */
async function pushReviewCommentsToGitLab(
  gitlabClient: GitLabClient,
  projectId: string | number,
  mergeRequestIid: number,
  reviewResults: AICodeReviewResult[],
  reviewReport?: CodeReviewReport | null,
  commentStyle: string = "detailed"
): Promise<any> {
  try {
    console.log('🚀 开始推送审查评论到GitLab...');
    
    const comments = [];
    
    // 1. 添加总体审查报告评论
    if (reviewReport) {
      const summaryComment = generateSummaryComment(reviewReport, commentStyle);
      try {
        const summaryResult = await gitlabClient.addMergeRequestNote(projectId, mergeRequestIid, summaryComment);
        comments.push({ type: 'summary', id: summaryResult.id });
        console.log('✅ 总体报告评论已添加');
      } catch (error) {
        console.warn('⚠️  添加总体报告评论失败:', error);
      }
    }
    
    // 2. 为重要问题添加单独评论
    let issueCommentCount = 0;
    for (const result of reviewResults) {
      const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
      const warningIssues = result.issues.filter(issue => issue.severity === 'warning');
      
      // 只为critical和warning问题添加独立评论（避免太多spam）
      const importantIssues = [...criticalIssues, ...warningIssues.slice(0, 2)]; // 最多2个warning
      
      for (const issue of importantIssues) {
        const issueComment = generateIssueComment(issue, result.file_path);
        try {
          const commentResult = await gitlabClient.addMergeRequestNote(projectId, mergeRequestIid, issueComment);
          comments.push({ 
            type: 'issue', 
            file: result.file_path, 
            severity: issue.severity,
            id: commentResult.id 
          });
          issueCommentCount++;
        } catch (error) {
          console.warn(`⚠️  无法添加问题评论 ${result.file_path}:`, error);
        }
      }
    }
    
    console.log(`✅ 成功推送 ${comments.length} 条审查评论 (包含 ${issueCommentCount} 个问题评论)`);
    
    return {
      success: true,
      comments_added: comments.length,
      issue_comments: issueCommentCount,
      comments_details: comments,
      message: `已成功将AI代码审查结果推送到MR #${mergeRequestIid}`
    };
    
  } catch (error) {
    console.error('❌ 推送评论失败:', error);
    throw new Error(`推送评论失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成总体评论
 */
function generateSummaryComment(reviewReport: CodeReviewReport, style: string): string {
  const { summary, recommendations } = reviewReport;
  
  if (style === "minimal") {
    return `## 🤖 AI代码审查结果
    
**总体评分**: ${summary.average_score}/100 | **状态**: ${getStatusEmoji(summary.overall_status)} ${summary.overall_status}

${summary.critical_issues > 0 ? `🚨 ${summary.critical_issues} 个严重问题` : ''}
${summary.warnings > 0 ? `⚠️ ${summary.warnings} 个警告` : ''}
${summary.suggestions > 0 ? `💡 ${summary.suggestions} 个建议` : ''}`;
  }
  
  if (style === "summary") {
    return `## 🤖 AI代码审查报告

### 📊 审查概况
- **文件数量**: ${summary.files_reviewed}个
- **总体评分**: ${summary.average_score}/100
- **审查状态**: ${getStatusEmoji(summary.overall_status)} ${summary.overall_status}

### 🔍 问题统计
- 🚨 严重问题: ${summary.critical_issues}个
- ⚠️ 警告: ${summary.warnings}个  
- 💡 建议: ${summary.suggestions}个

${recommendations.length > 0 ? `\n### 📋 总体建议\n${recommendations.map((rec: string) => `- ${rec}`).join('\n')}` : ''}`;
  }
  
  // detailed style
  return `## 🤖 AI代码审查详细报告

### 📊 审查概况
- **审查文件**: ${summary.files_reviewed} 个
- **总体评分**: ${summary.average_score}/100 ⭐
- **审查状态**: ${getStatusEmoji(summary.overall_status)} **${summary.overall_status}**

### 🔍 问题分析
| 类型 | 数量 | 说明 |
|------|------|------|
| 🚨 严重问题 | ${summary.critical_issues} | 必须在合并前修复 |
| ⚠️ 警告 | ${summary.warnings} | 建议尽快处理 |
| 💡 建议 | ${summary.suggestions} | 优化建议 |

### 📋 审查建议
${recommendations.map((rec: string) => `- ${rec}`).join('\n')}

### 🕒 审查信息
- **审查时间**: ${new Date().toLocaleString('zh-CN')}
- **审查工具**: AI Code Reviewer v1.0
- **MR信息**: ${reviewReport.review_metadata.mr_info.title}

---
> 这是AI自动生成的代码审查报告。如有疑问，请联系开发团队。`;
}

/**
 * 生成问题评论
 */
function generateIssueComment(issue: CodeReviewIssue, filePath: string): string {
  const severityEmoji = {
    'critical': '🚨',
    'warning': '⚠️',
    'suggestion': '💡'
  };
  
  return `### ${severityEmoji[issue.severity]} ${issue.title}

**📁 文件**: \`${filePath}\`${issue.line_number ? ` (第${issue.line_number}行)` : ''}

**📝 问题描述**: ${issue.description}

**💡 修改建议**: ${issue.suggestion}

${issue.auto_fixable ? '🔧 *此问题支持自动修复*' : ''}

---
*分类: ${issue.category} | 规则来源: ${issue.rule_source}*`;
}

/**
 * 获取状态表情符号
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'PASS': return '✅';
    case 'WARNING': return '⚠️';
    case 'CRITICAL': return '🚨';
    default: return '❓';
  }
} 