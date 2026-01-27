/**
 * Config Repository
 * 
 * 提供统一的配置访问接口，封装配置提供者
 */

import type { ConfigManager } from '../config/ConfigManager.js';
import type { AppConfig } from '../config/types.js';

/**
 * Config Repository 接口
 */
export interface IConfigRepository {
  /**
   * 获取完整配置
   */
  getConfig(): AppConfig;

  /**
   * 获取 GitLab 配置
   */
  getGitLabConfig(): AppConfig['gitlab'];

  /**
   * 获取服务器配置
   */
  getServerConfig(): AppConfig['server'];

  /**
   * 获取中间件配置
   */
  getMiddlewareConfig(): AppConfig['middleware'];

  /**
   * 获取插件配置
   */
  getPluginsConfig(): AppConfig['plugins'];

  /**
   * 重新加载配置
   */
  reload(): Promise<void>;
}

/**
 * Config Repository 实现
 */
export class ConfigRepository implements IConfigRepository {
  constructor(private configManager: ConfigManager) {}

  getConfig(): AppConfig {
    return this.configManager.getConfig();
  }

  getGitLabConfig(): AppConfig['gitlab'] {
    return this.configManager.getGitLabConfig();
  }

  getServerConfig(): AppConfig['server'] {
    return this.configManager.getServerConfig();
  }

  getMiddlewareConfig(): AppConfig['middleware'] {
    return this.configManager.getMiddlewareConfig();
  }

  getPluginsConfig(): AppConfig['plugins'] {
    return this.configManager.getPluginsConfig();
  }

  async reload(): Promise<void> {
    await this.configManager.reload();
  }
}

