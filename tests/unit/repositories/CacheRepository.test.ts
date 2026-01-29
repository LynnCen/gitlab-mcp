/**
 * CacheRepository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CacheRepository } from '../../../src-v2/repositories/CacheRepository.js';
import type { ICacheProvider } from '../../../src-v2/cache/CacheProvider.js';

describe('CacheRepository', () => {
  let repository: CacheRepository;
  let mockCacheProvider: ICacheProvider;

  beforeEach(() => {
    mockCacheProvider = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      exists: vi.fn(),
      getTtl: vi.fn(),
    };

    repository = new CacheRepository(mockCacheProvider);
  });

  describe('get', () => {
    it('应该从缓存提供者获取值', async () => {
      const mockValue = { data: 'test' };
      vi.mocked(mockCacheProvider.get).mockResolvedValue(mockValue);

      const result = await repository.get('test-key');

      expect(result).toEqual(mockValue);
      expect(mockCacheProvider.get).toHaveBeenCalledWith('test-key');
    });

    it('应该在缓存不存在时返回 null', async () => {
      vi.mocked(mockCacheProvider.get).mockResolvedValue(null);

      const result = await repository.get('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('应该设置缓存值', async () => {
      const value = { data: 'test' };
      await repository.set('test-key', value, 300);

      expect(mockCacheProvider.set).toHaveBeenCalledWith('test-key', value, 300);
    });
  });

  describe('delete', () => {
    it('应该删除缓存', async () => {
      await repository.delete('test-key');

      expect(mockCacheProvider.delete).toHaveBeenCalledWith('test-key');
    });
  });

  describe('exists', () => {
    it('应该检查缓存是否存在', async () => {
      vi.mocked(mockCacheProvider.exists).mockResolvedValue(true);

      const result = await repository.exists('test-key');

      expect(result).toBe(true);
      expect(mockCacheProvider.exists).toHaveBeenCalledWith('test-key');
    });
  });

  describe('getTtl', () => {
    it('应该获取缓存 TTL', async () => {
      vi.mocked(mockCacheProvider.getTtl).mockResolvedValue(300);

      const result = await repository.getTtl('test-key');

      expect(result).toBe(300);
      expect(mockCacheProvider.getTtl).toHaveBeenCalledWith('test-key');
    });
  });
});

