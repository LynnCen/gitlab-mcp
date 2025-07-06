import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { Config, ConfigSchema, ConfigError } from '../types/index.js';

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 加载配置
   */
  private loadConfig(): Config {
    const config = {
      gitlab: {
        host: process.env['GITLAB_HOST'] || 'https://gitlab.com',
        token: process.env['GITLAB_TOKEN'] || '',
      },
      server: {
        name: process.env['MCP_SERVER_NAME'] || 'gitlab-mcp-server',
        version: process.env['MCP_SERVER_VERSION'] || '1.0.0',
        logLevel: (process.env['LOG_LEVEL'] as 'debug' | 'info' | 'warn' | 'error') || 'info',
      },
      plugins: this.loadPluginConfig(),
      cache: {
        enabled: process.env['ENABLE_CACHE'] === 'true',
        ttl: parseInt(process.env['CACHE_TTL'] || '300'),
      },
    };

    // 从配置文件加载
    const configFromFile = this.loadConfigFromFile();
    if (configFromFile) {
      Object.assign(config, configFromFile);
    }

    try {
      return ConfigSchema.parse(config);
    } catch (error) {
      throw new ConfigError(`配置验证失败: ${error}`);
    }
  }

  /**
   * 从文件加载配置
   */
  private loadConfigFromFile(): Partial<Config> | null {
    const configPaths = [
      join(process.cwd(), 'config.json'),
      join(homedir(), '.gitlab-mcp-config.json'),
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          const configContent = readFileSync(configPath, 'utf8');
          return JSON.parse(configContent);
        } catch (error) {
          console.warn(`无法读取配置文件 ${configPath}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * 加载插件配置
   */
  private loadPluginConfig(): Record<string, boolean> {
    const pluginConfig: Record<string, boolean> = {};

    // 从环境变量加载插件配置
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('ENABLE_') && key.endsWith('_PLUGIN')) {
        const pluginName = key
          .replace('ENABLE_', '')
          .replace('_PLUGIN', '')
          .toLowerCase()
          .replace(/_/g, '-');
        pluginConfig[pluginName] = process.env[key] === 'true';
      }
    });

    return pluginConfig;
  }

  /**
   * 获取配置
   */
  getConfig(): Config {
    return this.config;
  }

  /**
   * 获取GitLab配置
   */
  getGitLabConfig(): Config['gitlab'] {
    return this.config.gitlab;
  }

  /**
   * 获取服务器配置
   */
  getServerConfig(): Config['server'] {
    return this.config.server;
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(): Config['plugins'] {
    return this.config.plugins;
  }

  /**
   * 获取缓存配置
   */
  getCacheConfig(): Config['cache'] {
    return this.config.cache;
  }

  /**
   * 检查插件是否启用
   */
  isPluginEnabled(pluginName: string): boolean {
    return this.config.plugins[pluginName] === true;
  }

  /**
   * 验证配置
   */
  validate(): void {
    if (!this.config.gitlab.token) {
      throw new ConfigError('GitLab token 未配置。请设置环境变量 GITLAB_TOKEN 或在配置文件中配置。');
    }
  }
} 