/**
 * 性能监控中间件
 * 
 * 收集请求性能指标
 */

import type { IMiddleware } from './Middleware.js';
import type { MiddlewareContext } from './types.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * 性能指标
 */
export interface PerformanceMetrics {
  requestCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  errorCount: number;
  successCount: number;
}

/**
 * 性能监控中间件
 */
export class PerformanceMiddleware implements IMiddleware {
  readonly name = 'performance';
  readonly priority = 300; // 低优先级，在其他中间件之后执行

  private metrics: Map<string, PerformanceMetrics> = new Map();

  constructor(private readonly logger?: ILogger) {}

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    const startTime = Date.now();
    const { request } = context;

    // 确定指标键
    const metricKey = this.getMetricKey(request);

    try {
      // 执行下一个中间件或处理器
      const result = await next();

      // 记录成功指标
      const duration = Date.now() - startTime;
      this.recordMetric(metricKey, duration, true);

      // 将性能信息添加到上下文
      context.metadata.set('performance', {
        duration,
        metricKey,
      });

      return result;
    } catch (error) {
      // 记录失败指标
      const duration = Date.now() - startTime;
      this.recordMetric(metricKey, duration, false);

      throw error;
    }
  }

  /**
   * 获取指标键
   */
  private getMetricKey(request: any): string {
    if (request.type === 'tool') {
      return `tool:${request.toolName}`;
    }
    if (request.type === 'resource') {
      return `resource:${request.uri.split('/')[0]}`;
    }
    if (request.type === 'prompt') {
      return `prompt:${request.promptName}`;
    }
    return 'unknown';
  }

  /**
   * 记录指标
   */
  private recordMetric(key: string, duration: number, success: boolean): void {
    let metric = this.metrics.get(key);
    if (!metric) {
      metric = {
        requestCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errorCount: 0,
        successCount: 0,
      };
      this.metrics.set(key, metric);
    }

    metric.requestCount++;
    metric.totalDuration += duration;
    metric.averageDuration = metric.totalDuration / metric.requestCount;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);

    if (success) {
      metric.successCount++;
    } else {
      metric.errorCount++;
    }
  }

  /**
   * 获取指标
   */
  getMetrics(key?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (key) {
      return this.metrics.get(key) || {
        requestCount: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorCount: 0,
        successCount: 0,
      };
    }
    return new Map(this.metrics);
  }

  /**
   * 重置指标
   */
  resetMetrics(): void {
    this.metrics.clear();
  }
}

