/**
 * MergeRequestService
 * 
 * 合并请求相关的业务逻辑服务
 */

import type { IGitLabRepository } from '../repositories/GitLabRepository.js';
import type { ICacheRepository } from '../repositories/CacheRepository.js';
import type { ILogger } from '../logging/types.js';
import { BusinessError } from '../errors/BusinessError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type {
  GitLabMergeRequest,
  GitLabMergeRequestChanges,
} from '../repositories/types.js';
import type {
  MergeRequestChangesOptions,
  MergeRequestChangesResult,
} from './types.js';

/**
 * MergeRequestService 接口
 */
export interface IMergeRequestService {
  /**
   * 获取合并请求详情（带缓存）
   */
  getMergeRequest(
    projectPath: string,
    mrIid: number
  ): Promise<GitLabMergeRequest>;

  /**
   * 获取合并请求变更（带缓存和过滤）
   */
  getMergeRequestChanges(
    projectPath: string,
    mrIid: number,
    options?: MergeRequestChangesOptions
  ): Promise<MergeRequestChangesResult>;

  /**
   * 更新合并请求描述
   */
  updateMergeRequestDescription(
    projectPath: string,
    mrIid: number,
    description: string
  ): Promise<GitLabMergeRequest>;

  /**
   * 列出合并请求
   */
  listMergeRequests(
    projectPath: string,
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
 * MergeRequestService 实现
 */
export class MergeRequestService implements IMergeRequestService {
  constructor(
    private gitlabRepo: IGitLabRepository,
    private cacheRepo: ICacheRepository,
    private logger?: ILogger
  ) {}

  /**
   * 获取项目 ID（从项目路径）
   */
  private async getProjectId(projectPath: string): Promise<string | number> {
    const cacheKey = `project:${projectPath}`;
    const cached = await this.cacheRepo.get<string | number>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const project = await this.gitlabRepo.getProject(projectPath);
      const projectId = project.id;

      // 缓存项目 ID（30 分钟）
      await this.cacheRepo.set(cacheKey, projectId, 1800);

      return projectId;
    } catch (error) {
      this.logger?.error('Failed to get project', { projectPath, error });
      throw new BusinessError(
        ErrorCodes.NOT_FOUND_PROJECT,
        `项目 '${projectPath}' 不存在或无权访问`,
        { projectPath }
      );
    }
  }

  /**
   * 获取合并请求详情（带缓存）
   */
  async getMergeRequest(
    projectPath: string,
    mrIid: number
  ): Promise<GitLabMergeRequest> {
    const projectId = await this.getProjectId(projectPath);
    const cacheKey = `mr:${projectId}:${mrIid}`;

    // 检查缓存（5 分钟）
    const cached = await this.cacheRepo.get<GitLabMergeRequest>(cacheKey);
    if (cached) {
      this.logger?.debug('MR cache hit', { projectPath, mrIid });
      return cached;
    }

    try {
      const mr = await this.gitlabRepo.getMergeRequest(projectId, mrIid);

      // 缓存结果（5 分钟）
      await this.cacheRepo.set(cacheKey, mr, 300);

      return mr;
    } catch (error) {
      this.logger?.error('Failed to get merge request', {
        projectPath,
        mrIid,
        error,
      });

      if (error instanceof BusinessError) {
        throw error;
      }

      throw new BusinessError(
        ErrorCodes.NOT_FOUND_MERGE_REQUEST,
        `合并请求 #${mrIid} 不存在或无权访问`,
        { projectPath, mrIid }
      );
    }
  }

  /**
   * 获取合并请求变更（带缓存和过滤）
   */
  async getMergeRequestChanges(
    projectPath: string,
    mrIid: number,
    options: MergeRequestChangesOptions = {}
  ): Promise<MergeRequestChangesResult> {
    const projectId = await this.getProjectId(projectPath);
    const cacheKey = `mr:${projectId}:${mrIid}:changes`;

    // 检查缓存（5 分钟）
    const cached = await this.cacheRepo.get<MergeRequestChangesResult>(cacheKey);
    if (cached && !options.focusFiles) {
      this.logger?.debug('MR changes cache hit', { projectPath, mrIid });
      return cached;
    }

    try {
      const changes = await this.gitlabRepo.getMergeRequestChanges(
        projectId,
        mrIid
      );

      // 过滤文件（如果指定了 focusFiles）
      let filteredChanges = changes.changes;
      if (options.focusFiles && options.focusFiles.length > 0) {
        const focusSet = new Set(options.focusFiles);
        filteredChanges = changes.changes.filter(
          (change) =>
            focusSet.has(change.new_path) || focusSet.has(change.old_path)
        );
      }

      // 计算摘要
      const summary = this.calculateChangesSummary(filteredChanges);

      const result: MergeRequestChangesResult = {
        changes: filteredChanges,
        summary,
      };

      // 缓存结果（5 分钟）
      if (!options.focusFiles) {
        await this.cacheRepo.set(cacheKey, result, 300);
      }

      return result;
    } catch (error) {
      this.logger?.error('Failed to get merge request changes', {
        projectPath,
        mrIid,
        error,
      });
      throw error;
    }
  }

  /**
   * 计算变更摘要
   */
  private calculateChangesSummary(changes: GitLabMergeRequestChanges['changes']): MergeRequestChangesResult['summary'] {
    let additions = 0;
    let deletions = 0;
    const modifiedFiles: string[] = [];
    const newFiles: string[] = [];
    const deletedFiles: string[] = [];

    for (const change of changes) {
      // 计算增删行数（简化处理，实际应该解析 diff）
      const diffLines = change.diff.split('\n');
      for (const line of diffLines) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          additions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          deletions++;
        }
      }

      // 分类文件
      if (change.new_file) {
        newFiles.push(change.new_path);
      } else if (change.deleted_file) {
        deletedFiles.push(change.old_path);
      } else {
        modifiedFiles.push(change.new_path);
      }
    }

    return {
      totalFiles: changes.length,
      additions,
      deletions,
      modifiedFiles,
      newFiles,
      deletedFiles,
    };
  }

  /**
   * 更新合并请求描述
   */
  async updateMergeRequestDescription(
    projectPath: string,
    mrIid: number,
    description: string
  ): Promise<GitLabMergeRequest> {
    const projectId = await this.getProjectId(projectPath);

    try {
      const mr = await this.gitlabRepo.updateMergeRequestDescription(
        projectId,
        mrIid,
        description
      );

      // 清除相关缓存
      await this.cacheRepo.delete(`mr:${projectId}:${mrIid}`);
      await this.cacheRepo.delete(`mr:${projectId}:${mrIid}:changes`);

      return mr;
    } catch (error) {
      this.logger?.error('Failed to update merge request description', {
        projectPath,
        mrIid,
        error,
      });
      throw error;
    }
  }

  /**
   * 列出合并请求
   */
  async listMergeRequests(
    projectPath: string,
    options?: {
      state?: 'opened' | 'closed' | 'merged' | 'all';
      order_by?: 'created_at' | 'updated_at';
      sort?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    }
  ): Promise<GitLabMergeRequest[]> {
    const projectId = await this.getProjectId(projectPath);

    try {
      return await this.gitlabRepo.listMergeRequests(projectId, options);
    } catch (error) {
      this.logger?.error('Failed to list merge requests', {
        projectPath,
        options,
        error,
      });
      throw error;
    }
  }
}

