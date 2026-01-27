/**
 * 流式文件资源
 * 
 * 支持大文件的流式传输
 */

import { StreamingResource } from '../../../capabilities/resources/StreamingResource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';
import type { IStreamingFileService } from '../../../services/StreamingFileService.js';

/**
 * 流式文件资源
 */
export class StreamingFileResource extends StreamingResource {
  readonly uri: string;
  readonly name: string;
  readonly description: string;
  readonly mimeType: string;
  readonly cacheable: boolean;
  readonly subscribable: boolean;

  private projectPath: string;
  private filePath: string;
  private ref: string;

  constructor(
    uri: string,
    private streamingFileService: IStreamingFileService
  ) {
    super();

    this.uri = uri;
    this.name = 'Streaming File Resource';
    this.description = 'Streaming file content from GitLab';
    this.mimeType = 'text/plain';
    this.cacheable = true;
    this.subscribable = false;

    // 解析 URI: gitlab://projects/{id}/files/{path}?ref={ref}
    const url = new URL(uri);
    const pathParts = url.pathname.split('/');
    const projectId = pathParts[2];
    const filePath = pathParts.slice(4).join('/');
    const ref = url.searchParams.get('ref') || 'main';

    this.projectPath = projectId;
    this.filePath = decodeURIComponent(filePath);
    this.ref = ref;
  }

  /**
   * 获取流式内容
   */
  async *getStream(): AsyncIterable<ResourceContent> {
    const chunks = this.streamingFileService.streamFileContent(
      this.projectPath,
      this.filePath,
      {
        ref: this.ref,
        chunkSize: 64 * 1024, // 64KB chunks
        cache: true,
      }
    );

    for await (const chunk of chunks) {
      yield {
        uri: `${this.uri}#chunk-${chunk.index}`,
        mimeType: this.mimeType,
        text: chunk.content,
      };
    }
  }
}

