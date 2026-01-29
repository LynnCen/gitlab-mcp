/**
 * 错误处理器
 */

import type { ILogger } from '../logging/Logger.js';
import { BaseError } from './BaseError.js';
import { BusinessError } from './BusinessError.js';
import { SystemError } from './SystemError.js';
import { GitLabApiError } from './GitLabApiError.js';

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
  /**
   * 是否记录错误日志
   */
  logError?: boolean;

  /**
   * 是否包含堆栈跟踪
   */
  includeStack?: boolean;

  /**
   * 是否包含错误详情
   */
  includeDetails?: boolean;
}

/**
 * 错误处理器
 */
export class ErrorHandler {
  constructor(private readonly logger?: ILogger) {}

  /**
   * 处理错误
   */
  handle(error: unknown, options: ErrorHandlerOptions = {}): {
    code: string;
    message: string;
    details?: any;
    stack?: string;
  } {
    const {
      logError = true,
      includeStack = false,
      includeDetails = true,
    } = options;

    // 如果是 BaseError，直接使用
    if (error instanceof BaseError) {
      if (logError) {
        this.logError(error);
      }

      return {
        code: error.code,
        message: error.message,
        ...(includeDetails && error.details && { details: error.details }),
        ...(includeStack && error.stack && { stack: error.stack }),
      };
    }

    // 如果是标准 Error
    if (error instanceof Error) {
      if (logError) {
        this.logger?.error('Unexpected error', error);
      }

      return {
        code: 'INTERNAL_7001',
        message: error.message || 'An unexpected error occurred',
        ...(includeStack && error.stack && { stack: error.stack }),
      };
    }

    // 未知错误类型
    if (logError) {
      this.logger?.error('Unknown error', undefined, { error });
    }

    return {
      code: 'INTERNAL_7001',
      message: 'An unknown error occurred',
      ...(includeDetails && { details: { error: String(error) } }),
    };
  }

  /**
   * 记录错误日志
   */
  private logError(error: BaseError): void {
    if (!this.logger) {
      return;
    }

    const context = {
      code: error.code,
      details: error.details,
      timestamp: error.timestamp.toISOString(),
    };

    if (error instanceof GitLabApiError) {
      this.logger.error(error.message, error, {
        ...context,
        statusCode: error.statusCode,
        apiEndpoint: error.apiEndpoint,
        requestId: error.requestId,
      });
    } else if (error instanceof SystemError) {
      this.logger.error(error.message, error, context);
    } else if (error instanceof BusinessError) {
      this.logger.warn(error.message, context);
    } else {
      this.logger.error(error.message, error, context);
    }
  }

  /**
   * 判断是否为业务错误
   */
  isBusinessError(error: unknown): error is BusinessError {
    return error instanceof BusinessError;
  }

  /**
   * 判断是否为系统错误
   */
  isSystemError(error: unknown): error is SystemError {
    return error instanceof SystemError;
  }

  /**
   * 判断是否为 GitLab API 错误
   */
  isGitLabApiError(error: unknown): error is GitLabApiError {
    return error instanceof GitLabApiError;
  }
}

