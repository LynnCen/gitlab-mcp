/**
 * DI 装饰器单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Injectable, Inject } from '../../../../src-v2/core/di/decorators.js';
import { DiContainer } from '../../../../src-v2/core/di/Container.js';
import type { Container } from '../../../../src-v2/core/di/types.js';

// 测试接口
interface ILogger {
  log(message: string): void;
}

// 测试实现
@Injectable()
class Logger implements ILogger {
  log(message: string): void {
    console.log(message);
  }
}

@Injectable()
class ServiceWithDependency {
  constructor(
    @Inject('ILogger') public logger: ILogger
  ) {}
}

describe('Injectable', () => {
  it('应该能够标记类为可注入', () => {
    const container = new DiContainer();
    container.register('ILogger', Logger);
    
    const instance = container.resolve<ILogger>('ILogger');
    expect(instance).toBeInstanceOf(Logger);
  });
});

describe('Inject', () => {
  it('应该能够注入依赖', () => {
    const container = new DiContainer();
    container.register('ILogger', Logger);
    container.register('ServiceWithDependency', ServiceWithDependency);
    
    const service = container.resolve<ServiceWithDependency>('ServiceWithDependency');
    expect(service.logger).toBeInstanceOf(Logger);
  });

  it('应该在没有注册依赖时抛出错误', () => {
    const container = new DiContainer();
    container.register('ServiceWithDependency', ServiceWithDependency);
    
    expect(() => {
      container.resolve<ServiceWithDependency>('ServiceWithDependency');
    }).toThrow();
  });
});

