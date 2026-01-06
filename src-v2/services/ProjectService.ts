/**
 * ProjectService
 * 
 * 项目相关的业务逻辑服务
 */

import type { IGitLabRepository } from '../repositories/GitLabRepository.js';
import type { ICacheRepository } from '../repositories/CacheRepository.js';
import type { ILogger } from '../logging/types.js';
import { BusinessError } from '../errors/BusinessError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';
import type { GitLabProject } from '../repositories/types.js';

/**
 * ProjectService 接口
 */
export interface IProjectService {
  /**
   * 获取项目信息
   */
  getProject(projectPath: string): Promise<GitLabProject>;

  /**
   * 验证项目访问权限
   */
  validateProjectAccess(projectPath: string): Promise<boolean>;
}

/**
 * ProjectService 实现
 */
export class ProjectService implements IProjectService {
  constructor(
    private gitlabRepo: IGitLabRepository,
    private cacheRepo: ICacheRepository,
    private logger?: ILogger
  ) {}

  /**
   * 获取项目信息
   */
  async getProject(projectPath: string): Promise<GitLabProject> {
    const cacheKey = `project:${projectPath}`;
    const cached = await this.cacheRepo.get<GitLabProject>(cacheKey);

    if (cached) {
      this.logger?.debug('Project cache hit', { projectPath });
      return cached;
    }

    try {
      const project = await this.gitlabRepo.getProject(projectPath);

      // 缓存项目信息（30 分钟）
      await this.cacheRepo.set(cacheKey, project, 1800);

      return project;
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
   * 验证项目访问权限
   */
  async validateProjectAccess(projectPath: string): Promise<boolean> {
    try {
      await this.getProject(projectPath);
      return true;
    } catch (error) {
      return false;
    }
  }
}

