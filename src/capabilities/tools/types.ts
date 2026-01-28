/**
 * 工具类型定义
 */

import type { z } from 'zod';

/**
 * 工具元数据
 */
export interface ToolMetadata {
  category?: string;
  tags?: string[];
  examples?: ToolExample[];
  deprecated?: boolean;
  version?: string;
  plugin?: string;
}

/**
 * 工具示例
 */
export interface ToolExample {
  input: any;
  output: any;
  description?: string;
}

/**
 * 执行上下文
 */
export interface ExecutionContext {
  traceId: string;
  userId?: string;
  requestId: string;
  startTime: number;
  metadata: Map<string, any>;
}

/**
 * 工具结果内容项
 */
export interface ToolResultContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  uri?: string;
  mimeType?: string;
  [key: string]: unknown;
}

/**
 * 工具结果
 */
export interface ToolResult {
  content: ToolResultContent[];
  isError?: boolean;
  [key: string]: unknown;
}

/**
 * 工具过滤器
 */
export interface ToolFilter {
  category?: string;
  tags?: string[];
  plugin?: string;
  deprecated?: boolean;
}

/**
 * 工具信息
 */
export interface ToolInfo {
  name: string;
  description: string;
  inputSchema: any; // JSON Schema object
  category?: string;
  tags?: string[];
  plugin?: string;
  deprecated?: boolean;
}

/**
 * Zod Schema 类型
 */
export type ZodSchema = z.ZodType<any, any, any>;

