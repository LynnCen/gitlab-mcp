/**
 * PluginRegistry
 * 
 * 管理所有插件的注册、加载、卸载
 */

import type { IPlugin, PluginMetadata } from './types.js';

/**
 * PluginRegistry 接口
 */
export interface IPluginRegistry {
  /**
   * 注册插件
   */
  register(plugin: IPlugin): void;

  /**
   * 注销插件
   */
  unregister(name: string): void;

  /**
   * 获取插件
   */
  get(name: string): IPlugin | undefined;

  /**
   * 列出所有插件
   */
  list(): IPlugin[];

  /**
   * 启动所有插件
   */
  startAll(): Promise<void>;

  /**
   * 停止所有插件
   */
  stopAll(): Promise<void>;
}

/**
 * PluginRegistry 实现
 */
export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, IPlugin> = new Map();

  /**
   * 注册插件
   */
  register(plugin: IPlugin): void {
    const name = plugin.metadata.name;

    if (this.plugins.has(name)) {
      throw new Error(`Plugin '${name}' is already registered`);
    }

    // 检查依赖
    this.checkDependencies(plugin);

    this.plugins.set(name, plugin);
  }

  /**
   * 检查插件依赖
   */
  private checkDependencies(plugin: IPlugin): void {
    const dependencies = plugin.metadata.dependencies || [];

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        throw new Error(
          `Plugin '${plugin.metadata.name}' requires dependency '${dep}' which is not registered`
        );
      }
    }
  }

  /**
   * 注销插件
   */
  unregister(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy();
      this.plugins.delete(name);
    }
  }

  /**
   * 获取插件
   */
  get(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 列出所有插件
   */
  list(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 启动所有插件
   */
  async startAll(): Promise<void> {
    const plugins = this.list();
    for (const plugin of plugins) {
      try {
        await plugin.start();
      } catch (error) {
        console.error(`Failed to start plugin '${plugin.metadata.name}':`, error);
      }
    }
  }

  /**
   * 停止所有插件
   */
  async stopAll(): Promise<void> {
    const plugins = this.list();
    for (const plugin of plugins) {
      try {
        await plugin.stop();
      } catch (error) {
        console.error(`Failed to stop plugin '${plugin.metadata.name}':`, error);
      }
    }
  }
}

