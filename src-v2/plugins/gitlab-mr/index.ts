/**
 * GitLab MR Plugin
 * 
 * 提供合并请求相关的工具、资源和提示
 */

import { Plugin } from '../../core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../core/plugin/types.js';
import { MergeRequestService } from '../../services/MergeRequestService.js';
import { ProjectService } from '../../services/ProjectService.js';
import { GetMergeRequestTool } from './tools/GetMergeRequestTool.js';
import { GetMergeRequestChangesTool } from './tools/GetMergeRequestChangesTool.js';
import { ListMergeRequestsTool } from './tools/ListMergeRequestsTool.js';
import { UpdateMergeRequestDescriptionTool } from './tools/UpdateMergeRequestDescriptionTool.js';
import { ProjectResource } from './resources/ProjectResource.js';
import { MergeRequestResource } from './resources/MergeRequestResource.js';
import { MergeRequestChangesResource } from './resources/MergeRequestChangesResource.js';
import { MRDescriptionPrompt } from './prompts/MRDescriptionPrompt.js';

/**
 * GitLab MR Plugin
 */
export class GitLabMRPlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'gitlab-mr',
    version: '1.0.0',
    author: 'GitLab MCP Team',
    description: 'GitLab 合并请求相关功能',
    mcpVersion: '1.0.0',
  };

  private mrService?: MergeRequestService;
  private projectService?: ProjectService;

  /**
   * 初始化插件
   */
  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);

    // 从上下文获取服务实例
    this.mrService = context.mrService;
    this.projectService = context.projectService;
  }

  /**
   * 注册能力
   */
  register(registry: CapabilityRegistry): void {
    if (!this.mrService || !this.projectService) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    // 注册工具
    registry.tools.registerTool(
      new GetMergeRequestTool(this.mrService, this.projectService)
    );
    registry.tools.registerTool(
      new GetMergeRequestChangesTool(this.mrService)
    );
    registry.tools.registerTool(
      new ListMergeRequestsTool(this.mrService)
    );
    registry.tools.registerTool(
      new UpdateMergeRequestDescriptionTool(this.mrService)
    );

    // 注册资源
    registry.resources.registerResource(
      new ProjectResource(this.projectService)
    );
    registry.resources.registerResource(
      new MergeRequestResource(this.mrService)
    );
    registry.resources.registerResource(
      new MergeRequestChangesResource(this.mrService)
    );

    // 注册提示
    registry.prompts.registerPrompt(
      new MRDescriptionPrompt(this.mrService)
    );
  }
}

