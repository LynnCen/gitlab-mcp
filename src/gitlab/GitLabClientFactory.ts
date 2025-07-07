import { GitLabClient } from './GitLabClient.js';
import { GitLabConfig } from '../config/ConfigManager.js';

/**
 * GitLab 客户端工厂 - 工厂模式
 * 负责创建和管理 GitLab 客户端实例
 */
export class GitLabClientFactory {
  private static instance: GitLabClientFactory;
  private clients: Map<string, GitLabClient> = new Map();

  private constructor() {}

  /**
   * 获取工厂实例
   */
  public static getInstance(): GitLabClientFactory {
    if (!GitLabClientFactory.instance) {
      GitLabClientFactory.instance = new GitLabClientFactory();
    }
    return GitLabClientFactory.instance;
  }

  /**
   * 创建客户端
   */
  public createClient(config: GitLabConfig): GitLabClient {
    const clientKey = this.generateClientKey(config);
    
    // 检查是否已存在相同配置的客户端
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey)!;
    }

    // 创建新客户端
    const client = new GitLabClient(config);
    this.clients.set(clientKey, client);
    
    return client;
  }

  /**
   * 获取默认客户端
   */
  public getDefaultClient(config: GitLabConfig): GitLabClient {
    return this.createClient(config);
  }

  /**
   * 清理所有客户端
   */
  public clearClients(): void {
    this.clients.clear();
  }

  /**
   * 获取客户端数量
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * 生成客户端键
   */
  private generateClientKey(config: GitLabConfig): string {
    return `${config.host}:${config.token.substring(0, 8)}`;
  }

  /**
   * 测试所有客户端连接
   */
  public async testAllConnections(): Promise<Map<string, { success: boolean; error?: string }>> {
    const results = new Map<string, { success: boolean; error?: string }>();

    for (const [key, client] of this.clients) {
      try {
        const result = await client.testConnection();
        results.set(key, {
          success: result.success,
          ...(result.error && { error: result.error }),
        });
      } catch (error) {
        results.set(key, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
} 