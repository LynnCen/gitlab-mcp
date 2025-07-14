import { Gitlab } from '@gitbeaker/rest';
import { GitLabConfig, GitLabUser, GitLabProject, GitLabMergeRequest, GitLabFile } from '../config/types.js';

export class GitLabClient {
  private gitlab: any;
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
      queryTimeout: config.timeout || 30000,
    });
  }

  async testConnection(): Promise<{ success: boolean; user?: GitLabUser; error?: string }> {
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

  async getProject(projectPath: string): Promise<GitLabProject> {
    return await this.withRetry(() => this.gitlab.Projects.show(projectPath));
  }

  async getMergeRequest(projectId: string | number, mrIid: number): Promise<GitLabMergeRequest> {
    return await this.withRetry(() => this.gitlab.MergeRequests.show(projectId, mrIid));
  }

  async getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<any> {
    return await this.withRetry(() => this.gitlab.MergeRequests.changes(projectId, mrIid));
  }

  async getFileContent(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ): Promise<GitLabFile> {
    return await this.withRetry(() => this.gitlab.RepositoryFiles.show(projectId, filePath, ref));
  }

  async getMergeRequests(
    projectId: string | number,
    options: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<GitLabMergeRequest[]> {
    return await this.withRetry(() => this.gitlab.MergeRequests.all({
      projectId,
      ...options,
    }));
  }

  private async withRetry<T>(operation: () => Promise<T>, retries: number = this.config.retries || 3): Promise<T> {
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
} 