/**
 * 错误处理中间件
 * 
 * 统一处理错误，转换为标准格式
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import { ErrorHandler } from '../errors/index.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 错误处理中间件
 */
export class ErrorHandlingMiddleware implements IMiddleware {
  readonly name = 'error-handling';
  readonly priority = 200;

  private errorHandler: ErrorHandler;

  constructor(logger?: ILogger) {
    this.errorHandler = new ErrorHandler(logger);
  }

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    try {
      return await next();
    } catch (error) {
      // 使用错误处理器处理错误
      const handledError = this.errorHandler.handle(error, {
        logError: false, // 日志已在 LoggingMiddleware 中记录
        includeStack: process.env.NODE_ENV !== 'production',
        includeDetails: true,
      });

      // 将错误信息添加到上下文
      context.metadata.set('error', handledError);

      // 重新抛出错误（让上层处理）
      throw error;
    }
  }
}

