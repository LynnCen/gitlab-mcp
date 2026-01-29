/**
 * 配置提供者接口
 */

/**
 * 配置提供者接口
 */
export interface IConfigProvider {
  /**
   * 获取配置值
   * @param key 配置键（支持点号分隔的嵌套键，如 'gitlab.host'）
   * @param defaultValue 默认值
   */
  get<T = any>(key: string, defaultValue?: T): T;

  /**
   * 检查配置是否存在
   * @param key 配置键
   */
  has(key: string): boolean;

  /**
   * 获取所有配置
   */
  getAll(): Record<string, any>;

  /**
   * 重新加载配置
   */
  reload(): Promise<void>;
}

