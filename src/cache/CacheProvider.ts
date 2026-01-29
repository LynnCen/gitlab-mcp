/**
 * 缓存提供者接口
 */

/**
 * 缓存提供者接口
 */
export interface ICacheProvider {
  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值，如果不存在返回 null
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间（秒），如果不提供则使用默认值
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;

  /**
   * 删除缓存
   * @param key 缓存键
   */
  delete(key: string): Promise<void>;

  /**
   * 清除所有缓存
   * @param pattern 匹配模式（可选，用于部分清除）
   */
  clear(pattern?: string): Promise<void>;

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  exists(key: string): Promise<boolean>;

  /**
   * 获取剩余 TTL
   * @param key 缓存键
   * @returns 剩余时间（秒），如果不存在返回 null
   */
  getTtl(key: string): Promise<number | null>;
}

