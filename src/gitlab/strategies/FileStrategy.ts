import { GitLabClient } from '../GitLabClient.js';

/**
 * 文件内容结果
 */
export interface FileContentResult {
  filePath: string;
  ref: string;
  content: string;
  encoding: string;
  size: number;
  lastCommitId?: string;
  blobId?: string;
}

/**
 * 文件策略 - 策略模式
 * 处理文件相关的业务逻辑
 */
export class FileStrategy {
  constructor(private gitlabClient: GitLabClient) {}

  /**
   * 获取文件内容
   */
  async getFileContent(
    projectPath: string,
    filePath: string,
    ref: string = 'main'
  ): Promise<FileContentResult> {
    try {
      // 获取项目信息
      const project = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );

      // 获取文件内容
      const file = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getFileContent(project.id, filePath, ref)
      );

      // 解码内容
      let content = file.content;
      if (file.encoding === 'base64') {
        content = Buffer.from(file.content, 'base64').toString('utf-8');
      }

      return {
        filePath: file.file_path,
        ref,
        content,
        encoding: file.encoding,
        size: file.size,
        lastCommitId: file.last_commit_id,
        blobId: file.blob_id,
      };
    } catch (error) {
      throw new Error(
        `获取文件内容失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 批量获取文件内容
   */
  async getMultipleFileContents(
    projectPath: string,
    filePaths: string[],
    ref: string = 'main'
  ): Promise<FileContentResult[]> {
    const results: FileContentResult[] = [];
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        const fileContent = await this.getFileContent(projectPath, filePath, ref);
        results.push(fileContent);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${filePath}: ${errorMessage}`);
        console.warn(`获取文件失败: ${filePath}`, error);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`批量获取文件内容失败:\n${errors.join('\n')}`);
    }

    return results;
  }

  /**
   * 检查文件是否存在
   */
  async fileExists(
    projectPath: string,
    filePath: string,
    ref: string = 'main'
  ): Promise<boolean> {
    try {
      await this.getFileContent(projectPath, filePath, ref);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取项目分支列表
   */
  async getBranches(
    projectPath: string,
    options: { search?: string; per_page?: number } = {}
  ): Promise<any[]> {
    try {
      const project = await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );

      return await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getBranches(project.id, options)
      );
    } catch (error) {
      throw new Error(
        `获取分支列表失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取项目信息
   */
  async getProjectInfo(projectPath: string): Promise<any> {
    try {
      return await this.gitlabClient.withRetry(() =>
        this.gitlabClient.getProject(projectPath)
      );
    } catch (error) {
      throw new Error(
        `获取项目信息失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
} 