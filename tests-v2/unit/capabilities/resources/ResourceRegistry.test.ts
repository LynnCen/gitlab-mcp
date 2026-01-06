/**
 * ResourceRegistry 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceRegistry } from '../../../../src-v2/capabilities/resources/ResourceRegistry.js';
import { Resource } from '../../../../src-v2/capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../../src-v2/capabilities/resources/types.js';

// Mock Resource
class MockResource extends Resource {
  readonly uri = 'test://resource';
  readonly name = 'Test Resource';
  readonly description = 'Test resource';
  readonly mimeType = 'text/plain';
  readonly cacheable = true;
  readonly subscribable = false;

  async getContent(): Promise<ResourceContent> {
    return {
      uri: this.uri,
      mimeType: 'text/plain',
      text: 'test content',
    };
  }
}

describe('ResourceRegistry', () => {
  let registry: ResourceRegistry;

  beforeEach(() => {
    registry = new ResourceRegistry();
  });

  describe('registerResource', () => {
    it('应该能够注册资源', () => {
      const resource = new MockResource();
      registry.registerResource(resource);

      expect(registry.getResource('test://resource')).toBe(resource);
    });

    it('应该在重复注册时抛出错误', () => {
      const resource = new MockResource();
      registry.registerResource(resource);

      expect(() => {
        registry.registerResource(new MockResource());
      }).toThrow("Resource with URI 'test://resource' is already registered");
    });
  });

  describe('resolveUri', () => {
    it('应该能够解析 URI', () => {
      const resource = new MockResource();
      registry.registerResource(resource);

      const resolved = registry.resolveUri('test://resource');
      expect(resolved).toBe(resource);
    });

    it('应该支持前缀匹配', () => {
      // 创建一个新的资源用于前缀匹配测试
      class PrefixResource extends Resource {
        readonly uri = 'test://';
        readonly name = 'Prefix Resource';
        readonly description = 'Prefix resource';
        readonly mimeType = 'text/plain';
        readonly cacheable = true;
        readonly subscribable = false;

        constructor() {
          super();
        }

        async getContent(): Promise<ResourceContent> {
          return {
            uri: this.uri,
            mimeType: 'text/plain',
            text: 'prefix content',
          };
        }
      }

      const resource = new PrefixResource();
      registry.registerResource(resource);

      const resolved = registry.resolveUri('test://resource');
      expect(resolved).toBe(resource);
    });
  });

  describe('listResources', () => {
    it('应该列出所有资源', () => {
      const resource = new MockResource();
      registry.registerResource(resource);

      const resources = registry.listResources();
      expect(resources.length).toBe(1);
      expect(resources[0].uri).toBe('test://resource');
    });
  });
});

