/**
 * 插件系统类型定义
 */

import type { ToolRegistry } from '../../capabilities/tools/ToolRegistry.js';
import type { ResourceRegistry } from '../../capabilities/resources/ResourceRegistry.js';
import type { PromptRegistry } from '../../capabilities/prompts/PromptRegistry.js';

/**
 * 插件元数据
 */
export interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  dependencies?: string[];
  mcpVersion: string;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  logger: any;
  config: any;
  [key: string]: any;
}

/**
 * 能力注册表
 */
export interface CapabilityRegistry {
  tools: ToolRegistry;
  resources: ResourceRegistry;
  prompts: PromptRegistry;
}

/**
 * 插件接口
 */
export interface IPlugin {
  /**
   * 插件元数据
   */
  readonly metadata: PluginMetadata;

  /**
   * 初始化插件
   */
  initialize(context: PluginContext): Promise<void>;

  /**
   * 注册能力
   */
  register(registry: CapabilityRegistry): void;

  /**
   * 启动插件
   */
  start(): Promise<void>;

  /**
   * 停止插件
   */
  stop(): Promise<void>;

  /**
   * 销毁插件
   */
  destroy(): Promise<void>;
}

