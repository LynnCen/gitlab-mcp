import { CacheManager } from '../types/index.js';

/**
 * 缓存项
 */
interface CacheItem<T> {
  value: T;
  expiry: number;
}

/**
 * 内存缓存管理器
 */
export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 300) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * 获取缓存值
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 设置缓存值
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.defaultTTL;
    const expiry = Date.now() + actualTTL * 1000;
    
    this.cache.set(key, {
      value,
      expiry,
    });
  }

  /**
   * 删除缓存值
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
} 