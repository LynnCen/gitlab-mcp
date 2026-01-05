/**
 * 依赖注入类型定义
 */

/**
 * 服务标识符
 */
export type Token<T = any> = string | symbol | Class<T>;

/**
 * 类构造函数类型
 */
export interface Class<T = any> {
  new (...args: any[]): T;
}

/**
 * 工厂函数类型
 */
export type Factory<T> = (container: Container) => T;

/**
 * 服务注册选项
 */
export interface RegistrationOptions {
  /**
   * 生命周期类型
   * - singleton: 单例模式，整个应用生命周期内只有一个实例
   * - transient: 瞬时模式，每次解析都创建新实例
   */
  lifecycle?: 'singleton' | 'transient';
  
  /**
   * 作用域（预留，用于未来扩展）
   */
  scope?: string;
}

/**
 * DI 容器接口
 */
export interface Container {
  /**
   * 注册服务
   * @param token 服务标识符
   * @param factory 工厂函数或类构造函数
   * @param options 注册选项
   */
  register<T>(
    token: Token<T>,
    factory: Factory<T> | Class<T>,
    options?: RegistrationOptions
  ): void;

  /**
   * 解析服务
   * @param token 服务标识符
   * @returns 服务实例
   * @throws 如果服务未注册，抛出错误
   */
  resolve<T>(token: Token<T>): T;

  /**
   * 尝试解析服务（不抛出异常）
   * @param token 服务标识符
   * @returns 服务实例或 undefined
   */
  tryResolve<T>(token: Token<T>): T | undefined;

  /**
   * 检查服务是否已注册
   * @param token 服务标识符
   * @returns 是否已注册
   */
  isRegistered<T>(token: Token<T>): boolean;

  /**
   * 清除所有注册
   */
  clear(): void;

  /**
   * 创建子容器（预留，用于作用域管理）
   */
  createChild(): Container;
}

