/**
 * MiddlewareChain 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MiddlewareChain } from '../../../../src-v2/middleware/MiddlewareChain.js';
import type { IMiddleware } from '../../../../src-v2/middleware/Middleware.js';
import type { MiddlewareContext } from '../../../../src-v2/middleware/types.js';

// 测试中间件实现
class TestMiddleware implements IMiddleware {
  constructor(
    public readonly name: string,
    public readonly priority: number,
    private readonly onExecute?: (context: MiddlewareContext) => void
  ) {}

  async execute(context: MiddlewareContext, next: () => Promise<any>): Promise<any> {
    if (this.onExecute) {
      this.onExecute(context);
    }
    return await next();
  }
}

describe('MiddlewareChain', () => {
  let chain: MiddlewareChain;
  let context: MiddlewareContext;

  beforeEach(() => {
    chain = new MiddlewareChain();
    context = {
      request: { type: 'tool', toolName: 'test', params: {} },
      metadata: new Map(),
      startTime: Date.now(),
      traceId: 'trace-1',
    };
  });

  it('应该能够添加中间件', () => {
    const middleware = new TestMiddleware('test', 100);
    chain.use(middleware);
    expect(chain.getMiddlewareCount()).toBe(1);
  });

  it('应该按优先级排序中间件', () => {
    const m1 = new TestMiddleware('m1', 200);
    const m2 = new TestMiddleware('m2', 100);
    const m3 = new TestMiddleware('m3', 150);

    chain.use(m1);
    chain.use(m2);
    chain.use(m3);

    const middlewares = chain.getMiddlewares();
    expect(middlewares[0].name).toBe('m2'); // 优先级 100
    expect(middlewares[1].name).toBe('m3'); // 优先级 150
    expect(middlewares[2].name).toBe('m1'); // 优先级 200
  });

  it('应该能够执行中间件链', async () => {
    const executionOrder: string[] = [];

    const m1 = new TestMiddleware('m1', 100, () => {
      executionOrder.push('m1');
    });
    const m2 = new TestMiddleware('m2', 200, () => {
      executionOrder.push('m2');
    });

    chain.use(m1);
    chain.use(m2);

    const handler = vi.fn(async () => {
      executionOrder.push('handler');
      return 'result';
    });

    const result = await chain.execute(context, handler);

    expect(result).toBe('result');
    expect(executionOrder).toEqual(['m1', 'm2', 'handler']);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('应该能够清除所有中间件', () => {
    chain.use(new TestMiddleware('test', 100));
    chain.clear();
    expect(chain.getMiddlewareCount()).toBe(0);
  });

  it('应该能够处理中间件抛出错误', async () => {
    const errorMiddleware = new TestMiddleware('error', 100, () => {
      throw new Error('Middleware error');
    });

    chain.use(errorMiddleware);

    const handler = vi.fn();

    await expect(chain.execute(context, handler)).rejects.toThrow('Middleware error');
    expect(handler).not.toHaveBeenCalled();
  });
});

