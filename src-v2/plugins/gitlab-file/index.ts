/**
 * GitLab File Plugin
 * 
 * 提供文件操作相关的工具和资源
 */

import { Plugin } from '../../core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../core/plugin/types.js';
import { FileOperationService } from '../../services/FileOperationService.js';
import { GetFileContentTool } from './tools/GetFileContentTool.js';
import { FileResource } from './resources/FileResource.js';

/**
 * GitLab File Plugin
 */
export class GitLabFilePlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'gitlab-file',
    version: '1.0.0',
    author: 'GitLab MCP Team',
    description: 'GitLab 文件操作相关功能',
    mcpVersion: '1.0.0',
  };

  private fileService?: FileOperationService;

  /**
   * 初始化插件
   */
  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);
    this.fileService = context.fileService;
  }

  /**
   * 注册能力
   */
  register(registry: CapabilityRegistry): void {
    if (!this.fileService) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    // 注册工具
    registry.tools.registerTool(new GetFileContentTool(this.fileService));

    // 注册资源
    registry.resources.registerResource(new FileResource(this.fileService));
  }
}

