/**
 * FileOperationService
 * 
 * 文件操作相关的业务逻辑服务
 */

import type { IGitLabRepository } from '../repositories/GitLabRepository.js';
import type { ICacheRepository } from '../repositories/CacheRepository.js';
import type { ILogger } from '../logging/types.js';
import { BusinessError } from '../errors/BusinessError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type { GitLabFile } from '../repositories/types.js';
import type { FileOperationOptions } from './types.js';
import { MergeRequestService } from './MergeRequestService.js';

/**
 * FileOperationService 接口
 */
export interface IFileOperationService {
  /**
   * 获取文件内容
   */
  getFileContent(
    projectPath: string,
    filePath: string,
    options?: FileOperationOptions
  ): Promise<GitLabFile>;

  /**
   * 从合并请求获取文件内容
   */
  getFileFromMergeRequest(
    projectPath: string,
    mrIid: number,
    filePath: string
  ): Promise<GitLabFile>;
}

/**
 * FileOperationService 实现
 */
export class FileOperationService implements IFileOperationService {
  constructor(
    private gitlabRepo: IGitLabRepository,
    private cacheRepo: ICacheRepository,
    private mrService: MergeRequestService,
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
   * 获取文件内容
   */
  async getFileContent(
    projectPath: string,
    filePath: string,
    options: FileOperationOptions = {}
  ): Promise<GitLabFile> {
    const projectId = await this.getProjectId(projectPath);
    const ref = options.ref || 'main';
    const cacheKey = `file:${projectId}:${filePath}:${ref}`;

    // 检查缓存（10 分钟）
    const cached = await this.cacheRepo.get<GitLabFile>(cacheKey);
    if (cached) {
      this.logger?.debug('File cache hit', { projectPath, filePath, ref });
      return cached;
    }

    try {
      const file = await this.gitlabRepo.getFile(projectId, filePath, ref);

      // 缓存结果（10 分钟）
      await this.cacheRepo.set(cacheKey, file, 600);

      return file;
    } catch (error) {
      this.logger?.error('Failed to get file content', {
        projectPath,
        filePath,
        ref,
        error,
      });

      throw new BusinessError(
        ErrorCodes.NOT_FOUND_RESOURCE,
        `文件 '${filePath}' 不存在或无权访问`,
        { projectPath, filePath, ref }
      );
    }
  }

  /**
   * 从合并请求获取文件内容
   */
  async getFileFromMergeRequest(
    projectPath: string,
    mrIid: number,
    filePath: string
  ): Promise<GitLabFile> {
    try {
      // 获取 MR 信息以获取源分支
      const mr = await this.mrService.getMergeRequest(projectPath, mrIid);
      const sourceBranch = mr.source_branch;

      // 从源分支获取文件
      return await this.getFileContent(projectPath, filePath, {
        ref: sourceBranch,
      });
    } catch (error) {
      this.logger?.error('Failed to get file from merge request', {
        projectPath,
        mrIid,
        filePath,
        error,
      });
      throw error;
    }
  }
}

