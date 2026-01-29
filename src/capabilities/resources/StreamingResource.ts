/**
 * 流式资源基类
 * 
 * 用于处理大文件的流式传输
 */

import { Resource } from './Resource.js';
import type { ResourceContent } from './types.js';

/**
 * 流式资源接口
 */
export interface IStreamingResource extends Resource {
  /**
   * 是否支持流式传输
   */
  readonly streamable: boolean;

  /**
   * 获取流式内容
   */
  getStream(): AsyncIterable<ResourceContent>;
}

/**
 * 流式资源抽象基类
 */
export abstract class StreamingResource extends Resource implements IStreamingResource {
  readonly streamable = true;

  /**
   * 获取流式内容（子类实现）
   */
  abstract getStream(): AsyncIterable<ResourceContent>;

  /**
   * 默认实现：将流式内容聚合为完整内容
   */
  async getContent(): Promise<ResourceContent> {
    const chunks: ResourceContent[] = [];
    for await (const chunk of this.getStream()) {
      chunks.push(chunk);
    }

    // 合并所有块
    if (chunks.length === 0) {
      return {
        uri: this.uri,
        mimeType: this.mimeType,
        text: '',
      };
    }

    // 合并文本内容
    const text = chunks
      .map((chunk) => chunk.text || '')
      .join('');

    return {
      uri: this.uri,
      mimeType: this.mimeType,
      text,
    };
  }
}

