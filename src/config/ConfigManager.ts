/**
 * 配置管理器
 */

import { z } from 'zod';
import type { IConfigProvider } from './ConfigProvider.js';
import { EnvConfigProvider } from './EnvConfigProvider.js';
import type { AppConfig, GitLabConfig, ServerConfig, MiddlewareConfig, PluginsConfig } from './types.js';

/**
 * GitLab 配置 Schema
 */
const GitLabConfigSchema = z.object({
  host: z.string().url(),
  token: z.string().min(1),
  timeout: z.number().positive().optional(),
  retries: z.number().int().min(0).max(10).optional(),
});

/**
 * 服务器配置 Schema
 */
const ServerConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).optional(),
  host: z.string().optional(),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional(),
  logOutput: z.enum(['console', 'file', 'both']).optional(),
});

/**
 * 中间件配置 Schema
 */
const MiddlewareConfigSchema = z.object({
  auth: z
    .object({
      enabled: z.boolean().optional(),
      mode: z.enum(['api-key', 'jwt', 'oauth']).optional(),
      apiKey: z.string().optional(),
    })
    .optional(),
  rateLimit: z
    .object({
      enabled: z.boolean().optional(),
      globalRequests: z.number().int().positive().optional(),
      globalWindow: z.string().optional(),
    })
    .optional(),
  cache: z
    .object({
      enabled: z.boolean().optional(),
      type: z.enum(['memory', 'redis']).optional(),
      ttl: z.number().int().positive().optional(),
    })
    .optional(),
});

/**
 * 插件配置 Schema
 */
const PluginsConfigSchema = z.record(z.unknown());

/**
 * 完整配置 Schema
 */
const AppConfigSchema = z.object({
  gitlab: GitLabConfigSchema,
  server: ServerConfigSchema.optional(),
  middleware: MiddlewareConfigSchema.optional(),
  plugins: PluginsConfigSchema.optional(),
});

/** 
 * Zod 推断的配置类型 
 */
type ZodAppConfig = z.infer<typeof AppConfigSchema>;

/**
 * 配置管理器
 */
export class ConfigManager {
  private config: AppConfig;
  private provider: IConfigProvider;

  constructor(provider?: IConfigProvider, envFile?: string) {
    this.provider = provider || new EnvConfigProvider(envFile);
    this.config = this.load();
  }

  /**
   * 加载配置
   */
  private load(): AppConfig {
    const rawConfig = {
      gitlab: {
        host: this.provider.get<string>('GITLAB_HOST', ''),
        token: this.provider.get<string>('GITLAB_TOKEN', ''),
        timeout: this.provider.get<number>('GITLAB_TIMEOUT', 30000),
        retries: this.provider.get<number>('GITLAB_RETRIES', 3),
      },
      server: {
        port: this.provider.get<number>('SERVER_PORT', 3000),
        host: this.provider.get<string>('SERVER_HOST', '0.0.0.0'),
        logLevel: this.provider.get<string>('LOG_LEVEL', 'info') as ServerConfig['logLevel'],
        logOutput: this.provider.get<string>('LOG_OUTPUT', 'console') as ServerConfig['logOutput'],
      },
      middleware: {
        auth: {
          enabled: this.provider.get<boolean>('AUTH_ENABLED', false),
          mode: this.provider.get<string>('AUTH_MODE', 'api-key') as 'api-key' | 'jwt' | 'oauth',
          apiKey: this.provider.get<string | undefined>('API_KEY', undefined),
        },
        rateLimit: {
          enabled: this.provider.get<boolean>('RATE_LIMIT_ENABLED', true),
          globalRequests: this.provider.get<number>('RATE_LIMIT_GLOBAL_REQUESTS', 100),
          globalWindow: this.provider.get<string>('RATE_LIMIT_GLOBAL_WINDOW', '1s'),
        },
        cache: {
          enabled: this.provider.get<boolean>('CACHE_ENABLED', true),
          type: this.provider.get<string>('CACHE_TYPE', 'memory') as 'memory' | 'redis',
          ttl: this.provider.get<number>('CACHE_TTL', 300),
        },
      },
      plugins: {
        enabled: this.provider.get<string>('PLUGINS_ENABLED', '').split(',').filter(Boolean),
      },
    };

    // 验证配置
    const result = AppConfigSchema.safeParse(rawConfig);
    if (!result.success) {
      throw new Error(`Configuration validation failed: ${result.error.message}`);
    }

    // 转换为 AppConfig 类型
    const validatedConfig = result.data as ZodAppConfig;
    return {
      gitlab: validatedConfig.gitlab,
      server: validatedConfig.server || {},
      middleware: validatedConfig.middleware || {},
      plugins: validatedConfig.plugins || {},
    } as AppConfig;
  }

  /**
   * 获取完整配置
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 获取 GitLab 配置
   */
  getGitLabConfig(): GitLabConfig {
    return { ...this.config.gitlab };
  }

  /**
   * 获取服务器配置
   */
  getServerConfig(): ServerConfig {
    return { ...(this.config.server || {}) };
  }

  /**
   * 获取中间件配置
   */
  getMiddlewareConfig(): MiddlewareConfig {
    return { ...(this.config.middleware || {}) };
  }

  /**
   * 获取插件配置
   */
  getPluginsConfig(): PluginsConfig {
    return { ...(this.config.plugins || {}) };
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    await this.provider.reload();
    this.config = this.load();
  }
}

