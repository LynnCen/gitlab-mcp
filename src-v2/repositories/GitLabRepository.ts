// @ts-nocheck
/**
 * GitLab Repository
 * 
 * 封装所有 GitLab API 调用，提供统一的数据访问接口
 * 不包含业务逻辑，只负责 API 调用和错误处理
 */

import { Gitlab } from '@gitbeaker/rest';
import type { GitLabConfig } from '../config/types.js';
import { GitLabApiError } from '../errors/GitLabApiError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type { ILogger } from '../logging/types.js';
import type {
  GitLabProject,
  GitLabMergeRequest,
  GitLabMergeRequestChanges,
  GitLabFile,
  GitLabNote,
  GitLabDiscussion,
  GitLabCommit,
  GitLabMRVersion,
  GitLabPosition,
} from './types.js';

/**
 * GitLab Repository 接口
 */
export interface IGitLabRepository {
  /**
   * 测试连接
   */
  testConnection(): Promise<{ success: boolean; user?: any; error?: string }>;

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<any>;

  /**
   * 获取项目信息
   */
  getProject(projectId: string | number): Promise<GitLabProject>;

  /**
   * 获取合并请求信息
   */
  getMergeRequest(projectId: string | number, mrIid: number): Promise<GitLabMergeRequest>;

  /**
   * 获取合并请求变更
   */
  getMergeRequestChanges(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMergeRequestChanges>;

  /**
   * 获取合并请求版本列表
   */
  getMergeRequestVersions(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMRVersion[]>;

  /**
   * 获取合并请求提交列表
   */
  getMergeRequestCommits(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabCommit[]>;

  /**
   * 更新合并请求描述
   */
  updateMergeRequestDescription(
    projectId: string | number,
    mrIid: number,
    description: string
  ): Promise<GitLabMergeRequest>;

  /**
   * 获取文件内容
   */
  getFile(
    projectId: string | number,
    filePath: string,
    ref: string
  ): Promise<GitLabFile>;

  /**
   * 创建评论（Note）
   */
  createNote(
    projectId: string | number,
    mrIid: number,
    body: string
  ): Promise<GitLabNote>;

  /**
   * 创建讨论（Discussion），支持行内评论
   */
  createDiscussion(
    projectId: string | number,
    mrIid: number,
    body: string,
    position?: GitLabPosition
  ): Promise<GitLabDiscussion>;

  /**
   * 列出合并请求
   */
  listMergeRequests(
    projectId: string | number,
    options?: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      order_by?: 'created_at' | 'updated_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    }
  ): Promise<GitLabMergeRequest[]>;
}

/**
 * GitLab Repository 实现
 */
export class GitLabRepository implements IGitLabRepository {
  private gitlab: InstanceType<typeof Gitlab>;
  private config: GitLabConfig;
  private logger?: ILogger;

  constructor(config: GitLabConfig, logger?: ILogger) {
    this.config = config;
    this.logger = logger;
    this.gitlab = new Gitlab({
      host: config.host,
      token: config.token,
      requestTimeout: config.timeout || 30000,
    });
  }

  /**
   * 统一的重试机制
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.config.retries || 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 如果是 4xx 错误，不重试
        if (this.isClientError(error)) {
          throw this.convertError(error, operation.name);
        }

        // 最后一次尝试失败，抛出错误
        if (attempt === retries) {
          break;
        }

        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        this.logger?.warn(
          `GitLab API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          { error: lastError.message, operation: operation.name }
        );

        await this.sleep(delay);
      }
    }

    throw this.convertError(lastError!, operation.name);
  }

  /**
   * 判断是否为客户端错误（4xx）
   */
  private isClientError(error: any): boolean {
    const statusCode = error?.response?.status || error?.statusCode || error?.status;
    return statusCode >= 400 && statusCode < 500;
  }

  /**
   * 转换错误为 GitLabApiError
   */
  private convertError(error: any, operation: string): GitLabApiError {
    const statusCode = error?.response?.status || error?.statusCode || error?.status;
    const message = error?.response?.data?.message || error?.message || String(error);
    const apiEndpoint = error?.config?.url || error?.request?.path || operation;

    // 根据状态码确定错误码
    let errorCode = ErrorCodes.GITLAB_API_ERROR;
    if (statusCode === 401) {
      errorCode = ErrorCodes.GITLAB_AUTH_FAILED;
    } else if (statusCode === 403) {
      errorCode = ErrorCodes.GITLAB_AUTH_FAILED;
    } else if (statusCode === 404) {
      errorCode = ErrorCodes.NOT_FOUND_PROJECT;
    }

    return new GitLabApiError(errorCode, message, {
      statusCode,
      apiEndpoint,
      details: {
        originalError: error?.response?.data || error,
      },
    });
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 测试连接
   */
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
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<any> {
    return await this.withRetry(async () => {
      const response = await this.gitlab.requester.get('user');
      return response;
    });
  }

  /**
   * 获取项目信息
   */
  async getProject(projectId: string | number): Promise<GitLabProject> {
    const result: any = await this.withRetry(() => this.gitlab.Projects.show(projectId));
    return result;
  }

  /**
   * 获取合并请求信息
   */
  async getMergeRequest(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMergeRequest> {
    return await this.withRetry(() => this.gitlab.MergeRequests.show(projectId, mrIid));
  }

  /**
   * 获取合并请求变更
   */
  async getMergeRequestChanges(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMergeRequestChanges> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequests.showChanges(projectId, mrIid, {
        accessRawDiffs: true,
      })
    );
  }

  /**
   * 获取合并请求版本列表
   */
  async getMergeRequestVersions(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMRVersion[]> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequestVersions.all(projectId, mrIid)
    );
  }

  /**
   * 获取合并请求提交列表
   */
  async getMergeRequestCommits(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabCommit[]> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequests.commits(projectId, mrIid)
    );
  }

  /**
   * 更新合并请求描述
   */
  async updateMergeRequestDescription(
    projectId: string | number,
    mrIid: number,
    description: string
  ): Promise<GitLabMergeRequest> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequests.edit(projectId, mrIid, {
        description,
      })
    );
  }

  /**
   * 获取文件内容
   */
  async getFile(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ): Promise<GitLabFile> {
    return await this.withRetry(() =>
      this.gitlab.RepositoryFiles.show(projectId, filePath, ref)
    );
  }

  /**
   * 创建评论（Note）
   */
  async createNote(
    projectId: string | number,
    mrIid: number,
    body: string
  ): Promise<GitLabNote> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequestNotes.create(projectId, mrIid, body)
    );
  }

  /**
   * 创建讨论（Discussion），支持行内评论
   */
  async createDiscussion(
    projectId: string | number,
    mrIid: number,
    body: string,
    position?: GitLabPosition
  ): Promise<GitLabDiscussion> {
    return await this.withRetry(() =>
      this.gitlab.MergeRequestDiscussions.create(projectId, mrIid, body, {
        position,
      })
    );
  }

  /**
   * 列出合并请求
   */
  async listMergeRequests(
    projectId: string | number,
    options?: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      order_by?: 'created_at' | 'updated_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    }
  ): Promise<GitLabMergeRequest[]> {
    const result: any = await this.withRetry(() =>
      this.gitlab.MergeRequests.all({
        projectId: String(projectId),
        ...options,
      } as any)
    );
    return result;
  }
}

