/**
 * 中间件类型定义
 */

/**
 * 工具请求
 */
export interface ToolRequest {
  type: 'tool';
  toolName: string;
  params: any;
}

/**
 * 资源请求
 */
export interface ResourceRequest {
  type: 'resource';
  uri: string;
}

/**
 * 提示请求
 */
export interface PromptRequest {
  type: 'prompt';
  promptName: string;
  args: Record<string, any>;
}

/**
 * 请求类型
 */
export type Request = ToolRequest | ResourceRequest | PromptRequest;

/**
 * 中间件上下文
 */
export interface MiddlewareContext {
  request: Request;
  response?: any;
  metadata: Map<string, any>;
  startTime: number;
  traceId: string;
  userId?: string;
}

