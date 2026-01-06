/**
 * PluginLoader
 * 
 * 负责从不同来源加载插件
 */

import type { IPlugin } from './types.js';

/**
 * PluginLoader 接口
 */
export interface IPluginLoader {
  /**
   * 从目录加载插件
   */
  loadFromDirectory(dir: string): Promise<IPlugin[]>;

  /**
   * 从 npm 包加载插件
   */
  loadFromNpm(packageName: string): Promise<IPlugin>;

  /**
   * 验证插件
   */
  validatePlugin(plugin: IPlugin): ValidationResult;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * PluginLoader 实现
 */
export class PluginLoader implements IPluginLoader {
  /**
   * 从目录加载插件
   */
  async loadFromDirectory(dir: string): Promise<IPlugin[]> {
    // TODO: 实现从目录加载插件的逻辑
    // 1. 扫描目录中的插件文件
    // 2. 动态导入插件模块
    // 3. 验证插件
    // 4. 返回插件列表
    return [];
  }

  /**
   * 从 npm 包加载插件
   */
  async loadFromNpm(packageName: string): Promise<IPlugin> {
    // TODO: 实现从 npm 包加载插件的逻辑
    // 1. 检查包是否已安装
    // 2. 动态导入插件模块
    // 3. 验证插件
    // 4. 返回插件实例
    throw new Error('Not implemented');
  }

  /**
   * 验证插件
   */
  validatePlugin(plugin: IPlugin): ValidationResult {
    const errors: string[] = [];

    // 检查元数据
    if (!plugin.metadata) {
      errors.push('Plugin metadata is missing');
    } else {
      if (!plugin.metadata.name) {
        errors.push('Plugin name is required');
      }
      if (!plugin.metadata.version) {
        errors.push('Plugin version is required');
      }
      if (!plugin.metadata.author) {
        errors.push('Plugin author is required');
      }
      if (!plugin.metadata.description) {
        errors.push('Plugin description is required');
      }
    }

    // 检查方法
    if (typeof plugin.initialize !== 'function') {
      errors.push('Plugin must implement initialize method');
    }
    if (typeof plugin.register !== 'function') {
      errors.push('Plugin must implement register method');
    }
    if (typeof plugin.start !== 'function') {
      errors.push('Plugin must implement start method');
    }
    if (typeof plugin.stop !== 'function') {
      errors.push('Plugin must implement stop method');
    }
    if (typeof plugin.destroy !== 'function') {
      errors.push('Plugin must implement destroy method');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

