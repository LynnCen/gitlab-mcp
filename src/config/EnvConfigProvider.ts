/**
 * 环境变量配置提供者
 * 
 * 注意：MCP Server 不需要 dotenv，因为：
 * 1. MCP 客户端（Inspector/Cursor）会通过配置文件传递环境变量
 * 2. 直接读取 process.env 更简单、更快、无 stdout 污染风险
 */

import type { IConfigProvider } from './ConfigProvider.js';

/**
 * 环境变量配置提供者
 * 直接从 process.env 读取，不依赖 dotenv
 */
export class EnvConfigProvider implements IConfigProvider {
  private config: Record<string, any> = {};

  constructor(envFile?: string) {
    // envFile 参数保留用于兼容性，但实际不使用
    // MCP 环境下，所有配置都通过 process.env 传递
    this.load();
  }

  /**
   * 加载环境变量
   */
  private load(): void {
    this.config = { ...process.env };
  }

  /**
   * 获取配置值
   */
  get<T = any>(key: string, defaultValue?: T): T {
    // 支持点号分隔的嵌套键
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value === undefined || value === null) {
        return defaultValue as T;
      }
      value = value[k];
    }

    // 如果值是字符串，尝试转换为布尔值或数字
    if (typeof value === 'string') {
      // 布尔值
      if (value.toLowerCase() === 'true') {
        return true as T;
      }
      if (value.toLowerCase() === 'false') {
        return false as T;
      }
      // 数字
      if (/^-?\d+$/.test(value)) {
        return Number(value) as T;
      }
      // 浮点数
      if (/^-?\d+\.\d+$/.test(value)) {
        return Number(value) as T;
      }
    }

    return (value !== undefined ? value : defaultValue) as T;
  }

  /**
   * 检查配置是否存在
   */
  has(key: string): boolean {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value === undefined || value === null) {
        return false;
      }
      value = value[k];
    }

    return value !== undefined;
  }

  /**
   * 获取所有配置
   */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /**
   * 重新加载配置
   */
  async reload(): Promise<void> {
    this.load();
  }
}

