/**
 * ConfigRepository 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigRepository } from '../../../src-v2/repositories/ConfigRepository.js';
import { ConfigManager } from '../../../src-v2/config/ConfigManager.js';
import type { AppConfig } from '../../../src-v2/config/types.js';

describe('ConfigRepository', () => {
  let repository: ConfigRepository;
  let mockConfigManager: ConfigManager;

  beforeEach(() => {
    const mockConfig: AppConfig = {
      gitlab: {
        host: 'https://gitlab.com',
        token: 'test-token',
      },
      server: {
        port: 3000,
      },
      middleware: {
        auth: {
          enabled: true,
        },
      },
      plugins: {
        enabled: ['plugin1'],
      },
    };

    mockConfigManager = {
      getConfig: vi.fn(() => mockConfig),
      getGitLabConfig: vi.fn(() => mockConfig.gitlab),
      getServerConfig: vi.fn(() => mockConfig.server),
      getMiddlewareConfig: vi.fn(() => mockConfig.middleware),
      getPluginsConfig: vi.fn(() => mockConfig.plugins),
      reload: vi.fn(),
    } as any;

    repository = new ConfigRepository(mockConfigManager);
  });

  describe('getConfig', () => {
    it('应该获取完整配置', () => {
      const config = repository.getConfig();

      expect(config).toBeDefined();
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
    });
  });

  describe('getGitLabConfig', () => {
    it('应该获取 GitLab 配置', () => {
      const config = repository.getGitLabConfig();

      expect(config).toBeDefined();
      expect(config.host).toBe('https://gitlab.com');
      expect(mockConfigManager.getGitLabConfig).toHaveBeenCalled();
    });
  });

  describe('getServerConfig', () => {
    it('应该获取服务器配置', () => {
      const config = repository.getServerConfig();

      expect(config).toBeDefined();
      expect(config.port).toBe(3000);
      expect(mockConfigManager.getServerConfig).toHaveBeenCalled();
    });
  });

  describe('reload', () => {
    it('应该重新加载配置', async () => {
      await repository.reload();

      expect(mockConfigManager.reload).toHaveBeenCalled();
    });
  });
});

