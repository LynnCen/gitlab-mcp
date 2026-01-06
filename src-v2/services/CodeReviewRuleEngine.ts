/**
 * CodeReviewRuleEngine
 * 
 * 代码审查规则引擎，负责加载、匹配和执行审查规则
 */

import type { ILogger } from '../logging/types.js';
import type { GitLabMergeRequestChanges } from '../repositories/types.js';

/**
 * 审查规则
 */
export interface ReviewRule {
  id: string;
  name: string;
  description: string;
  filePattern: string | RegExp;
  categories: string[];
  checks: ReviewCheck[];
  severity: 'critical' | 'warning' | 'suggestion';
  autoFixable: boolean;
}

/**
 * 审查检查项
 */
export interface ReviewCheck {
  id: string;
  description: string;
  pattern?: string | RegExp;
  message: string;
  suggestion: string;
}

/**
 * 审查结果
 */
export interface ReviewResult {
  filePath: string;
  issues: ReviewIssue[];
}

/**
 * 审查问题
 */
export interface ReviewIssue {
  ruleId: string;
  checkId: string;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  suggestion: string;
  lineNumber?: number;
  code?: string;
}

/**
 * 代码审查规则引擎
 */
export class CodeReviewRuleEngine {
  private rules: ReviewRule[] = [];
  private defaultRules: ReviewRule[] = [];

  constructor(private logger?: ILogger) {
    this.loadDefaultRules();
  }

  /**
   * 加载默认规则
   */
  private loadDefaultRules(): void {
    // TypeScript 规则
    this.defaultRules.push({
      id: 'typescript-type-safety',
      name: 'TypeScript 类型安全',
      description: '检查 TypeScript 类型安全问题',
      filePattern: /\.tsx?$/,
      categories: ['类型安全', '代码规范'],
      checks: [
        {
          id: 'no-any',
          description: '避免使用 any 类型',
          pattern: /:\s*any\b/,
          message: '使用了 any 类型，应该使用具体类型或泛型',
          suggestion: '将 any 替换为具体类型或使用泛型',
        },
        {
          id: 'unhandled-promise',
          description: '未处理的 Promise',
          pattern: /\.then\(|\.catch\(/,
          message: 'Promise 可能未正确处理错误',
          suggestion: '使用 async/await 或确保所有 Promise 都有错误处理',
        },
      ],
      severity: 'warning',
      autoFixable: false,
    });

    // Vue 规则
    this.defaultRules.push({
      id: 'vue-best-practices',
      name: 'Vue 最佳实践',
      description: '检查 Vue 组件最佳实践',
      filePattern: /\.vue$/,
      categories: ['组件设计', 'Vue最佳实践'],
      checks: [
        {
          id: 'props-type',
          description: 'Props 缺少类型定义',
          pattern: /props:\s*\{[^}]*\}/,
          message: 'Props 应该使用 defineProps 或 PropType 定义类型',
          suggestion: '使用 defineProps 或 PropType 为 props 定义类型',
        },
      ],
      severity: 'warning',
      autoFixable: false,
    });
  }

  /**
   * 加载规则
   */
  loadRules(rules: ReviewRule[]): void {
    this.rules = [...this.defaultRules, ...rules];
    this.logger?.info('Rules loaded', { count: this.rules.length });
  }

  /**
   * 匹配文件到规则
   */
  private matchRules(filePath: string): ReviewRule[] {
    return this.rules.filter((rule) => {
      if (rule.filePattern instanceof RegExp) {
        return rule.filePattern.test(filePath);
      }
      return filePath.endsWith(rule.filePattern);
    });
  }

  /**
   * 执行规则检查
   */
  private executeChecks(
    rule: ReviewRule,
    filePath: string,
    diffContent: string
  ): ReviewIssue[] {
    const issues: ReviewIssue[] = [];

    for (const check of rule.checks) {
      if (!check.pattern) {
        continue;
      }

      const regex =
        check.pattern instanceof RegExp
          ? check.pattern
          : new RegExp(check.pattern, 'g');
      const matches = diffContent.matchAll(regex);

      for (const match of matches) {
        // 计算行号（简化处理）
        const beforeMatch = diffContent.substring(0, match.index || 0);
        const lineNumber =
          beforeMatch.split('\n').length + (match.index === 0 ? 1 : 0);

        issues.push({
          ruleId: rule.id,
          checkId: check.id,
          severity: rule.severity,
          message: check.message,
          suggestion: check.suggestion,
          lineNumber,
          code: match[0],
        });
      }
    }

    return issues;
  }

  /**
   * 审查文件变更
   */
  reviewFileChange(
    filePath: string,
    diffContent: string
  ): ReviewResult {
    const matchedRules = this.matchRules(filePath);
    const issues: ReviewIssue[] = [];

    for (const rule of matchedRules) {
      const ruleIssues = this.executeChecks(rule, filePath, diffContent);
      issues.push(...ruleIssues);
    }

    return {
      filePath,
      issues,
    };
  }

  /**
   * 审查合并请求变更
   */
  reviewMergeRequestChanges(
    changes: GitLabMergeRequestChanges['changes']
  ): ReviewResult[] {
    const results: ReviewResult[] = [];

    for (const change of changes) {
      // 只审查新增和修改的文件
      if (change.deleted_file) {
        continue;
      }

      const filePath = change.new_path || change.old_path;
      const diffContent = change.diff || '';

      // 跳过空文件或过大的文件
      if (!diffContent || diffContent.length > 100000) {
        continue;
      }

      const result = this.reviewFileChange(filePath, diffContent);
      if (result.issues.length > 0) {
        results.push(result);
      }
    }

    return results;
  }
}

