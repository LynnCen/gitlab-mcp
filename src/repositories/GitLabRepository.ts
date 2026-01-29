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
  GitLabUser,
} from './types.js';

/**
 * GitLab Repository 接口
 */
export interface IGitLabRepository {
  /**
   * 测试连接
   */
  testConnection(): Promise<{ success: boolean; user?: GitLabUser; error?: string }>;

  /**
   * 获取当前用户信息
   */
  getCurrentUser(): Promise<GitLabUser>;

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
 * API 错误类型
 */
interface ApiError extends Error {
  response?: {
    status?: number;
    data?: { message?: string };
  };
  statusCode?: number;
  status?: number;
  config?: { url?: string };
  request?: { path?: string };
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
          throw this.convertError(error as ApiError, 'operation');
        }

        // 最后一次尝试失败，抛出错误
        if (attempt === retries) {
          break;
        }

        // 指数退避
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        this.logger?.warn(
          `GitLab API call failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1})`,
          { error: lastError.message }
        );

        await this.sleep(delay);
      }
    }

    throw this.convertError(lastError as ApiError, 'operation');
  }

  /**
   * 判断是否为客户端错误（4xx）
   */
  private isClientError(error: unknown): boolean {
    const apiError = error as ApiError;
    const statusCode = apiError?.response?.status || apiError?.statusCode || apiError?.status;
    return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500;
  }

  /**
   * 转换错误为 GitLabApiError
   */
  private convertError(error: ApiError | null, operation: string): GitLabApiError {
    const statusCode = error?.response?.status || error?.statusCode || error?.status;
    const message = error?.response?.data?.message || error?.message || String(error);
    const apiEndpoint = error?.config?.url || error?.request?.path || operation;

    // 根据状态码确定错误码
    let errorCode: string = ErrorCodes.GITLAB_API_ERROR;
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
  async testConnection(): Promise<{ success: boolean; user?: GitLabUser; error?: string }> {
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
  async getCurrentUser(): Promise<GitLabUser> {
    const response = await this.withRetry(async () => {
      return await this.gitlab.requester.get('user');
    });
    return response as unknown as GitLabUser;
  }

  /**
   * 获取项目信息
   */
  async getProject(projectId: string | number): Promise<GitLabProject> {
    const result = await this.withRetry(() => this.gitlab.Projects.show(projectId));
    return result as unknown as GitLabProject;
  }

  /**
   * 获取合并请求信息
   */
  async getMergeRequest(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMergeRequest> {
    const result = await this.withRetry(() => 
      this.gitlab.MergeRequests.show(projectId, mrIid)
    );
    return result as unknown as GitLabMergeRequest;
  }

  /**
   * 获取合并请求变更
   */
  async getMergeRequestChanges(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMergeRequestChanges> {
    const result = await this.withRetry(() =>
      this.gitlab.MergeRequests.showChanges(projectId, mrIid, {
        accessRawDiffs: true,
      })
    );
    return result as unknown as GitLabMergeRequestChanges;
  }

  /**
   * 获取合并请求版本列表
   */
  async getMergeRequestVersions(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabMRVersion[]> {
    const result = await this.withRetry(() =>
      this.gitlab.MergeRequests.allDiffs(projectId, mrIid)
    );
    return result as unknown as GitLabMRVersion[];
  }

  /**
   * 获取合并请求提交列表
   */
  async getMergeRequestCommits(
    projectId: string | number,
    mrIid: number
  ): Promise<GitLabCommit[]> {
    const result = await this.withRetry(() =>
      this.gitlab.MergeRequests.allCommits(projectId, mrIid)
    );
    return result as unknown as GitLabCommit[];
  }

  /**
   * 更新合并请求描述
   */
  async updateMergeRequestDescription(
    projectId: string | number,
    mrIid: number,
    description: string
  ): Promise<GitLabMergeRequest> {
    const result = await this.withRetry(() =>
      this.gitlab.MergeRequests.edit(projectId, mrIid, {
        description,
      })
    );
    return result as unknown as GitLabMergeRequest;
  }

  /**
   * 获取文件内容
   */
  async getFile(
    projectId: string | number,
    filePath: string,
    ref: string = 'main'
  ): Promise<GitLabFile> {
    const result = await this.withRetry(() =>
      this.gitlab.RepositoryFiles.show(projectId, filePath, ref)
    );
    return result as unknown as GitLabFile;
  }

  /**
   * 创建评论（Note）
   */
  async createNote(
    projectId: string | number,
    mrIid: number,
    body: string
  ): Promise<GitLabNote> {
    const result = await this.withRetry(() =>
      this.gitlab.MergeRequestNotes.create(projectId, mrIid, body)
    );
    return result as unknown as GitLabNote;
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
    const result = await this.withRetry(() => {
      if (position) {
        // 使用 Gitbeaker 的格式，需要 camelCase
        // 类型系统不完全匹配，使用 unknown 转换
        const positionOptions = {
          position: {
            baseSha: position.base_sha,
            startSha: position.start_sha,
            headSha: position.head_sha,
            oldPath: position.old_path,
            newPath: position.new_path,
            positionType: position.position_type,
            newLine: position.new_line,
            oldLine: position.old_line,
          },
        } as unknown;
        return this.gitlab.MergeRequestDiscussions.create(
          projectId, 
          mrIid, 
          body, 
          positionOptions as Parameters<typeof this.gitlab.MergeRequestDiscussions.create>[3]
        );
      }
      return this.gitlab.MergeRequestDiscussions.create(projectId, mrIid, body);
    });
    return result as unknown as GitLabDiscussion;
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
    // 使用 Gitbeaker 的 MergeRequests.all 方法
    const result = await this.withRetry(async () => {
      // 处理 state 参数：'all' 时不传 state，让 API 返回所有状态
      const stateParam = options?.state === 'all' ? undefined : options?.state;
      
      return await this.gitlab.MergeRequests.all({
        projectId,
        state: stateParam as 'opened' | 'closed' | 'merged' | 'locked' | undefined,
        orderBy: options?.order_by,
        sort: options?.sort,
        perPage: options?.per_page,
        page: options?.page,
      });
    });

    // 确保返回数组格式
    if (Array.isArray(result)) {
      return result as unknown as GitLabMergeRequest[];
    }

    // 如果结果被包装在对象中，尝试提取数组
    const anyResult = result as unknown as Record<string, unknown>;
    if (anyResult && typeof anyResult === 'object') {
      if (Array.isArray(anyResult.data)) {
        return anyResult.data as unknown as GitLabMergeRequest[];
      }
      if (Array.isArray(anyResult.items)) {
        return anyResult.items as unknown as GitLabMergeRequest[];
      }
    }

    // 返回空数组作为兜底
    this.logger?.warn('Unexpected response format from listMergeRequests', { result });
    return [];
  }
}

