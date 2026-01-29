/**
 * 业务错误
 * 
 * 用于表示业务逻辑错误，如参数验证失败、业务规则违反等
 */

import { BaseError, type ErrorDetails } from './BaseError.js';

/**
 * 业务错误类
 */
export class BusinessError extends BaseError {
  constructor(code: string, message: string, details?: ErrorDetails) {
    super(code, message, details);
  }
}

