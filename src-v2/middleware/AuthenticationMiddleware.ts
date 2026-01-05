/**
 * 认证中间件
 * 
 * 验证请求的认证信息（API Key、Bearer Token）
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import { BusinessError } from '../errors/BaseError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 认证配置
 */
export interface AuthenticationConfig {
  enabled: boolean;
  type: 'api-key' | 'bearer' | 'jwt';
  apiKey?: string;
  token?: string;
  jwtSecret?: string;
}

/**
 * 认证中间件
 */
export class AuthenticationMiddleware implements IMiddleware {
  readonly name = 'authentication';
  readonly priority = 10; // 高优先级，在其他中间件之前执行

  constructor(
    private readonly config: AuthenticationConfig,
    private readonly logger?: ILogger
  ) {}

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    // 如果认证未启用，直接通过
    if (!this.config.enabled) {
      return await next();
    }

    // 从上下文中获取认证信息
    const apiKey = context.metadata.get('apiKey') as string | undefined;
    const token = context.metadata.get('token') as string | undefined;
    const authHeader = context.metadata.get('authorization') as string | undefined;

    // 验证认证信息
    let authenticated = false;

    if (this.config.type === 'api-key') {
      authenticated = apiKey === this.config.apiKey;
    } else if (this.config.type === 'bearer') {
      const bearerToken = authHeader?.replace('Bearer ', '') || token;
      authenticated = bearerToken === this.config.token;
    } else if (this.config.type === 'jwt') {
      // JWT 验证（简化版，实际应该使用 jwt 库）
      this.logger?.warn('JWT authentication not fully implemented');
      authenticated = false;
    }

    if (!authenticated) {
      this.logger?.warn('Authentication failed', {
        traceId: context.traceId,
        authType: this.config.type,
      });
      throw new BusinessError(
        ErrorCodes.GITLAB_AUTH_FAILED,
        'Authentication failed',
        { authType: this.config.type }
      );
    }

    // 认证成功，继续执行
    context.metadata.set('authenticated', true);
    return await next();
  }
}

