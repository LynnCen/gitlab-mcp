import { Gitlab } from '@gitbeaker/rest';
import { GitLabConfig} from '../config/types.js';

export class GitLabClient {
  private gitlab: InstanceType<typeof Gitlab>;
  private config: GitLabConfig;

  constructor(config: GitLabConfig) {
    this.config = config;
    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
    });
  }

  async testConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const user = await this.getCurrentUser();
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取当前认证用户的详细信息
   * 对应 GitLab API: GET /user
   */
  async getCurrentUser(): Promise<any> {
    return await this.withRetry(async () => {
      // 使用GitLab API的 /user 端点获取当前用户信息
      const response = await this.gitlab.requester.get('user');
      return response;
    });
  }

  async getProject(projectId: string | number) {
    return await this.withRetry(() => this.gitlab.Projects.show(projectId));
  }

  async getMergeRequest(projectId: string | number, mrIid: number) {
    return await this.withRetry(() => this.gitlab.MergeRequests.show(projectId, mrIid));
  }

  /**
   * 获取合并请求的变更信息
   * 对应 GitLab API: GET /projects/:id/merge_requests/:merge_request_iid/changes
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @returns 合并请求的变更信息
   */

  async getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<any> {
    try {
      const mr = await this.withRetry(() => 
        this.gitlab.MergeRequests.showChanges(projectId, mrIid,{
          accessRawDiffs: true
        })
      );
      return mr;


    } catch (error) {
      console.error(`Error getting merge request changes for project ${projectId}, MR ${mrIid}:`, error);
      throw new Error(`Failed to get merge request changes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新合并请求的描述信息
   * 对应 GitLab API: PUT /projects/:id/merge_requests/:merge_request_iid
   * @param projectId 项目ID或路径
   * @param mrIid 合并请求的内部ID
   * @param description 新的描述内容（支持Markdown格式）
   * @returns 更新后的合并请求信息
   */
  async updateMergeRequestDescription(
    projectId: string | number, 
    mrIid: number, 
    description: string
  ): Promise<any> {
    return await this.withRetry(() => 
      this.gitlab.MergeRequests.edit(projectId, mrIid, {
        description: description
      })
    );
  }

  async getFileContent(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ) {
    return await this.withRetry(() => this.gitlab.RepositoryFiles.show(projectId, filePath, ref));
  }

  async getMergeRequests(
    projectId: string | number,
    options: {
      state?: 'opened' | 'closed' | 'locked' | 'merged';
      per_page?: number;
      page?: number;
    } = {}
  ) {
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

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
} 