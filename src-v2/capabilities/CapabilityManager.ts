/**
 * 能力管理器
 * 
 * 统一管理 Tools、Resources、Prompts 三种能力
 */

import { ToolRegistry } from './tools/ToolRegistry.js';
import { ResourceRegistry } from './resources/ResourceRegistry.js';
import { PromptRegistry } from './prompts/PromptRegistry.js';
import type { ITool } from './tools/Tool.js';
import type { IResource } from './resources/Resource.js';
import type { IPrompt } from './prompts/Prompt.js';

/**
 * 能力管理器
 */
export class CapabilityManager {
  private toolRegistry: ToolRegistry;
  private resourceRegistry: ResourceRegistry;
  private promptRegistry: PromptRegistry;

  constructor() {
    this.toolRegistry = new ToolRegistry();
    this.resourceRegistry = new ResourceRegistry();
    this.promptRegistry = new PromptRegistry();
  }

  /**
   * 获取工具注册表
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * 获取资源注册表
   */
  getResourceRegistry(): ResourceRegistry {
    return this.resourceRegistry;
  }

  /**
   * 获取提示注册表
   */
  getPromptRegistry(): PromptRegistry {
    return this.promptRegistry;
  }

  /**
   * 注册工具
   */
  registerTool(tool: ITool): void {
    this.toolRegistry.registerTool(tool);
  }

  /**
   * 注册资源
   */
  registerResource(resource: IResource): void {
    this.resourceRegistry.registerResource(resource);
  }

  /**
   * 注册提示
   */
  registerPrompt(prompt: IPrompt): void {
    this.promptRegistry.registerPrompt(prompt);
  }

  /**
   * 注销工具
   */
  unregisterTool(name: string): void {
    this.toolRegistry.unregisterTool(name);
  }

  /**
   * 注销资源
   */
  unregisterResource(uri: string): void {
    this.resourceRegistry.unregisterResource(uri);
  }

  /**
   * 注销提示
   */
  unregisterPrompt(name: string): void {
    this.promptRegistry.unregisterPrompt(name);
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    tools: number;
    resources: number;
    prompts: number;
  } {
    return {
      tools: this.toolRegistry.getToolCount(),
      resources: this.resourceRegistry.getResourceCount(),
      prompts: this.promptRegistry.getPromptCount(),
    };
  }
}

