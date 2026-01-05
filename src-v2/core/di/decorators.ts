/**
 * 依赖注入装饰器
 */

import 'reflect-metadata';
import { inject, injectable as tsyringeInjectable } from 'tsyringe';
import type { Token } from './types.js';

/**
 * 标记类为可注入的服务
 * 
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   // ...
 * }
 * ```
 */
export function Injectable(): ClassDecorator {
  return tsyringeInjectable();
}

/**
 * 注入依赖
 * 
 * @param token 服务标识符
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   constructor(
 *     @Inject('ILogger') private logger: ILogger,
 *     @Inject(ConfigService) private config: ConfigService
 *   ) {}
 * }
 * ```
 */
export function Inject<T>(token: Token<T>): ParameterDecorator {
  return inject(token as any);
}

/**
 * 可选注入（如果服务未注册，则注入 undefined）
 * 
 * @param token 服务标识符
 * @example
 * ```typescript
 * @Injectable()
 * class MyService {
 *   constructor(
 *     @Optional('IOptionalService') private optional?: IOptionalService
 *   ) {}
 * }
 * ```
 */
export function Optional<T>(token: Token<T>): ParameterDecorator {
  return (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    // TSyringe 不直接支持可选注入，我们需要通过 tryResolve 实现
    // 这里先标记，实际解析时在容器层面处理
    const existingMetadata = Reflect.getMetadata('design:paramtypes', target) || [];
    const metadata = [...existingMetadata];
    metadata[parameterIndex] = { token, optional: true };
    Reflect.defineMetadata('design:paramtypes', metadata, target);
  };
}

