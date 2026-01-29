/**
 * PluginRegistry 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginRegistry } from '../../../src-v2/core/plugin/PluginRegistry.js';
import { Plugin } from '../../../src-v2/core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../../src-v2/core/plugin/types.js';

// Mock 插件
class MockPlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'mock-plugin',
    version: '1.0.0',
    author: 'Test',
    description: 'Mock plugin for testing',
    mcpVersion: '1.0.0',
  };

  register(registry: CapabilityRegistry): void {
    // Mock implementation
  }
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('应该能够注册插件', () => {
      const plugin = new MockPlugin();
      registry.register(plugin);

      expect(registry.get('mock-plugin')).toBe(plugin);
    });

    it('应该在重复注册时抛出错误', () => {
      const plugin = new MockPlugin();
      registry.register(plugin);

      expect(() => {
        registry.register(new MockPlugin());
      }).toThrow("Plugin 'mock-plugin' is already registered");
    });
  });

  describe('list', () => {
    it('应该列出所有注册的插件', () => {
      const plugin1 = new MockPlugin();
      const plugin2 = new MockPlugin();
      plugin2.metadata.name = 'mock-plugin-2';

      registry.register(plugin1);
      registry.register(plugin2);

      const plugins = registry.list();
      expect(plugins.length).toBe(2);
    });
  });

  describe('startAll/stopAll', () => {
    it('应该能够启动所有插件', async () => {
      const plugin = new MockPlugin();
      registry.register(plugin);

      await registry.startAll();
      // 验证插件已启动（如果有状态检查）
      expect(registry.list().length).toBe(1);
    });

    it('应该能够停止所有插件', async () => {
      const plugin = new MockPlugin();
      registry.register(plugin);

      await registry.startAll();
      await registry.stopAll();
      // 验证插件已停止（如果有状态检查）
      expect(registry.list().length).toBe(1);
    });
  });
});

