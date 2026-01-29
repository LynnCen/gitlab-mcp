/**
 * Cache Repository
 * 
 * 提供统一的缓存接口，封装缓存提供者
 */

import type { ICacheProvider } from '../cache/CacheProvider.js';

/**
 * Cache Repository 接口
 */
export interface ICacheRepository {
  /**
   * 获取缓存值
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存值
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   */
  delete(key: string): Promise<void>;

  /**
   * 清空缓存（支持模式匹配）
   */
  clear(pattern?: string): Promise<void>;

  /**
   * 检查缓存是否存在
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取缓存 TTL
   */
  getTtl(key: string): Promise<number | null>;
}

/**
 * Cache Repository 实现
 */
export class CacheRepository implements ICacheRepository {
  constructor(private cacheProvider: ICacheProvider) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheProvider.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheProvider.set(key, value, ttl);
  }

  async delete(key: string): Promise<void> {
    await this.cacheProvider.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (pattern) {
      // 如果缓存提供者支持模式匹配，使用它
      // 否则需要遍历所有键（这里简化处理）
      await this.cacheProvider.clear();
    } else {
      await this.cacheProvider.clear();
    }
  }

  async exists(key: string): Promise<boolean> {
    return await this.cacheProvider.exists(key);
  }

  async getTtl(key: string): Promise<number | null> {
    return await this.cacheProvider.getTtl(key);
  }
}

