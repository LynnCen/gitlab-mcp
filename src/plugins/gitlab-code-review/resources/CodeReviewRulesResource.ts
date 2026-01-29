/**
 * CodeReviewRulesResource
 * 
 * 代码审查规则资源：gitlab://code-review-rules
 */

import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';

// TODO: 需要将 CODE_REVIEW_RULES 迁移到 v2
const CODE_REVIEW_RULES: Record<string, {
  focus_areas: string[];
  specific_rules: string[];
  ignore_patterns: string[];
  severity_mapping: Record<string, string>;
}> = {
  '.ts': {
    focus_areas: ['类型安全', '性能优化', '代码规范', '错误处理'],
    specific_rules: [
      '确保所有函数都有明确的返回类型',
      '避免使用 any 类型，使用具体类型或泛型',
      '异步函数必须正确处理错误',
    ],
    ignore_patterns: ['*.d.ts', '*.test.ts', '*.spec.ts'],
    severity_mapping: {},
  },
  '.vue': {
    focus_areas: ['组件设计', '性能优化', 'Vue最佳实践', '可访问性'],
    specific_rules: [
      'template 中避免复杂的表达式',
      '合理使用 computed 和 watch',
      '确保组件的 props 有正确的类型定义',
    ],
    ignore_patterns: [],
    severity_mapping: {},
  },
  '.js': {
    focus_areas: ['ES6+语法', '性能', '错误处理', '代码规范'],
    specific_rules: [
      '使用 const/let 替代 var',
      '避免回调地狱，使用 Promise 或 async/await',
      '正确处理异常和错误',
    ],
    ignore_patterns: ['*.min.js', '*.bundle.js'],
    severity_mapping: {},
  },
};

/**
 * CodeReviewRulesResource 实现
 */
export class CodeReviewRulesResource extends Resource {
  readonly uri = 'gitlab://code-review-rules';
  readonly name = 'Code Review Rules';
  readonly description = '代码审查规则配置';
  readonly mimeType = 'application/json';
  readonly cacheable = true;
  readonly subscribable = false;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super();
  }

  async getContent(): Promise<ResourceContent> {
    return Promise.resolve({
      uri: this.uri,
      mimeType: 'application/json',
      text: JSON.stringify(CODE_REVIEW_RULES, null, 2),
    });
  }
}

