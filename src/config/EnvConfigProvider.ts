/**
 * 环境变量配置提供者
 */

import { config } from 'dotenv';
import type { IConfigProvider } from './ConfigProvider.js';

/**
 * 环境变量配置提供者
 */
export class EnvConfigProvider implements IConfigProvider {
  private config: Record<string, any> = {};

  constructor(envFile?: string) {
    if (envFile) {
      config({ path: envFile });
    } else {
      config();
    }
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

