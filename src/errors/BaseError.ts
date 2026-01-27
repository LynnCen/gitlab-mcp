/**
 * 错误基类
 */

/**
 * 错误详情
 */
export interface ErrorDetails {
  [key: string]: any;
}

/**
 * 错误基类
 */
export abstract class BaseError extends Error {
  public readonly code: string;
  public readonly details?: ErrorDetails;
  public readonly timestamp: Date;

  constructor(code: string, message: string, details?: ErrorDetails) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // 保持正确的堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 转换为 JSON
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * 转换为字符串
   */
  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

