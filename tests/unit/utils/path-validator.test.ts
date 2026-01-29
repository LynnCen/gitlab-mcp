/**
 * 路径验证工具单元测试
 */

import { describe, it, expect } from 'vitest';
import {
  validateFilePath,
  validateProjectPath,
  validateUri,
} from '../../../src-v2/utils/path-validator.js';

describe('路径验证工具', () => {
  describe('validateFilePath', () => {
    it('应该接受有效的相对路径', () => {
      const result = validateFilePath('src/index.ts', {
        allowRelative: true,
        allowTraversal: false,
      });
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe('src/index.ts');
    });

    it('应该拒绝路径遍历', () => {
      const result = validateFilePath('../../etc/passwd', {
        allowTraversal: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Path traversal');
    });

    it('应该拒绝过长的路径', () => {
      const longPath = 'a'.repeat(5000);
      const result = validateFilePath(longPath, {
        maxLength: 4096,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('应该拒绝空路径', () => {
      const result = validateFilePath('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be empty');
    });
  });

  describe('validateProjectPath', () => {
    it('应该接受有效的项目路径', () => {
      const result = validateProjectPath('owner/repo');
      expect(result.valid).toBe(true);
    });

    it('应该接受嵌套组路径', () => {
      const result = validateProjectPath('group/subgroup/repo');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝包含路径遍历的项目路径', () => {
      const result = validateProjectPath('owner/../repo');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Path traversal');
    });

    it('应该拒绝无效字符', () => {
      const result = validateProjectPath('owner/repo@#$');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUri', () => {
    it('应该接受有效的 gitlab:// URI', () => {
      const result = validateUri('gitlab://projects/123/files/src/index.ts');
      expect(result.valid).toBe(true);
    });

    it('应该拒绝不允许的协议', () => {
      const result = validateUri('file:///etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('应该拒绝无效的 URI 格式', () => {
      const result = validateUri('not-a-uri');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid URI format');
    });
  });
});

