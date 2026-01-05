/**
 * MemoryCacheProvider 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryCacheProvider } from '../../../../src-v2/cache/MemoryCacheProvider.js';

describe('MemoryCacheProvider', () => {
  let cache: MemoryCacheProvider;

  beforeEach(() => {
    cache = new MemoryCacheProvider({ defaultTtl: 60 });
  });

  afterEach(async () => {
    await cache.clear();
  });

  describe('get', () => {
    it('应该能够获取缓存值', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get<string>('key1');
      expect(value).toBe('value1');
    });

    it('应该在不存在时返回 null', async () => {
      const value = await cache.get('non-existent');
      expect(value).toBeNull();
    });
  });

  describe('set', () => {
    it('应该能够设置缓存值', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get<string>('key1');
      expect(value).toBe('value1');
    });

    it('应该能够设置对象值', async () => {
      const obj = { name: 'test', value: 123 };
      await cache.set('key1', obj);
      const value = await cache.get<typeof obj>('key1');
      expect(value).toEqual(obj);
    });

    it('应该能够使用自定义 TTL', async () => {
      await cache.set('key1', 'value1', 1);
      const ttl = await cache.getTtl('key1');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(1);
    });
  });

  describe('delete', () => {
    it('应该能够删除缓存', async () => {
      await cache.set('key1', 'value1');
      await cache.delete('key1');
      const value = await cache.get('key1');
      expect(value).toBeNull();
    });
  });

  describe('clear', () => {
    it('应该能够清除所有缓存', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      await cache.clear();
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });

    it('应该能够按模式清除缓存', async () => {
      await cache.set('prefix:key1', 'value1');
      await cache.set('prefix:key2', 'value2');
      await cache.set('other:key1', 'value3');
      await cache.clear('prefix:.*');
      expect(await cache.get('prefix:key1')).toBeNull();
      expect(await cache.get('prefix:key2')).toBeNull();
      expect(await cache.get('other:key1')).toBe('value3');
    });
  });

  describe('exists', () => {
    it('应该能够检查缓存是否存在', async () => {
      expect(await cache.exists('key1')).toBe(false);
      await cache.set('key1', 'value1');
      expect(await cache.exists('key1')).toBe(true);
    });
  });

  describe('getTtl', () => {
    it('应该能够获取剩余 TTL', async () => {
      await cache.set('key1', 'value1', 60);
      const ttl = await cache.getTtl('key1');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(60);
    });

    it('应该在不存在时返回 null', async () => {
      const ttl = await cache.getTtl('non-existent');
      expect(ttl).toBeNull();
    });
  });

  describe('getStats', () => {
    it('应该能够获取统计信息', () => {
      const stats = cache.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('keys');
    });
  });
});

