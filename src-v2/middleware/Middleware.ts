/**
 * 中间件接口
 */

import type { MiddlewareContext } from './types.js';

/**
 * 中间件接口
 */
export interface IMiddleware {
  /**
   * 中间件名称
   */
  readonly name: string;

  /**
   * 优先级（数字越小，优先级越高）
   */
  readonly priority: number;

  /**
   * 执行中间件
   * @param context 中间件上下文
   * @param next 下一个中间件或处理器的函数
   * @returns 处理结果
   */
  execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any>;
}

