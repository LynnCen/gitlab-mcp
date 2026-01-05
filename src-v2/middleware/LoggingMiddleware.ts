/**
 * 日志中间件
 * 
 * 记录请求和响应的日志
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 日志中间件
 */
export class LoggingMiddleware implements IMiddleware {
  readonly name = 'logging';
  readonly priority = 100;

  constructor(private readonly logger: ILogger) {}

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    const { request, traceId, startTime } = context;

    // 记录请求开始
    this.logger.info('Request started', {
      traceId,
      requestType: request.type,
      ...(request.type === 'tool' && { toolName: request.toolName }),
      ...(request.type === 'resource' && { uri: request.uri }),
      ...(request.type === 'prompt' && { promptName: request.promptName }),
    });

    try {
      // 执行下一个中间件或处理器
      const result = await next();

      // 记录请求成功
      const duration = Date.now() - startTime;
      this.logger.info('Request completed', {
        traceId,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      // 记录请求失败
      const duration = Date.now() - startTime;
      this.logger.error('Request failed', error as Error, {
        traceId,
        duration,
        success: false,
      });

      throw error;
    }
  }
}

