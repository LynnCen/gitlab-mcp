/**
 * 提示接口和基类
 */

import type { PromptArgument, PromptExample } from './types.js';

/**
 * 提示接口
 */
export interface IPrompt {
  /**
   * 提示名称
   */
  readonly name: string;

  /**
   * 提示描述
   */
  readonly description: string;

  /**
   * 提示参数
   */
  readonly arguments: PromptArgument[];

  /**
   * 提示模板
   */
  readonly template: string;

  /**
   * 提示版本
   */
  readonly version: string;

  /**
   * 提示示例
   */
  readonly examples?: PromptExample[];

  /**
   * 渲染提示
   */
  render(args: Record<string, any>): Promise<string>;
}

/**
 * 提示抽象基类
 */
export abstract class Prompt implements IPrompt {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly arguments: PromptArgument[];
  abstract readonly template: string;
  readonly version: string = '1.0.0';
  readonly examples?: PromptExample[];

  abstract render(args: Record<string, any>): Promise<string>;
}
