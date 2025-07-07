import { Gitlab } from '@gitbeaker/node';
import { GitLabConfig } from '../config/ConfigManager.js';

/**
 * GitLab 客户端类
 * 封装对 GitLab API 的所有调用
 */
export class GitLabClient {
  private gitlab: any;
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
      requestTimeout: config.timeout || 30000,
    });
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.gitlab.Users.current();
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取项目信息
   */
  async getProject(projectPath: string): Promise<any> {
    return await this.gitlab.Projects.show(projectPath);
  }

  /**
   * 获取 MR 信息
   */
  async getMergeRequest(projectId: string | number, mrIid: number): Promise<any> {
    return await this.gitlab.MergeRequests.show(projectId, mrIid);
  }

  /**
   * 获取 MR 变更
   */
  async getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<any> {
    return await this.gitlab.MergeRequests.changes(projectId, mrIid);
  }

  /**
   * 获取文件内容
   */
  async getFileContent(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ): Promise<any> {
    return await this.gitlab.RepositoryFiles.show(projectId, filePath, ref);
  }

  /**
   * 获取项目分支列表
   */
  async getBranches(projectId: string | number, options: { search?: string; per_page?: number } = {}): Promise<any[]> {
    return await this.gitlab.Branches.all(projectId, options);
  }

  /**
   * 获取项目 MR 列表
   */
  async getMergeRequests(
    projectId: string | number,
    options: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<any[]> {
    return await this.gitlab.MergeRequests.all({
      projectId,
      ...options,
    });
  }

  /**
   * 搜索项目
   */
  async searchProjects(search: string, options: { per_page?: number } = {}): Promise<any[]> {
    return await this.gitlab.Projects.search(search, options);
  }

  /**
   * 重试机制包装器
   */
  async withRetry<T>(operation: () => Promise<T>, retries: number = this.config.retries || 3): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= retries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (i === retries) {
          throw lastError;
        }

        // 等待时间递增：1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * 获取配置信息
   */
  getConfig(): GitLabConfig {
    return { ...this.config };
  }
} 