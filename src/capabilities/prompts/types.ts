/**
 * 提示类型定义
 */

/**
 * 提示参数
 */
export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
}

/**
 * 提示示例
 */
export interface PromptExample {
  arguments: Record<string, any>;
  output: string;
  description?: string;
}

/**
 * 提示过滤器
 */
export interface PromptFilter {
  version?: string;
  category?: string;
}

/**
 * 提示信息
 */
export interface PromptInfo {
  name: string;
  description: string;
  version: string;
  arguments: PromptArgument[];
}

