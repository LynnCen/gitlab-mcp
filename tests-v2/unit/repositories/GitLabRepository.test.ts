/**
 * GitLabRepository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitLabRepository } from '../../../src-v2/repositories/GitLabRepository.js';
import { GitLabApiError } from '../../../src-v2/errors/GitLabApiError.js';
import { ErrorCode } from '../../../src-v2/errors/ErrorCode.js';
import type { GitLabConfig } from '../../../src-v2/config/types.js';

// Mock @gitbeaker/rest
vi.mock('@gitbeaker/rest', () => {
  const mockGitlab = {
    requester: {
      get: vi.fn(),
    },
    Projects: {
      show: vi.fn(),
    },
    MergeRequests: {
      show: vi.fn(),
      showChanges: vi.fn(),
      edit: vi.fn(),
      all: vi.fn(),
      commits: vi.fn(),
    },
    MergeRequestVersions: {
      all: vi.fn(),
    },
    MergeRequestNotes: {
      create: vi.fn(),
    },
    MergeRequestDiscussions: {
      create: vi.fn(),
    },
    RepositoryFiles: {
      show: vi.fn(),
    },
  };

  return {
    Gitlab: vi.fn(() => mockGitlab),
  };
});

describe('GitLabRepository', () => {
  let repository: GitLabRepository;
  let mockConfig: GitLabConfig;
  let mockGitlab: any;

  beforeEach(async () => {
    mockConfig = {
      host: 'https://gitlab.com',
      token: 'test-token',
      timeout: 30000,
      retries: 3,
    };

    // 获取 mock 实例
    const { Gitlab } = await import('@gitbeaker/rest');
    mockGitlab = new Gitlab({});
    repository = new GitLabRepository(mockConfig);
  });

  describe('testConnection', () => {
    it('应该成功测试连接', async () => {
      const mockUser = { id: 1, username: 'test' };
      mockGitlab.requester.get.mockResolvedValue(mockUser);

      const result = await repository.testConnection();

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
    });

    it('应该在连接失败时返回错误', async () => {
      mockGitlab.requester.get.mockRejectedValue(new Error('Connection failed'));

      const result = await repository.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getProject', () => {
    it('应该成功获取项目信息', async () => {
      const mockProject = { id: 1, name: 'test-project' };
      mockGitlab.Projects.show.mockResolvedValue(mockProject);

      const result = await repository.getProject('test/project');

      expect(result).toEqual(mockProject);
      expect(mockGitlab.Projects.show).toHaveBeenCalledWith('test/project');
    });

    it('应该在项目不存在时抛出错误', async () => {
      const error = { response: { status: 404 }, message: 'Not found' };
      mockGitlab.Projects.show.mockRejectedValue(error);

      await expect(repository.getProject('nonexistent')).rejects.toThrow(
        GitLabApiError
      );
    });
  });

  describe('getMergeRequest', () => {
    it('应该成功获取合并请求', async () => {
      const mockMR = { id: 1, iid: 1, title: 'Test MR' };
      mockGitlab.MergeRequests.show.mockResolvedValue(mockMR);

      const result = await repository.getMergeRequest('test/project', 1);

      expect(result).toEqual(mockMR);
      expect(mockGitlab.MergeRequests.show).toHaveBeenCalledWith('test/project', 1);
    });
  });

  describe('错误处理和重试', () => {
    it('应该在 4xx 错误时不重试', async () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      mockGitlab.Projects.show.mockRejectedValue(error);

      await expect(repository.getProject('test')).rejects.toThrow(GitLabApiError);

      // 应该只调用一次，不重试
      expect(mockGitlab.Projects.show).toHaveBeenCalledTimes(1);
    });

    it('应该在网络错误时重试', async () => {
      const networkError = new Error('Network error');
      mockGitlab.Projects.show
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce({ id: 1 });

      const result = await repository.getProject('test');

      expect(result).toEqual({ id: 1 });
      expect(mockGitlab.Projects.show).toHaveBeenCalledTimes(3);
    });
  });
});

