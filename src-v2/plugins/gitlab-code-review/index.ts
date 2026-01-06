/**
 * GitLab Code Review Plugin
 * 
 * 提供代码审查相关的工具、资源和提示
 */

import { Plugin } from '../../core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../core/plugin/types.js';
import { CodeReviewService } from '../../services/CodeReviewService.js';
import { AnalyzeMRChangesTool } from './tools/AnalyzeMRChangesTool.js';
import { PushCodeReviewCommentsTool } from './tools/PushCodeReviewCommentsTool.js';
import { GetFileCodeReviewRulesTool } from './tools/GetFileCodeReviewRulesTool.js';
import { CodeReviewRulesResource } from './resources/CodeReviewRulesResource.js';
import { CodeReviewTypeScriptPrompt } from './prompts/CodeReviewTypeScriptPrompt.js';
import { CodeReviewVuePrompt } from './prompts/CodeReviewVuePrompt.js';

/**
 * GitLab Code Review Plugin
 */
export class GitLabCodeReviewPlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'gitlab-code-review',
    version: '1.0.0',
    author: 'GitLab MCP Team',
    description: 'GitLab AI 代码审查相关功能',
    mcpVersion: '1.0.0',
  };

  private codeReviewService?: CodeReviewService;

  /**
   * 初始化插件
   */
  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);
    this.codeReviewService = context.codeReviewService;
  }

  /**
   * 注册能力
   */
  register(registry: CapabilityRegistry): void {
    if (!this.codeReviewService) {
      throw new Error('Plugin not initialized. Call initialize() first.');
    }

    // 注册工具
    registry.tools.registerTool(
      new AnalyzeMRChangesTool(this.codeReviewService)
    );
    registry.tools.registerTool(
      new PushCodeReviewCommentsTool(this.codeReviewService)
    );
    registry.tools.registerTool(
      new GetFileCodeReviewRulesTool()
    );

    // 注册资源
    registry.resources.registerResource(new CodeReviewRulesResource());

    // 注册提示
    registry.prompts.registerPrompt(new CodeReviewTypeScriptPrompt());
    registry.prompts.registerPrompt(new CodeReviewVuePrompt());
  }
}

