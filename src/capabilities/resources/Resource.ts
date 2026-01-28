/**
 * 资源接口和基类
 */

import type { ResourceContent } from './types.js';

/**
 * 资源接口
 */
export interface IResource {
  /**
   * 资源 URI
   */
  readonly uri: string;

  /**
   * 资源名称
   */
  readonly name: string;

  /**
   * 资源描述
   */
  readonly description: string;

  /**
   * MIME 类型
   */
  readonly mimeType: string;

  /**
   * 资源大小（字节）
   */
  readonly size?: number;

  /**
   * 资源元数据
   */
  readonly metadata?: Record<string, unknown>;

  /**
   * 是否可缓存
   */
  readonly cacheable: boolean;

  /**
   * 是否可订阅
   */
  readonly subscribable: boolean;

  /**
   * 设置元数据
   */
  setMetadata(key: string, value: unknown): void;

  /**
   * 获取资源内容
   */
  getContent(): Promise<ResourceContent>;

  /**
   * 订阅变更（如果支持）
   */
  subscribe?(callback: (content: ResourceContent) => void): () => void;
}

/**
 * 资源抽象基类
 */
export abstract class Resource implements IResource {
  abstract readonly uri: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly mimeType: string;
  readonly size?: number;
  protected _metadata: Record<string, unknown> = {};
  abstract readonly cacheable: boolean;
  abstract readonly subscribable: boolean;

  /**
   * 获取元数据
   */
  get metadata(): Record<string, unknown> {
    return this._metadata;
  }

  /**
   * 设置元数据
   */
  setMetadata(key: string, value: unknown): void {
    this._metadata[key] = value;
  }

  abstract getContent(): Promise<ResourceContent>;
}
