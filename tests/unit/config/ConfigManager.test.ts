/**
 * ConfigManager 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigManager } from '../../../../src-v2/config/ConfigManager.js';
import { EnvConfigProvider } from '../../../../src-v2/config/EnvConfigProvider.js';
import type { IConfigProvider } from '../../../../src-v2/config/ConfigProvider.js';

describe('ConfigManager', () => {
  let mockProvider: IConfigProvider;

  beforeEach(() => {
    mockProvider = {
      get: vi.fn((key: string, defaultValue?: any) => {
        const values: Record<string, any> = {
          GITLAB_HOST: 'https://gitlab.com',
          GITLAB_TOKEN: 'test-token',
          GITLAB_TIMEOUT: '30000',
          GITLAB_RETRIES: '3',
          SERVER_PORT: '3000',
          SERVER_HOST: '0.0.0.0',
          LOG_LEVEL: 'info',
          LOG_OUTPUT: 'console',
          AUTH_ENABLED: 'false',
          AUTH_MODE: 'api-key',
          API_KEY: 'test-api-key',
          RATE_LIMIT_ENABLED: 'true',
          RATE_LIMIT_GLOBAL_REQUESTS: '100',
          RATE_LIMIT_GLOBAL_WINDOW: '1s',
          CACHE_ENABLED: 'true',
          CACHE_TYPE: 'memory',
          CACHE_TTL: '300',
          PLUGINS_ENABLED: 'plugin1,plugin2',
        };
        return values[key] !== undefined ? values[key] : defaultValue;
      }),
      has: vi.fn((key: string) => {
        const keys = ['GITLAB_HOST', 'GITLAB_TOKEN'];
        return keys.includes(key);
      }),
      getAll: vi.fn(() => ({})),
      reload: vi.fn(async () => {}),
    };
  });

  it('应该能够创建配置管理器', () => {
    const manager = new ConfigManager(mockProvider);
    expect(manager).toBeInstanceOf(ConfigManager);
  });

  it('应该能够获取 GitLab 配置', () => {
    const manager = new ConfigManager(mockProvider);
    const config = manager.getGitLabConfig();

    expect(config.host).toBe('https://gitlab.com');
    expect(config.token).toBe('test-token');
    expect(config.timeout).toBe(30000);
    expect(config.retries).toBe(3);
  });

  it('应该能够获取服务器配置', () => {
    const manager = new ConfigManager(mockProvider);
    const config = manager.getServerConfig();

    expect(config.port).toBe(3000);
    expect(config.host).toBe('0.0.0.0');
    expect(config.logLevel).toBe('info');
    expect(config.logOutput).toBe('console');
  });

  it('应该能够获取中间件配置', () => {
    const manager = new ConfigManager(mockProvider);
    const config = manager.getMiddlewareConfig();

    expect(config.auth?.enabled).toBe(false);
    expect(config.rateLimit?.enabled).toBe(true);
    expect(config.cache?.enabled).toBe(true);
  });

  it('应该能够获取插件配置', () => {
    const manager = new ConfigManager(mockProvider);
    const config = manager.getPluginsConfig();

    expect(config.enabled).toEqual(['plugin1', 'plugin2']);
  });

  it('应该能够重新加载配置', async () => {
    const manager = new ConfigManager(mockProvider);
    await manager.reload();

    expect(mockProvider.reload).toHaveBeenCalled();
  });

  it('应该在配置验证失败时抛出错误', () => {
    const invalidProvider: IConfigProvider = {
      get: vi.fn(() => ''),
      has: vi.fn(() => false),
      getAll: vi.fn(() => ({})),
      reload: vi.fn(async () => {}),
    };

    expect(() => {
      new ConfigManager(invalidProvider);
    }).toThrow('Configuration validation failed');
  });
});

describe('EnvConfigProvider', () => {
  it('应该能够从环境变量加载配置', () => {
    process.env.TEST_KEY = 'test-value';
    const provider = new EnvConfigProvider();
    
    expect(provider.get('TEST_KEY')).toBe('test-value');
    delete process.env.TEST_KEY;
  });

  it('应该能够转换字符串为布尔值', () => {
    process.env.TEST_BOOL_TRUE = 'true';
    process.env.TEST_BOOL_FALSE = 'false';
    const provider = new EnvConfigProvider();
    
    expect(provider.get('TEST_BOOL_TRUE')).toBe(true);
    expect(provider.get('TEST_BOOL_FALSE')).toBe(false);
    
    delete process.env.TEST_BOOL_TRUE;
    delete process.env.TEST_BOOL_FALSE;
  });

  it('应该能够转换字符串为数字', () => {
    process.env.TEST_NUMBER = '123';
    process.env.TEST_FLOAT = '123.45';
    const provider = new EnvConfigProvider();
    
    expect(provider.get('TEST_NUMBER')).toBe(123);
    expect(provider.get('TEST_FLOAT')).toBe(123.45);
    
    delete process.env.TEST_NUMBER;
    delete process.env.TEST_FLOAT;
  });
});

