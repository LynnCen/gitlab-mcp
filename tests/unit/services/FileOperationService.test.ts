/**
 * FileOperationService 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileOperationService } from '../../../src-v2/services/FileOperationService.js';
import type { IGitLabRepository } from '../../../src-v2/repositories/GitLabRepository.js';
import type { ICacheRepository } from '../../../src-v2/repositories/CacheRepository.js';
import type { IMergeRequestService } from '../../../src-v2/services/MergeRequestService.js';
import type { ILogger } from '../../../src-v2/logging/types.js';

describe('FileOperationService', () => {
  let service: FileOperationService;
  let mockGitlabRepo: IGitLabRepository;
  let mockCacheRepo: ICacheRepository;
  let mockMrService: IMergeRequestService;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockGitlabRepo = {
      getProject: vi.fn(),
      getFile: vi.fn(),
    } as any;

    mockCacheRepo = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
      getTtl: vi.fn(),
    } as any;

    mockMrService = {
      getMergeRequest: vi.fn(),
    } as any;

    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
    } as any;

    service = new FileOperationService(
      mockGitlabRepo,
      mockCacheRepo,
      mockMrService,
      mockLogger
    );
  });

  describe('getFileContent', () => {
    it('应该从缓存获取文件（如果存在）', async () => {
      const cachedFile = {
        file_name: 'test.ts',
        content: 'test content',
      };
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce('project-id');
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce(cachedFile);

      const result = await service.getFileContent('test/project', 'test.ts', {
        ref: 'main',
      });

      expect(result).toEqual(cachedFile);
      expect(mockGitlabRepo.getFile).not.toHaveBeenCalled();
    });

    it('应该从 API 获取文件（如果缓存不存在）', async () => {
      const project = { id: 1 };
      const file = {
        file_name: 'test.ts',
        file_path: 'test.ts',
        content: 'test content',
      };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getFile).mockResolvedValue(file as any);

      const result = await service.getFileContent('test/project', 'test.ts', {
        ref: 'main',
      });

      expect(result).toEqual(file);
      expect(mockGitlabRepo.getFile).toHaveBeenCalledWith(1, 'test.ts', 'main');
      expect(mockCacheRepo.set).toHaveBeenCalled();
    });
  });
});

