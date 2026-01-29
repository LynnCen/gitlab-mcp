/**
 * 传输层类型定义
 */

/**
 * 传输类型
 */
export type TransportType = 'stdio' | 'http' | 'websocket';

/**
 * JSON-RPC 消息
 */
export interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: JsonRpcError;
}

/**
 * JSON-RPC 错误
 */
export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

/**
 * 传输配置
 */
export interface TransportConfig {
  /**
   * 传输名称
   */
  name?: string;

  /**
   * 是否启用
   */
  enabled?: boolean;
}

