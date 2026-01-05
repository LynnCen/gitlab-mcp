/**
 * 缓存中间件
 * 
 * 在工具执行前后进行缓存读写
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import type { ICacheProvider } from '../cache/CacheProvider.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 缓存配置
 */
export interface CacheConfig {
  enabled: boolean;
  /**
   * 默认 TTL（秒）
   */
  defaultTtl?: number;
  /**
   * 是否缓存错误响应
   */
  cacheErrors?: boolean;
}

/**
 * 缓存中间件
 */
export class CacheMiddleware implements IMiddleware {
  readonly name = 'cache';
  readonly priority = 50; // 在限流之后，业务逻辑之前

  constructor(
    private readonly cache: ICacheProvider,
    private readonly config: CacheConfig,
    private readonly logger?: ILogger
  ) {}

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    // 如果缓存未启用，直接通过
    if (!this.config.enabled) {
      return await next();
    }

    // 只缓存工具请求
    if (context.request.type !== 'tool') {
      return await next();
    }

    const { request } = context;
    const cacheKey = this.generateCacheKey(request);

    // 尝试从缓存获取
    try {
      const cached = await this.cache.get(cacheKey);
      if (cached !== null) {
        this.logger?.debug('Cache hit', {
          traceId: context.traceId,
          cacheKey,
        });
        context.metadata.set('cached', true);
        return cached;
      }
    } catch (error) {
      this.logger?.warn('Cache read error', error as Error);
    }

    // 缓存未命中，执行处理器
    const result = await next();

    // 将结果写入缓存
    try {
      const ttl = this.config.defaultTtl || 300;
      await this.cache.set(cacheKey, result, ttl);
      this.logger?.debug('Cache set', {
        traceId: context.traceId,
        cacheKey,
        ttl,
      });
    } catch (error) {
      this.logger?.warn('Cache write error', error as Error);
    }

    return result;
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: any): string {
    if (request.type === 'tool') {
      return `tool:${request.toolName}:${JSON.stringify(request.params)}`;
    }
    return `unknown:${JSON.stringify(request)}`;
  }
}

