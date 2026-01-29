/**
 * 资源注册表
 */

import type { IResource } from './Resource.js';
import type { ResourceFilter, ResourceInfo } from './types.js';

/**
 * 资源注册表
 */
export class ResourceRegistry {
  private resources: Map<string, IResource> = new Map();

  /**
   * 注册资源
   */
  registerResource(resource: IResource): void {
    if (this.resources.has(resource.uri)) {
      throw new Error(`Resource with URI '${resource.uri}' is already registered`);
    }
    this.resources.set(resource.uri, resource);
  }

  /**
   * 注销资源
   */
  unregisterResource(uri: string): void {
    this.resources.delete(uri);
  }

  /**
   * 获取资源
   */
  getResource(uri: string): IResource | undefined {
    return this.resources.get(uri);
  }

  /**
   * 列出所有资源
   */
  listResources(filter?: ResourceFilter): ResourceInfo[] {
    let resources = Array.from(this.resources.values());

    // 应用过滤器
    if (filter) {
      if (filter.scheme) {
        resources = resources.filter((resource) => {
          try {
            const url = new URL(resource.uri);
            return url.protocol.replace(':', '') === filter.scheme;
          } catch {
            return false;
          }
        });
      }
      if (filter.mimeType) {
        resources = resources.filter((resource) => resource.mimeType === filter.mimeType);
      }
      if (filter.cacheable !== undefined) {
        resources = resources.filter((resource) => resource.cacheable === filter.cacheable);
      }
    }

    return resources.map((resource) => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    }));
  }

  /**
   * 解析 URI
   */
  resolveUri(uri: string): IResource | undefined {
    // 首先尝试直接匹配
    let resource = this.resources.get(uri);
    if (resource) {
      return resource;
    }

    // 尝试前缀匹配（用于支持通配符 URI）
    for (const [registeredUri, res] of this.resources.entries()) {
      if (uri.startsWith(registeredUri)) {
        return res;
      }
    }

    return undefined;
  }

  /**
   * 检查资源是否存在
   */
  hasResource(uri: string): boolean {
    return this.resources.has(uri) || this.resolveUri(uri) !== undefined;
  }

  /**
   * 获取资源数量
   */
  getResourceCount(): number {
    return this.resources.size;
  }
}

