/**
 * 系统错误
 * 
 * 用于表示系统级错误，如网络错误、数据库错误、配置错误等
 */

import { BaseError, type ErrorDetails } from './BaseError.js';

/**
 * 系统错误类
 */
export class SystemError extends BaseError {
  constructor(code: string, message: string, details?: ErrorDetails) {
    super(code, message, details);
  }
}

