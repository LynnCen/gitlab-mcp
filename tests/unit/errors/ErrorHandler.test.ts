/**
 * ErrorHandler 单元测试
 */

import { describe, it, expect, vi } from 'vitest';
import { ErrorHandler } from '../../../../src-v2/errors/ErrorHandler.js';
import { BusinessError } from '../../../../src-v2/errors/BusinessError.js';
import { SystemError } from '../../../../src-v2/errors/SystemError.js';
import { GitLabApiError } from '../../../../src-v2/errors/GitLabApiError.js';
import type { ILogger } from '../../../../src-v2/logging/Logger.js';

describe('ErrorHandler', () => {
  let mockLogger: ILogger;
  let handler: ErrorHandler;

  beforeEach(() => {
    mockLogger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn(),
      setLevel: vi.fn(),
      getLevel: () => 'info',
    };
    handler = new ErrorHandler(mockLogger);
  });

  describe('handle', () => {
    it('应该能够处理 BusinessError', () => {
      const error = new BusinessError('BUSINESS_001', 'Business error', { key: 'value' });
      const result = handler.handle(error);

      expect(result.code).toBe('BUSINESS_001');
      expect(result.message).toBe('Business error');
      expect(result.details).toEqual({ key: 'value' });
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('应该能够处理 SystemError', () => {
      const error = new SystemError('SYSTEM_001', 'System error');
      const result = handler.handle(error);

      expect(result.code).toBe('SYSTEM_001');
      expect(result.message).toBe('System error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('应该能够处理 GitLabApiError', () => {
      const error = new GitLabApiError('GITLAB_001', 'API error', {
        statusCode: 404,
        apiEndpoint: '/api/v4/projects',
      });
      const result = handler.handle(error);

      expect(result.code).toBe('GITLAB_001');
      expect(result.message).toBe('API error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('应该能够处理标准 Error', () => {
      const error = new Error('Standard error');
      const result = handler.handle(error);

      expect(result.code).toBe('INTERNAL_7001');
      expect(result.message).toBe('Standard error');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('应该能够处理未知错误类型', () => {
      const error = 'String error';
      const result = handler.handle(error);

      expect(result.code).toBe('INTERNAL_7001');
      expect(result.message).toBe('An unknown error occurred');
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('应该能够包含堆栈跟踪', () => {
      const error = new Error('Test error');
      const result = handler.handle(error, { includeStack: true });

      expect(result.stack).toBeDefined();
    });

    it('应该能够不记录日志', () => {
      const error = new BusinessError('BUSINESS_001', 'Business error');
      handler.handle(error, { logError: false });

      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('isBusinessError', () => {
    it('应该能够判断业务错误', () => {
      const error = new BusinessError('BUSINESS_001', 'Business error');
      expect(handler.isBusinessError(error)).toBe(true);
      expect(handler.isBusinessError(new Error('test'))).toBe(false);
    });
  });

  describe('isSystemError', () => {
    it('应该能够判断系统错误', () => {
      const error = new SystemError('SYSTEM_001', 'System error');
      expect(handler.isSystemError(error)).toBe(true);
      expect(handler.isSystemError(new Error('test'))).toBe(false);
    });
  });

  describe('isGitLabApiError', () => {
    it('应该能够判断 GitLab API 错误', () => {
      const error = new GitLabApiError('GITLAB_001', 'API error');
      expect(handler.isGitLabApiError(error)).toBe(true);
      expect(handler.isGitLabApiError(new Error('test'))).toBe(false);
    });
  });
});

