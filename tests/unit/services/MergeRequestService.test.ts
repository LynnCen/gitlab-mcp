/**
 * MergeRequestService 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MergeRequestService } from '../../../src-v2/services/MergeRequestService.js';
import type { IGitLabRepository } from '../../../src-v2/repositories/GitLabRepository.js';
import type { ICacheRepository } from '../../../src-v2/repositories/CacheRepository.js';
import type { ILogger } from '../../../src-v2/logging/types.js';

describe('MergeRequestService', () => {
  let service: MergeRequestService;
  let mockGitlabRepo: IGitLabRepository;
  let mockCacheRepo: ICacheRepository;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockGitlabRepo = {
      getProject: vi.fn(),
      getMergeRequest: vi.fn(),
      getMergeRequestChanges: vi.fn(),
      updateMergeRequestDescription: vi.fn(),
      listMergeRequests: vi.fn(),
    } as any;

    mockCacheRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
      getTtl: vi.fn(),
    } as any;

    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    service = new MergeRequestService(mockGitlabRepo, mockCacheRepo, mockLogger);
  });

  describe('getMergeRequest', () => {
    it('应该从缓存获取 MR（如果存在）', async () => {
      const cachedMR = { id: 1, iid: 1, title: 'Cached MR' };
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce('project-id');
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce(cachedMR);

      const result = await service.getMergeRequest('test/project', 1);

      expect(result).toEqual(cachedMR);
      expect(mockGitlabRepo.getMergeRequest).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });

    it('应该从 API 获取 MR（如果缓存不存在）', async () => {
      const project = { id: 1, name: 'test-project' };
      const mr = { id: 1, iid: 1, title: 'Test MR' };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getMergeRequest).mockResolvedValue(mr as any);

      const result = await service.getMergeRequest('test/project', 1);

      expect(result).toEqual(mr);
      expect(mockGitlabRepo.getMergeRequest).toHaveBeenCalledWith(1, 1);
      expect(mockCacheRepo.set).toHaveBeenCalled();
    });
  });

  describe('getMergeRequestChanges', () => {
    it('应该获取 MR 变更并计算摘要', async () => {
      const project = { id: 1 };
      const changes = {
        changes: [
          {
            old_path: 'old.ts',
            new_path: 'new.ts',
            new_file: false,
            deleted_file: false,
            renamed_file: false,
            diff: '+new line\n-old line',
          },
        ],
      };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getMergeRequestChanges).mockResolvedValue(
        changes as any
      );

      const result = await service.getMergeRequestChanges('test/project', 1);

      expect(result.changes).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalFiles).toBe(1);
    });
  });
});

