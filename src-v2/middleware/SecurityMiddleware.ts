/**
 * 安全中间件
 * 
 * 提供安全相关的中间件功能：
 * - 日志脱敏
 * - 错误信息脱敏
 * - 请求验证
 */

import type { IMiddleware, MiddlewareContext, MiddlewareNext } from './Middleware.js';
import type { ILogger } from '../logging/types.js';

/**
 * 敏感字段模式
 */
const SENSITIVE_PATTERNS = [
  /token/gi,
  /password/gi,
  /secret/gi,
  /api[_-]?key/gi,
  /authorization/gi,
  /bearer/gi,
];

/**
 * 脱敏函数
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    // 检查是否包含敏感信息
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(value)) {
        return '[REDACTED]';
      }
    }
    // 检查是否是 Token 格式（长字符串）
    if (value.length > 20 && /^[A-Za-z0-9_-]+$/.test(value)) {
      return '[TOKEN]';
    }
  }
  return value;
}

/**
 * 递归脱敏对象
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // 检查键名是否敏感
    const isSensitiveKey = SENSITIVE_PATTERNS.some((pattern) =>
      pattern.test(key)
    );

    if (isSensitiveKey) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeObject(value, depth + 1);
    }
  }

  return sanitized;
}

/**
 * 安全中间件
 */
export class SecurityMiddleware implements IMiddleware {
  constructor(private logger?: ILogger) {}

  async execute(
    context: MiddlewareContext,
    next: MiddlewareNext
  ): Promise<unknown> {
    // 脱敏请求参数
    if (context.params) {
      context.params = sanitizeObject(context.params) as any;
    }

    // 脱敏上下文元数据
    if (context.metadata) {
      context.metadata = sanitizeObject(context.metadata) as any;
    }

    try {
      const result = await next();

      // 脱敏响应结果（如果需要）
      if (result && typeof result === 'object') {
        return sanitizeObject(result);
      }

      return result;
    } catch (error) {
      // 脱敏错误信息
      const sanitizedError = this.sanitizeError(error);
      this.logger?.error('Request failed', {
        error: sanitizedError,
        context: sanitizeObject(context),
      });
      throw sanitizedError;
    }
  }

  /**
   * 脱敏错误信息
   */
  private sanitizeError(error: unknown): unknown {
    if (error instanceof Error) {
      // 创建新错误，脱敏消息
      const sanitizedMessage = sanitizeValue(error.message) as string;
      const sanitizedError = new Error(sanitizedMessage);
      sanitizedError.name = error.name;
      sanitizedError.stack = '[REDACTED]'; // 不暴露堆栈信息
      return sanitizedError;
    }
    return sanitizeValue(error);
  }
}

