/**
 * StreamingFileService 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StreamingFileService } from '../../../src-v2/services/StreamingFileService.js';
import type { IGitLabRepository } from '../../../src-v2/repositories/GitLabRepository.js';
import type { ICacheRepository } from '../../../src-v2/repositories/CacheRepository.js';
import type { ILogger } from '../../../src-v2/logging/types.js';

describe('StreamingFileService', () => {
  let service: StreamingFileService;
  let mockGitlabRepo: IGitLabRepository;
  let mockCacheRepo: ICacheRepository;
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

    mockLogger = {
      debug: vi.fn(),
      error: vi.fn(),
    } as any;

    service = new StreamingFileService(
      mockGitlabRepo,
      mockCacheRepo,
      mockLogger
    );
  });

  describe('streamFileContent', () => {
    it('应该能够流式返回文件内容', async () => {
      const project = { id: 1 };
      const file = {
        file_name: 'test.ts',
        content: 'test content',
      };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getFile).mockResolvedValue(file as any);

      const chunks: string[] = [];
      for await (const chunk of service.streamFileContent('test/project', 'test.ts')) {
        chunks.push(chunk.content);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toBe('test content');
    });

    it('应该能够从缓存流式返回', async () => {
      const cachedContent = 'cached content';
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce(null); // project cache miss
      vi.mocked(mockCacheRepo.get).mockResolvedValueOnce(cachedContent); // file cache hit

      const chunks: string[] = [];
      for await (const chunk of service.streamFileContent('test/project', 'test.ts')) {
        chunks.push(chunk.content);
      }

      expect(chunks.join('')).toBe(cachedContent);
      expect(mockGitlabRepo.getFile).not.toHaveBeenCalled();
    });

    it('应该能够分块返回大文件', async () => {
      const project = { id: 1 };
      const largeContent = 'x'.repeat(200 * 1024); // 200KB
      const file = {
        file_name: 'large.ts',
        content: largeContent,
      };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getFile).mockResolvedValue(file as any);

      const chunks: string[] = [];
      let chunkCount = 0;
      for await (const chunk of service.streamFileContent('test/project', 'large.ts', {
        chunkSize: 64 * 1024, // 64KB chunks
      })) {
        chunks.push(chunk.content);
        chunkCount++;
        expect(chunk.index).toBe(chunkCount - 1);
      }

      expect(chunkCount).toBeGreaterThan(1); // 应该分成多个块
      expect(chunks.join('')).toBe(largeContent);
    });
  });

  describe('getFileSize', () => {
    it('应该能够获取文件大小', async () => {
      const project = { id: 1 };
      const file = {
        file_name: 'test.ts',
        content: 'test content',
        size: 12,
      };

      vi.mocked(mockCacheRepo.get).mockResolvedValue(null);
      vi.mocked(mockGitlabRepo.getProject).mockResolvedValue(project as any);
      vi.mocked(mockGitlabRepo.getFile).mockResolvedValue(file as any);

      const size = await service.getFileSize('test/project', 'test.ts');
      expect(size).toBe(12);
    });
  });
});

