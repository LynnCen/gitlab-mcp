/**
 * 配置管理器 - 单例模式
 * 负责管理所有应用配置，包括环境变量读取和验证
 */

import type { AICodeReviewConfig } from './types.js';

export interface GitLabConfig {
  host: string;
  token: string;
  timeout?: number;
  retries?: number;
}

export interface ServerConfig {
  port: number;
  host: string;
  corsOrigins?: string[];
}

export interface AppConfig {
  gitlab: GitLabConfig;
  server: ServerConfig;
  aiCodeReview: AICodeReviewConfig;
  debug: boolean;
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * 获取完整配置
   */
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 获取 GitLab 配置
   */
  public getGitLabConfig(): GitLabConfig {
    return { ...this.config.gitlab };
  }

  /**
   * 获取服务器配置
   */
  public getServerConfig(): ServerConfig {
    return { ...this.config.server };
  }

  /**
   * 获取AI代码审查配置
   */
  public getAICodeReviewConfig(): AICodeReviewConfig {
    return { ...this.config.aiCodeReview };
  }

  /**
   * 是否为调试模式
   */
  public isDebug(): boolean {
    return this.config.debug;
  }

  /**
   * 加载配置
   */
  private loadConfig(): AppConfig {
    // 读取环境变量
    const gitlabHost = process.env['GITLAB_HOST'] || 'https://gitlab.com';
    const gitlabToken = process.env['GITLAB_TOKEN'] || '';
    const serverPort = parseInt(process.env['PORT'] || '3000');
    const serverHost = process.env['HOST'] || 'localhost';
    const debug = process.env['DEBUG'] === 'true' || process.env['NODE_ENV'] === 'development';
    const corsOrigins = process.env['CORS_ORIGINS']?.split(',') || ['*'];

    // AI代码审查配置
    const aiCodeReviewEnabled = process.env['AI_CODE_REVIEW_ENABLED'] === 'true';
    const aiProvider = (process.env['AI_PROVIDER'] || 'local') as 'openai' | 'claude' | 'gemini' | 'local';
    const aiApiKey = process.env['AI_API_KEY'] || '';
    const aiModel = process.env['AI_MODEL'] || 'gpt-3.5-turbo';
    const aiTemperature = parseFloat(process.env['AI_TEMPERATURE'] || '0.1');
    const aiMaxTokens = parseInt(process.env['AI_MAX_TOKENS'] || '4000');
    const aiAutoComment = process.env['AI_AUTO_COMMENT'] === 'true';
    const aiReviewDepth = (process.env['AI_REVIEW_DEPTH'] || 'standard') as 'quick' | 'standard' | 'thorough';

    return {
      gitlab: {
        host: gitlabHost,
        token: gitlabToken,
        timeout: 30000, // 30秒超时
        retries: 3, // 重试3次
      },
      server: {
        port: serverPort,
        host: serverHost,
        corsOrigins,
      },
      aiCodeReview: {
        enabled: aiCodeReviewEnabled,
        llmProvider: aiProvider,
        apiKey: aiApiKey,
        model: aiModel,
        temperature: aiTemperature,
        maxTokens: aiMaxTokens,
        autoComment: aiAutoComment,
        reviewDepth: aiReviewDepth,
      },
      debug,
    };
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // 验证 GitLab 配置
    if (!this.config.gitlab.token) {
      errors.push('GITLAB_TOKEN 环境变量是必需的');
    }

    if (!this.config.gitlab.host) {
      errors.push('GITLAB_HOST 环境变量是必需的');
    }

    // 验证 GitLab Host 格式
    try {
      new URL(this.config.gitlab.host);
    } catch {
      errors.push('GITLAB_HOST 必须是有效的 URL');
    }

    // 验证服务器端口
    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push('PORT 必须在 1-65535 范围内');
    }

    if (errors.length > 0) {
      throw new Error(`配置验证失败:\n${errors.join('\n')}`);
    }
  }

  /**
   * 重新加载配置（用于测试）
   */
  public reload(): void {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * 获取配置摘要（隐藏敏感信息）
   */
  public getConfigSummary(): object {
    return {
      gitlab: {
        host: this.config.gitlab.host,
        token: this.config.gitlab.token ? `${this.config.gitlab.token.substring(0, 8)}...` : '未设置',
        timeout: this.config.gitlab.timeout,
        retries: this.config.gitlab.retries,
      },
      server: {
        port: this.config.server.port,
        host: this.config.server.host,
        corsOrigins: this.config.server.corsOrigins,
      },
      debug: this.config.debug,
    };
  }
} 