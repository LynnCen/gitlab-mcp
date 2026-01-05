/**
 * TransportManager 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TransportManager } from '../../../../src-v2/transport/TransportManager.js';
import { StdioTransport } from '../../../../src-v2/transport/StdioTransport.js';
import type { ITransport } from '../../../../src-v2/transport/Transport.js';

describe('TransportManager', () => {
  let manager: TransportManager;
  let stdioTransport: ITransport;

  beforeEach(() => {
    manager = new TransportManager();
    stdioTransport = new StdioTransport('test-stdio');
  });

  it('应该能够注册传输', () => {
    manager.registerTransport(stdioTransport);
    expect(manager.hasTransport('stdio')).toBe(true);
  });

  it('应该能够获取已注册的传输', () => {
    manager.registerTransport(stdioTransport);
    const transport = manager.getTransport('stdio');
    expect(transport).toBe(stdioTransport);
  });

  it('应该能够在重复注册时抛出错误', () => {
    manager.registerTransport(stdioTransport);
    expect(() => {
      manager.registerTransport(new StdioTransport('another-stdio'));
    }).toThrow("Transport of type 'stdio' is already registered");
  });

  it('应该能够获取所有传输', () => {
    manager.registerTransport(stdioTransport);
    const transports = manager.getAllTransports();
    expect(transports).toHaveLength(1);
    expect(transports[0]).toBe(stdioTransport);
  });

  it('应该能够启动所有传输', async () => {
    manager.registerTransport(stdioTransport);
    await manager.startAll();
    expect(stdioTransport.isHealthy()).toBe(true);
  });

  it('应该能够停止所有传输', async () => {
    manager.registerTransport(stdioTransport);
    await manager.startAll();
    await manager.stopAll();
    expect(stdioTransport.isHealthy()).toBe(false);
  });

  it('应该能够注销传输', () => {
    manager.registerTransport(stdioTransport);
    manager.unregisterTransport('stdio');
    expect(manager.hasTransport('stdio')).toBe(false);
  });
});

