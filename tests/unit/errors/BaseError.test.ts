/**
 * BaseError 单元测试
 */

import { describe, it, expect } from 'vitest';
import { BaseError } from '../../../../src-v2/errors/BaseError.js';
import { BusinessError } from '../../../../src-v2/errors/BusinessError.js';
import { SystemError } from '../../../../src-v2/errors/SystemError.js';
import { GitLabApiError } from '../../../../src-v2/errors/GitLabApiError.js';

describe('BaseError', () => {
  it('应该能够创建错误实例', () => {
    const error = new BusinessError('TEST_001', 'Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
    expect(error.code).toBe('TEST_001');
    expect(error.message).toBe('Test error');
    expect(error.timestamp).toBeInstanceOf(Date);
  });

  it('应该能够包含错误详情', () => {
    const details = { userId: '123', action: 'test' };
    const error = new BusinessError('TEST_001', 'Test error', details);
    expect(error.details).toEqual(details);
  });

  it('应该能够转换为 JSON', () => {
    const error = new BusinessError('TEST_001', 'Test error', { key: 'value' });
    const json = error.toJSON();
    expect(json).toHaveProperty('name');
    expect(json).toHaveProperty('code', 'TEST_001');
    expect(json).toHaveProperty('message', 'Test error');
    expect(json).toHaveProperty('details', { key: 'value' });
    expect(json).toHaveProperty('timestamp');
    expect(json).toHaveProperty('stack');
  });

  it('应该能够转换为字符串', () => {
    const error = new BusinessError('TEST_001', 'Test error');
    expect(error.toString()).toBe('[TEST_001] Test error');
  });
});

describe('BusinessError', () => {
  it('应该能够创建业务错误', () => {
    const error = new BusinessError('BUSINESS_001', 'Business rule violation');
    expect(error).toBeInstanceOf(BusinessError);
    expect(error).toBeInstanceOf(BaseError);
  });
});

describe('SystemError', () => {
  it('应该能够创建系统错误', () => {
    const error = new SystemError('SYSTEM_001', 'System error');
    expect(error).toBeInstanceOf(SystemError);
    expect(error).toBeInstanceOf(BaseError);
  });
});

describe('GitLabApiError', () => {
  it('应该能够创建 GitLab API 错误', () => {
    const error = new GitLabApiError('GITLAB_001', 'API error', {
      statusCode: 404,
      apiEndpoint: '/api/v4/projects',
      requestId: 'req-123',
    });
    expect(error).toBeInstanceOf(GitLabApiError);
    expect(error).toBeInstanceOf(SystemError);
    expect(error.statusCode).toBe(404);
    expect(error.apiEndpoint).toBe('/api/v4/projects');
    expect(error.requestId).toBe('req-123');
  });

  it('应该能够转换为 JSON（包含 API 信息）', () => {
    const error = new GitLabApiError('GITLAB_001', 'API error', {
      statusCode: 404,
      apiEndpoint: '/api/v4/projects',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('statusCode', 404);
    expect(json).toHaveProperty('apiEndpoint', '/api/v4/projects');
  });
});

