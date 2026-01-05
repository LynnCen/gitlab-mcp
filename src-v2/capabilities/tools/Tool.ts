/**
 * 工具接口
 */

import type { ZodSchema } from './types.js';
import type { ToolMetadata, ExecutionContext, ToolResult } from './types.js';

/**
 * 工具接口
 */
export interface ITool {
  /**
   * 工具名称
   */
  readonly name: string;

  /**
   * 工具描述
   */
  readonly description: string;

  /**
   * 输入 Schema
   */
  readonly inputSchema: ZodSchema;

  /**
   * 输出 Schema（可选）
   */
  readonly outputSchema?: ZodSchema;

  /**
   * 工具元数据
   */
  readonly metadata?: ToolMetadata;

  /**
   * 执行工具
   */
  execute(params: any, context: ExecutionContext): Promise<ToolResult>;
}

