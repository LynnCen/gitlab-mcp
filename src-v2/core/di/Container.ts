/**
 * DI 容器实现
 * 
 * 基于 TSyringe 实现，提供依赖注入功能
 */

import 'reflect-metadata';
import { container as tsyringeContainer, DependencyContainer, Lifecycle } from 'tsyringe';
import type { Container, Token, Factory, RegistrationOptions, Class } from './types.js';

/**
 * DI 容器实现类
 */
export class DiContainer implements Container {
  private readonly container: DependencyContainer;
  private readonly registrations: Map<Token, RegistrationOptions> = new Map();

  constructor(parent?: DependencyContainer) {
    this.container = parent ? parent.createChildContainer() : tsyringeContainer;
  }

  /**
   * 注册服务
   */
  register<T>(
    token: Token<T>,
    factory: Factory<T> | Class<T>,
    options?: RegistrationOptions
  ): void {
    const lifecycle = options?.lifecycle || 'singleton';
    const tsyringeLifecycle =
      lifecycle === 'singleton' ? Lifecycle.Singleton : Lifecycle.Transient;

    // 保存注册选项
    this.registrations.set(token, options || {});

    // 如果是类构造函数，直接注册
    if (this.isClass(factory)) {
      this.container.register(token as any, {
        useClass: factory,
        lifecycle: tsyringeLifecycle,
      });
    } else {
      // 如果是工厂函数，需要包装
      this.container.register(token as any, {
        useFactory: (c) => factory(this),
        lifecycle: tsyringeLifecycle,
      });
    }
  }

  /**
   * 解析服务
   */
  resolve<T>(token: Token<T>): T {
    if (!this.isRegistered(token)) {
      throw new Error(`Service with token ${String(token)} is not registered`);
    }

    try {
      return this.container.resolve<T>(token);
    } catch (error) {
      throw new Error(
        `Failed to resolve service with token ${String(token)}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 尝试解析服务（不抛出异常）
   */
  tryResolve<T>(token: Token<T>): T | undefined {
    if (!this.isRegistered(token)) {
      return undefined;
    }

    try {
      return this.container.resolve<T>(token);
    } catch {
      return undefined;
    }
  }

  /**
   * 检查服务是否已注册
   */
  isRegistered<T>(token: Token<T>): boolean {
    // TSyringe 没有直接的 isRegistered 方法，我们需要自己跟踪
    return this.registrations.has(token);
  }

  /**
   * 清除所有注册
   */
  clear(): void {
    this.registrations.clear();
    // TSyringe 的容器不支持直接清除，需要创建新容器
    // 这里我们只清除注册记录，实际容器由 TSyringe 管理
  }

  /**
   * 创建子容器
   */
  createChild(): Container {
    return new DiContainer(this.container);
  }

  /**
   * 判断是否为类构造函数
   */
  private isClass<T>(value: Factory<T> | Class<T>): value is Class<T> {
    return typeof value === 'function' && value.prototype && value.prototype.constructor === value;
  }

  /**
   * 获取底层 TSyringe 容器（用于高级场景）
   */
  getTsyringeContainer(): DependencyContainer {
    return this.container;
  }
}

/**
 * 全局容器实例（单例）
 */
let globalContainer: Container | null = null;

/**
 * 获取全局容器实例
 */
export function getContainer(): Container {
  if (!globalContainer) {
    globalContainer = new DiContainer();
  }
  return globalContainer;
}

/**
 * 设置全局容器实例（用于测试）
 */
export function setContainer(container: Container): void {
  globalContainer = container;
}

/**
 * 重置全局容器（用于测试）
 */
export function resetContainer(): void {
  globalContainer = null;
}

