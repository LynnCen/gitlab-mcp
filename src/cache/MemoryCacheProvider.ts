/**
 * 基于 node-cache 的内存缓存提供者
 */

import NodeCache from 'node-cache';
import type { ICacheProvider } from './CacheProvider.js';

/**
 * 内存缓存配置
 */
export interface MemoryCacheConfig {
  /**
   * 默认 TTL（秒）
   */
  defaultTtl?: number;

  /**
   * 是否检查过期
   */
  checkPeriod?: number;

  /**
   * 是否使用克隆
   */
  useClones?: boolean;
}

/**
 * 内存缓存提供者
 */
export class MemoryCacheProvider implements ICacheProvider {
  private cache: NodeCache;
  private defaultTtl: number;

  constructor(config: MemoryCacheConfig = {}) {
    const {
      defaultTtl = 300, // 默认 5 分钟
      checkPeriod = 600, // 每 10 分钟检查一次过期
      useClones = true,
    } = config;

    this.defaultTtl = defaultTtl;
    this.cache = new NodeCache({
      stdTTL: defaultTtl,
      checkperiod: checkPeriod,
      useClones,
    });
  }

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key);
    return value !== undefined ? value : null;
  }

  /**
   * 设置缓存
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const ttlSeconds = ttl !== undefined ? ttl : this.defaultTtl;
    this.cache.set(key, value, ttlSeconds);
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.cache.del(key);
  }

  /**
   * 清除所有缓存
   */
  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      // 如果提供了模式，只清除匹配的键
      const keys = this.cache.keys();
      const regex = new RegExp(pattern);
      const matchingKeys = keys.filter((key) => regex.test(key));
      this.cache.del(matchingKeys);
    } else {
      // 清除所有缓存
      this.cache.flushAll();
    }
  }

  /**
   * 检查缓存是否存在
   */
  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  /**
   * 获取剩余 TTL
   */
  async getTtl(key: string): Promise<number | null> {
    const ttl = this.cache.getTtl(key);
    if (ttl === 0) {
      // 0 表示永久，返回 null（表示不过期）
      return null;
    }
    if (ttl === -1) {
      // -1 表示不存在
      return null;
    }
    // 返回剩余秒数
    return Math.floor((ttl - Date.now()) / 1000);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    hits: number;
    misses: number;
    keys: number;
  } {
    const stats = this.cache.getStats();
    return {
      hits: stats.hits,
      misses: stats.misses,
      keys: stats.keys,
    };
  }
}

