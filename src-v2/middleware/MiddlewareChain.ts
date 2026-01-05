/**
 * 中间件链
 * 
 * 实现责任链模式，按优先级顺序执行中间件
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';

/**
 * 中间件链
 */
export class MiddlewareChain {
  private middlewares: IMiddleware[] = [];

  /**
   * 添加中间件
   */
  use(middleware: IMiddleware): void {
    this.middlewares.push(middleware);
    // 按优先级排序（数字越小，优先级越高）
    this.middlewares.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 执行中间件链
   * @param context 中间件上下文
   * @param handler 最终处理器（在所有中间件执行后调用）
   * @returns 处理结果
   */
  async execute(context: MiddlewareContext, handler: () => Promise<any>): Promise<any> {
    // 构建中间件执行链
    let index = 0;

    const next = async (): Promise<any> => {
      if (index >= this.middlewares.length) {
        // 所有中间件执行完毕，调用最终处理器
        return await handler();
      }

      const middleware = this.middlewares[index++];
      return await middleware.execute(context, next);
    };

    return await next();
  }

  /**
   * 清除所有中间件
   */
  clear(): void {
    this.middlewares = [];
  }

  /**
   * 获取中间件数量
   */
  getMiddlewareCount(): number {
    return this.middlewares.length;
  }

  /**
   * 获取所有中间件
   */
  getMiddlewares(): IMiddleware[] {
    return [...this.middlewares];
  }
}

