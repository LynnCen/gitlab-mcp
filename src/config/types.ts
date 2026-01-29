/**
 * 配置类型定义
 */

/**
 * GitLab 配置
 */
export interface GitLabConfig {
  host: string;
  token: string;
  timeout?: number;
  retries?: number;
}

/**
 * 服务器配置
 */
export interface ServerConfig {
  port?: number;
  host?: string;
  logLevel?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logOutput?: 'console' | 'file' | 'both';
}

/**
 * 中间件配置
 */
export interface MiddlewareConfig {
  auth?: {
    enabled: boolean;
    mode?: 'api-key' | 'jwt' | 'oauth';
    apiKey?: string;
  };
  rateLimit?: {
    enabled: boolean;
    globalRequests?: number;
    globalWindow?: string;
  };
  cache?: {
    enabled: boolean;
    type?: 'memory' | 'redis';
    ttl?: number;
  };
}

/**
 * 插件配置
 */
export interface PluginsConfig {
  enabled?: string[];
  [pluginName: string]: any;
}

/**
 * 完整服务器配置
 */
export interface AppConfig {
  gitlab: GitLabConfig;
  server: ServerConfig;
  middleware: MiddlewareConfig;
  plugins: PluginsConfig;
}

