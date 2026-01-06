/**
 * Plugin 基类
 * 
 * 提供插件的基础实现
 */

import type {
  IPlugin,
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from './types.js';

/**
 * Plugin 抽象基类
 */
export abstract class Plugin implements IPlugin {
  abstract readonly metadata: PluginMetadata;
  protected context?: PluginContext;

  /**
   * 初始化插件
   */
  async initialize(context: PluginContext): Promise<void> {
    this.context = context;
  }

  /**
   * 注册能力（子类实现）
   */
  abstract register(registry: CapabilityRegistry): void;

  /**
   * 启动插件
   */
  async start(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 停止插件
   */
  async stop(): Promise<void> {
    // 默认实现为空
  }

  /**
   * 销毁插件
   */
  async destroy(): Promise<void> {
    this.context = undefined;
  }
}

