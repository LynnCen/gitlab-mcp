/**
 * FileResource
 * 
 * 文件资源：gitlab://projects/{id}/files/{path}?ref={ref}
 */

import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';
import type { IFileOperationService } from '../../../services/FileOperationService.js';

/**
 * FileResource 实现
 */
export class FileResource extends Resource {
  readonly uri = 'gitlab://projects/{id}/files/{path}';
  readonly name = 'GitLab File';
  readonly description = 'GitLab 文件内容';
  readonly mimeType = 'text/plain';
  readonly cacheable = true;
  readonly subscribable = false;

  constructor(private fileService: IFileOperationService) {
    super();
  }

  async getContent(): Promise<ResourceContent> {
    // 从 metadata 获取实际 URI
    const actualUri = (this.metadata?.actualUri as string) || this.uri;
    
    // 解析 URI: gitlab://projects/{id}/files/{path}?ref={ref}
    const url = new URL(actualUri.replace('gitlab://', 'https://'));
    const pathMatch = url.pathname.match(/^\/projects\/(.+)\/files\/(.+)$/);
    if (!pathMatch) {
      throw new Error(`Invalid file URI: ${actualUri}. Expected format: gitlab://projects/{id}/files/{path}?ref={ref}`);
    }

    const projectPath = pathMatch[1];
    const filePath = decodeURIComponent(pathMatch[2]);
    const ref = url.searchParams.get('ref') || 'main';

    const file = await this.fileService.getFileContent(projectPath, filePath, {
      ref,
      includeContent: true,
    });

    return {
      uri: actualUri,
      mimeType: this.getMimeType(filePath),
      text: file.content,
    };
  }

  /**
   * 根据文件扩展名获取 MIME 类型
   */
  private getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      js: 'application/javascript',
      ts: 'application/typescript',
      json: 'application/json',
      md: 'text/markdown',
      html: 'text/html',
      css: 'text/css',
      vue: 'text/vue',
      py: 'text/x-python',
      java: 'text/x-java',
      go: 'text/x-go',
      rs: 'text/x-rust',
    };
    return mimeTypes[ext || ''] || 'text/plain';
  }
}

