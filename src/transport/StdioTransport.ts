/**
 * Stdio 传输实现
 * 
 * 基于 MCP SDK 的 StdioServerTransport
 */

import { StdioServerTransport as McpStdioTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ITransport } from './Transport.js';
import type { JsonRpcMessage } from './types.js';

/**
 * Stdio 传输实现
 */
export class StdioTransport implements ITransport {
  readonly type = 'stdio' as const;
  readonly name: string;
  private transport: McpStdioTransport;
  private messageHandlers: Array<(message: JsonRpcMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private closeHandlers: Array<() => void> = [];
  private started = false;

  constructor(name = 'stdio') {
    this.name = name;
    this.transport = new McpStdioTransport();
  }

  /**
   * 启动传输
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    // StdioTransport 在创建时就已经准备好了
    // 这里主要是标记为已启动
    this.started = true;
  }

  /**
   * 停止传输
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    // StdioTransport 无法真正停止，只能标记为已停止
    this.started = false;
    this.closeHandlers.forEach((handler) => handler());
  }

  /**
   * 发送消息
   */
  async send(message: JsonRpcMessage): Promise<void> {
    if (!this.started) {
      throw new Error('Transport is not started');
    }

    // StdioTransport 的消息发送由 MCP SDK 处理
    // 这里只是接口实现，实际发送需要通过 MCP Server
    throw new Error('StdioTransport.send() should not be called directly. Use MCP Server instead.');
  }

  /**
   * 接收消息事件
   */
  onMessage(handler: (message: JsonRpcMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  /**
   * 错误事件
   */
  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * 关闭事件
   */
  onClose(handler: () => void): void {
    this.closeHandlers.push(handler);
  }

  /**
   * 健康检查
   */
  isHealthy(): boolean {
    return this.started;
  }

  /**
   * 获取底层 MCP Transport（用于与 MCP Server 连接）
   */
  getMcpTransport(): McpStdioTransport {
    return this.transport;
  }
}

