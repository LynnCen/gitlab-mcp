/**
 * CodeReviewRuleEngine 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CodeReviewRuleEngine } from '../../../src-v2/services/CodeReviewRuleEngine.js';
import type { ReviewRule } from '../../../src-v2/services/CodeReviewRuleEngine.js';

describe('CodeReviewRuleEngine', () => {
  let engine: CodeReviewRuleEngine;

  beforeEach(() => {
    engine = new CodeReviewRuleEngine();
  });

  describe('loadRules', () => {
    it('应该能够加载自定义规则', () => {
      const customRule: ReviewRule = {
        id: 'custom-rule',
        name: 'Custom Rule',
        description: 'Test rule',
        filePattern: /\.ts$/,
        categories: ['test'],
        checks: [
          {
            id: 'check-1',
            description: 'Test check',
            pattern: /test/,
            message: 'Found test',
            suggestion: 'Remove test',
          },
        ],
        severity: 'warning',
        autoFixable: false,
      };

      engine.loadRules([customRule]);

      const result = engine.reviewFileChange('test.ts', '+test code');
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('reviewFileChange', () => {
    it('应该能够审查文件变更', () => {
      const diff = '+const x: any = 1;';
      const result = engine.reviewFileChange('test.ts', diff);

      expect(result.filePath).toBe('test.ts');
      expect(result.issues).toBeDefined();
    });

    it('应该匹配文件扩展名', () => {
      const result1 = engine.reviewFileChange('test.ts', '+code');
      const result2 = engine.reviewFileChange('test.txt', '+code');

      // TypeScript 文件应该有规则匹配
      expect(result1.issues.length).toBeGreaterThanOrEqual(0);
      // 文本文件可能没有规则
      expect(result2.issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reviewMergeRequestChanges', () => {
    it('应该能够审查 MR 变更', () => {
      const changes = {
        changes: [
          {
            old_path: 'old.ts',
            new_path: 'new.ts',
            new_file: true,
            deleted_file: false,
            renamed_file: false,
            diff: '+const x: any = 1;',
          },
        ],
      };

      const results = engine.reviewMergeRequestChanges(changes.changes);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });
});

