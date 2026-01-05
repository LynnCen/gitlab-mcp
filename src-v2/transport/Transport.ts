/**
 * 传输接口
 */

import type { TransportType, JsonRpcMessage } from './types.js';

/**
 * 传输接口
 */
export interface ITransport {
  /**
   * 传输类型
   */
  readonly type: TransportType;

  /**
   * 传输名称
   */
  readonly name: string;

  /**
   * 启动传输
   */
  start(): Promise<void>;

  /**
   * 停止传输
   */
  stop(): Promise<void>;

  /**
   * 发送消息
   */
  send(message: JsonRpcMessage): Promise<void>;

  /**
   * 接收消息事件
   */
  onMessage(handler: (message: JsonRpcMessage) => void): void;

  /**
   * 错误事件
   */
  onError(handler: (error: Error) => void): void;

  /**
   * 关闭事件
   */
  onClose(handler: () => void): void;

  /**
   * 健康检查
   */
  isHealthy(): boolean;
}

