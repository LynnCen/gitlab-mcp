/**
 * DI 容器单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiContainer, getContainer, setContainer, resetContainer } from '../../../../src-v2/core/di/Container.js';
import { Injectable, Inject } from '../../../../src-v2/core/di/decorators.js';
import type { Container } from '../../../../src-v2/core/di/types.js';

// 测试接口
interface ILogger {
  log(message: string): void;
}

interface IConfig {
  get(key: string): string;
}

// 测试实现
@Injectable()
class Logger implements ILogger {
  log(message: string): void {
    console.log(message);
  }
}

@Injectable()
class Config implements IConfig {
  private data: Record<string, string> = {};

  get(key: string): string {
    return this.data[key] || '';
  }

  set(key: string, value: string): void {
    this.data[key] = value;
  }
}

@Injectable()
class ServiceWithDependency {
  constructor(
    @Inject('ILogger') private logger: ILogger,
    @Inject('IConfig') private config: IConfig
  ) {}

  doSomething(): string {
    this.logger.log('Doing something');
    return this.config.get('key');
  }
}

describe('DiContainer', () => {
  let container: Container;

  beforeEach(() => {
    container = new DiContainer();
  });

  describe('register', () => {
    it('应该能够注册类服务（singleton）', () => {
      container.register('ILogger', Logger, { lifecycle: 'singleton' });
      
      const instance1 = container.resolve<ILogger>('ILogger');
      const instance2 = container.resolve<ILogger>('ILogger');
      
      expect(instance1).toBe(instance2); // 单例模式，应该是同一个实例
      expect(instance1).toBeInstanceOf(Logger);
    });

    it('应该能够注册类服务（transient）', () => {
      container.register('ILogger', Logger, { lifecycle: 'transient' });
      
      const instance1 = container.resolve<ILogger>('ILogger');
      const instance2 = container.resolve<ILogger>('ILogger');
      
      expect(instance1).not.toBe(instance2); // 瞬时模式，应该是不同实例
      expect(instance1).toBeInstanceOf(Logger);
      expect(instance2).toBeInstanceOf(Logger);
    });

    it('应该能够注册工厂函数', () => {
      const factory = () => new Logger();
      container.register('ILogger', factory, { lifecycle: 'singleton' });
      
      const instance = container.resolve<ILogger>('ILogger');
      expect(instance).toBeInstanceOf(Logger);
    });

    it('应该能够使用符号作为 token', () => {
      const token = Symbol('ILogger');
      container.register(token, Logger);
      
      const instance = container.resolve<ILogger>(token);
      expect(instance).toBeInstanceOf(Logger);
    });
  });

  describe('resolve', () => {
    it('应该能够解析已注册的服务', () => {
      container.register('ILogger', Logger);
      
      const instance = container.resolve<ILogger>('ILogger');
      expect(instance).toBeInstanceOf(Logger);
    });

    it('应该能够自动解析依赖', () => {
      container.register('ILogger', Logger);
      container.register('IConfig', Config);
      container.register('ServiceWithDependency', ServiceWithDependency);
      
      const service = container.resolve<ServiceWithDependency>('ServiceWithDependency');
      expect(service).toBeInstanceOf(ServiceWithDependency);
      expect(service.doSomething()).toBe('');
    });

    it('应该在没有注册时抛出错误', () => {
      expect(() => {
        container.resolve('NonExistentService');
      }).toThrow('Service with token NonExistentService is not registered');
    });
  });

  describe('tryResolve', () => {
    it('应该能够解析已注册的服务', () => {
      container.register('ILogger', Logger);
      
      const instance = container.tryResolve<ILogger>('ILogger');
      expect(instance).toBeInstanceOf(Logger);
    });

    it('应该在没有注册时返回 undefined', () => {
      const instance = container.tryResolve('NonExistentService');
      expect(instance).toBeUndefined();
    });
  });

  describe('isRegistered', () => {
    it('应该正确报告注册状态', () => {
      expect(container.isRegistered('ILogger')).toBe(false);
      
      container.register('ILogger', Logger);
      expect(container.isRegistered('ILogger')).toBe(true);
    });
  });

  describe('clear', () => {
    it('应该清除所有注册', () => {
      container.register('ILogger', Logger);
      expect(container.isRegistered('ILogger')).toBe(true);
      
      container.clear();
      expect(container.isRegistered('ILogger')).toBe(false);
    });
  });

  describe('createChild', () => {
    it('应该能够创建子容器', () => {
      container.register('ILogger', Logger);
      
      const child = container.createChild();
      expect(child).toBeInstanceOf(DiContainer);
      expect(child.isRegistered('ILogger')).toBe(true); // 子容器应该继承父容器的注册
    });
  });

  describe('lifecycle', () => {
    it('singleton 应该在整个容器生命周期内保持单例', () => {
      container.register('ILogger', Logger, { lifecycle: 'singleton' });
      
      const instance1 = container.resolve<ILogger>('ILogger');
      const instance2 = container.resolve<ILogger>('ILogger');
      
      expect(instance1).toBe(instance2);
    });

    it('transient 应该每次解析都创建新实例', () => {
      container.register('ILogger', Logger, { lifecycle: 'transient' });
      
      const instance1 = container.resolve<ILogger>('ILogger');
      const instance2 = container.resolve<ILogger>('ILogger');
      
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(Logger);
      expect(instance2).toBeInstanceOf(Logger);
    });
  });
});

describe('getContainer', () => {
  beforeEach(() => {
    resetContainer();
  });

  it('应该返回全局容器实例', () => {
    const container1 = getContainer();
    const container2 = getContainer();
    
    expect(container1).toBe(container2); // 应该是同一个实例
  });

  it('应该能够设置自定义容器', () => {
    const customContainer = new DiContainer();
    setContainer(customContainer);
    
    const container = getContainer();
    expect(container).toBe(customContainer);
  });

  it('应该能够重置容器', () => {
    const container1 = getContainer();
    resetContainer();
    const container2 = getContainer();
    
    expect(container1).not.toBe(container2);
  });
});

