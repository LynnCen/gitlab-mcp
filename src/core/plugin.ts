import { MCPTool, MCPResource, MCPPrompt, PluginManifest, PluginContext } from '../types/index.js';

/**
 * 插件基础抽象类
 * 所有插件都应该继承此类
 */
export abstract class BasePlugin {
  protected context: PluginContext;
  protected manifest: PluginManifest;

  constructor(context: PluginContext) {
    this.context = context;
    this.manifest = this.getManifest();
  }

  /**
   * 获取插件清单
   */
  abstract getManifest(): PluginManifest;

  /**
   * 初始化插件
   */
  abstract initialize(): Promise<void>;

  /**
   * 获取插件提供的工具
   */
  abstract getTools(): MCPTool[];

  /**
   * 获取插件提供的资源
   */
  abstract getResources(): MCPResource[];

  /**
   * 获取插件提供的提示模板
   */
  abstract getPrompts(): MCPPrompt[];

  /**
   * 处理工具调用
   */
  abstract handleToolCall(name: string, args: any): Promise<any>;

  /**
   * 处理资源读取
   */
  abstract handleResourceRead(uri: string): Promise<any>;

  /**
   * 处理提示获取
   */
  abstract handlePromptGet(name: string, args: any): Promise<any>;

  /**
   * 销毁插件
   */
  abstract destroy(): Promise<void>;

  /**
   * 获取插件名称
   */
  get name(): string {
    return this.manifest.name;
  }

  /**
   * 获取插件版本
   */
  get version(): string {
    return this.manifest.version;
  }

  /**
   * 检查插件是否支持某个功能
   */
  supports(capability: keyof PluginManifest['capabilities']): boolean {
    return this.manifest.capabilities[capability];
  }

  /**
   * 记录日志
   */
  protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, ...args: any[]): void {
    this.context.logger[level](`[${this.name}] ${message}`, ...args);
  }

  /**
   * 获取缓存
   */
  protected async getCache<T>(key: string): Promise<T | null> {
    if (!this.context.cache) {
      return null;
    }
    return this.context.cache.get<T>(`${this.name}:${key}`);
  }

  /**
   * 设置缓存
   */
  protected async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.context.cache) {
      return;
    }
    await this.context.cache.set(`${this.name}:${key}`, value, ttl);
  }

  /**
   * 删除缓存
   */
  protected async deleteCache(key: string): Promise<void> {
    if (!this.context.cache) {
      return;
    }
    await this.context.cache.del(`${this.name}:${key}`);
  }
}

/**
 * 插件工厂接口
 */
export interface PluginFactory {
  create(context: PluginContext): BasePlugin;
}

/**
 * 插件注册表
 */
export class PluginRegistry {
  private plugins = new Map<string, PluginFactory>();

  /**
   * 注册插件
   */
  register(name: string, factory: PluginFactory): void {
    this.plugins.set(name, factory);
  }

  /**
   * 获取插件
   */
  get(name: string): PluginFactory | undefined {
    return this.plugins.get(name);
  }

  /**
   * 获取所有插件名称
   */
  getNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * 创建插件实例
   */
  create(name: string, context: PluginContext): BasePlugin {
    const factory = this.plugins.get(name);
    if (!factory) {
      throw new Error(`Plugin ${name} not found`);
    }
    return factory.create(context);
  }
} 