/**
 * 提示注册表
 */

import { PromptRenderer } from './PromptRenderer.js';
import type { IPrompt } from './Prompt.js';
import type { PromptFilter, PromptInfo } from './types.js';

/**
 * 提示注册表
 */
export class PromptRegistry {
  private prompts: Map<string, IPrompt> = new Map();

  /**
   * 注册提示
   */
  registerPrompt(prompt: IPrompt): void {
    if (this.prompts.has(prompt.name)) {
      throw new Error(`Prompt '${prompt.name}' is already registered`);
    }
    this.prompts.set(prompt.name, prompt);
  }

  /**
   * 注销提示
   */
  unregisterPrompt(name: string): void {
    this.prompts.delete(name);
  }

  /**
   * 获取提示
   */
  getPrompt(name: string): IPrompt | undefined {
    return this.prompts.get(name);
  }

  /**
   * 列出所有提示
   */
  listPrompts(filter?: PromptFilter): PromptInfo[] {
    let prompts = Array.from(this.prompts.values());

    // 应用过滤器
    if (filter) {
      if (filter.version) {
        prompts = prompts.filter((prompt) => prompt.version === filter.version);
      }
      if (filter.category) {
        // 假设 category 在 metadata 中（如果需要，可以扩展 IPrompt 接口）
        // 这里暂时跳过 category 过滤
      }
    }

    return prompts.map((prompt) => ({
      name: prompt.name,
      description: prompt.description,
      version: prompt.version,
      arguments: prompt.arguments,
    }));
  }

  /**
   * 渲染提示
   */
  async renderPrompt(name: string, args: Record<string, any>): Promise<string> {
    const prompt = this.getPrompt(name);
    if (!prompt) {
      throw new Error(`Prompt '${name}' not found`);
    }

    // 验证必需参数
    const missingArgs = prompt.arguments
      .filter((arg) => arg.required && args[arg.name] === undefined)
      .map((arg) => arg.name);

    if (missingArgs.length > 0) {
      throw new Error(`Missing required arguments: ${missingArgs.join(', ')}`);
    }

    // 使用默认值填充缺失的可选参数
    const finalArgs = { ...args };
    prompt.arguments.forEach((arg) => {
      if (finalArgs[arg.name] === undefined && arg.default !== undefined) {
        finalArgs[arg.name] = arg.default;
      }
    });

    // 渲染模板
    return PromptRenderer.render(prompt.template, finalArgs);
  }

  /**
   * 检查提示是否存在
   */
  hasPrompt(name: string): boolean {
    return this.prompts.has(name);
  }

  /**
   * 获取提示数量
   */
  getPromptCount(): number {
    return this.prompts.size;
  }
}

