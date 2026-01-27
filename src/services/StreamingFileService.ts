/**
 * 流式文件服务
 * 
 * 用于处理大文件的流式传输，避免内存溢出
 */

import type { IGitLabRepository } from '../repositories/GitLabRepository.js';
import type { ICacheRepository } from '../repositories/CacheRepository.js';
import type { ILogger } from '../logging/types.js';
import { BusinessError } from '../errors/BusinessError.js';
import { ErrorCodes } from '../errors/ErrorCode.js';

/**
 * 流式文件块
 */
export interface FileChunk {
  /**
   * 块索引
   */
  index: number;

  /**
   * 块内容
   */
  content: string;

  /**
   * 是否最后一块
   */
  isLast: boolean;

  /**
   * 总大小（字节）
   */
  totalSize?: number;

  /**
   * 当前进度（0-1）
   */
  progress?: number;
}

/**
 * 流式文件选项
 */
export interface StreamingFileOptions {
  /**
   * 块大小（字节），默认 64KB
   */
  chunkSize?: number;

  /**
   * 是否启用缓存
   */
  cache?: boolean;

  /**
   * 缓存 TTL（秒）
   */
  cacheTtl?: number;
}

/**
 * 流式文件服务接口
 */
export interface IStreamingFileService {
  /**
   * 流式获取文件内容
   */
  streamFileContent(
    projectPath: string,
    filePath: string,
    options?: StreamingFileOptions & { ref?: string }
  ): AsyncIterable<FileChunk>;

  /**
   * 检查文件大小
   */
  getFileSize(
    projectPath: string,
    filePath: string,
    ref?: string
  ): Promise<number>;
}

/**
 * 流式文件服务实现
 */
export class StreamingFileService implements IStreamingFileService {
  private readonly defaultChunkSize = 64 * 1024; // 64KB

  constructor(
    private gitlabRepo: IGitLabRepository,
    private cacheRepo: ICacheRepository,
    private logger?: ILogger
  ) {}

  /**
   * 获取项目 ID
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
   * 检查文件大小
   */
  async getFileSize(
    projectPath: string,
    filePath: string,
    ref: string = 'main'
  ): Promise<number> {
    const projectId = await this.getProjectId(projectPath);

    try {
      // 获取文件元信息（不获取内容）
      const file = await this.gitlabRepo.getFile(projectId, filePath, ref);
      
      // 如果文件有大小信息，返回它
      if ('size' in file && typeof file.size === 'number') {
        return file.size;
      }

      // 否则尝试从内容估算
      if ('content' in file && typeof file.content === 'string') {
        return Buffer.byteLength(file.content, 'utf8');
      }

      return 0;
    } catch (error) {
      this.logger?.error('Failed to get file size', {
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
   * 流式获取文件内容
   */
  async *streamFileContent(
    projectPath: string,
    filePath: string,
    options: StreamingFileOptions & { ref?: string } = {}
  ): AsyncIterable<FileChunk> {
    const {
      chunkSize = this.defaultChunkSize,
      cache = true,
      cacheTtl = 600,
      ref = 'main',
    } = options;

    const projectId = await this.getProjectId(projectPath);
    const cacheKey = `file:${projectId}:${filePath}:${ref}`;

    // 检查缓存
    if (cache) {
      const cached = await this.cacheRepo.get<string>(cacheKey);
      if (cached) {
        this.logger?.debug('File cache hit (streaming)', {
          projectPath,
          filePath,
          ref,
        });

        // 从缓存流式返回
        yield* this.chunkString(cached, chunkSize, cached.length);
        return;
      }
    }

    try {
      // 获取完整文件内容
      const file = await this.gitlabRepo.getFile(projectId, filePath, ref);
      const content = file.content || '';

      // 缓存完整内容（如果启用）
      if (cache && content.length > 0) {
        await this.cacheRepo.set(cacheKey, content, cacheTtl);
      }

      // 流式返回内容
      yield* this.chunkString(content, chunkSize, content.length);
    } catch (error) {
      this.logger?.error('Failed to stream file content', {
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
   * 将字符串分块
   */
  private async *chunkString(
    content: string,
    chunkSize: number,
    totalSize: number
  ): AsyncIterable<FileChunk> {
    const buffer = Buffer.from(content, 'utf8');
    let index = 0;
    let offset = 0;

    while (offset < buffer.length) {
      const end = Math.min(offset + chunkSize, buffer.length);
      const chunk = buffer.slice(offset, end);
      const chunkText = chunk.toString('utf8');

      const isLast = end >= buffer.length;
      const progress = totalSize > 0 ? end / totalSize : undefined;

      yield {
        index: index++,
        content: chunkText,
        isLast,
        totalSize,
        progress,
      };

      offset = end;
    }
  }
}

