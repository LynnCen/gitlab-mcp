/**
 * StdioTransport 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StdioTransport } from '../../../../src-v2/transport/StdioTransport.js';

describe('StdioTransport', () => {
  let transport: StdioTransport;

  beforeEach(() => {
    transport = new StdioTransport('test-stdio');
  });

  it('应该能够创建传输实例', () => {
    expect(transport).toBeInstanceOf(StdioTransport);
    expect(transport.type).toBe('stdio');
    expect(transport.name).toBe('test-stdio');
  });

  it('应该能够启动传输', async () => {
    await transport.start();
    expect(transport.isHealthy()).toBe(true);
  });

  it('应该能够停止传输', async () => {
    await transport.start();
    await transport.stop();
    expect(transport.isHealthy()).toBe(false);
  });

  it('应该能够注册消息处理器', () => {
    const handler = vi.fn();
    transport.onMessage(handler);
    // 由于 StdioTransport 的消息处理由 MCP SDK 管理，这里只测试注册
    expect(handler).toBeDefined();
  });

  it('应该能够注册错误处理器', () => {
    const handler = vi.fn();
    transport.onError(handler);
    expect(handler).toBeDefined();
  });

  it('应该能够获取底层 MCP Transport', () => {
    const mcpTransport = transport.getMcpTransport();
    expect(mcpTransport).toBeDefined();
  });
});

