/**
 * GitLab API 错误
 * 
 * 用于表示 GitLab API 调用相关的错误
 */

import { SystemError } from './SystemError.js';
import type { ErrorDetails } from './BaseError.js';

/**
 * GitLab API 错误类
 */
export class GitLabApiError extends SystemError {
  public readonly statusCode?: number;
  public readonly apiEndpoint?: string;
  public readonly requestId?: string;

  constructor(
    code: string,
    message: string,
    options?: {
      statusCode?: number;
      apiEndpoint?: string;
      requestId?: string;
      details?: ErrorDetails;
    }
  ) {
    super(code, message, options?.details);
    this.statusCode = options?.statusCode;
    this.apiEndpoint = options?.apiEndpoint;
    this.requestId = options?.requestId;
  }

  /**
   * 转换为 JSON
   */
  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      apiEndpoint: this.apiEndpoint,
      requestId: this.requestId,
    };
  }
}

