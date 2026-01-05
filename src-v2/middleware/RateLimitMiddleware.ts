/**
 * 限流中间件
 * 
 * 实现令牌桶算法进行请求限流
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import { SystemError } from '../errors/BaseError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 限流配置
 */
export interface RateLimitConfig {
  enabled: boolean;
  /**
   * 每秒允许的请求数
   */
  requestsPerSecond: number;
  /**
   * 时间窗口（秒）
   */
  windowSeconds?: number;
  /**
   * 是否按用户限流
   */
  perUser?: boolean;
}

/**
 * 令牌桶
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  /**
   * 尝试消费令牌
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();
    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }
    return false;
  }

  /**
   * 补充令牌
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // 转换为秒
    const tokensToAdd = elapsed * this.refillRate;
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * 获取剩余令牌数
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * 限流中间件
 */
export class RateLimitMiddleware implements IMiddleware {
  readonly name = 'rate-limit';
  readonly priority = 20; // 在认证之后，业务逻辑之前

  private globalBucket: TokenBucket | null = null;
  private userBuckets: Map<string, TokenBucket> = new Map();

  constructor(
    private readonly config: RateLimitConfig,
    private readonly logger?: ILogger
  ) {
    if (config.enabled) {
      const windowSeconds = config.windowSeconds || 1;
      const capacity = config.requestsPerSecond * windowSeconds;
      this.globalBucket = new TokenBucket(capacity, config.requestsPerSecond);
    }
  }

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    // 如果限流未启用，直接通过
    if (!this.config.enabled || !this.globalBucket) {
      return await next();
    }

    // 确定使用哪个令牌桶
    let bucket: TokenBucket = this.globalBucket;

    if (this.config.perUser && context.userId) {
      if (!this.userBuckets.has(context.userId)) {
        const windowSeconds = this.config.windowSeconds || 1;
        const capacity = this.config.requestsPerSecond * windowSeconds;
        this.userBuckets.set(
          context.userId,
          new TokenBucket(capacity, this.config.requestsPerSecond)
        );
      }
      bucket = this.userBuckets.get(context.userId)!;
    }

    // 尝试消费令牌
    if (!bucket.tryConsume()) {
      this.logger?.warn('Rate limit exceeded', {
        traceId: context.traceId,
        userId: context.userId,
      });
      throw new SystemError(
        ErrorCodes.GITLAB_RATE_LIMIT_EXCEEDED,
        'Rate limit exceeded',
        {
          requestsPerSecond: this.config.requestsPerSecond,
          availableTokens: bucket.getAvailableTokens(),
        }
      );
    }

    // 限流通过，继续执行
    return await next();
  }
}

