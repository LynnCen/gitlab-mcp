import { Response } from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

/**
 * SSE 连接信息
 */
export interface SSEConnection {
  id: string;
  transport: SSEServerTransport;
  response: Response;
  connectedAt: Date;
  lastActivity: Date;
}

/**
 * SSE 传输适配器 - 适配器模式
 * 适配 MCP SDK 的 SSE 传输和 Express 响应
 */
export class SSETransportAdapter {
  private connections: Map<string, SSEConnection> = new Map();
  private connectionTimeout: number = 30 * 60 * 1000; // 30 分钟超时

  constructor() {
    // 定期清理超时连接
    setInterval(() => {
      this.cleanupExpiredConnections();
    }, 5 * 60 * 1000); // 每5分钟检查一次
  }

  /**
   * 创建 SSE 连接
   */
  createConnection(response: Response): SSEConnection {
    const transport = new SSEServerTransport('/message', response);
    const connection: SSEConnection = {
      id: transport.sessionId,
      transport,
      response,
      connectedAt: new Date(),
      lastActivity: new Date(),
    };

    this.connections.set(connection.id, connection);

    // 监听连接关闭
    response.on('close', () => {
      this.removeConnection(connection.id);
    });

    // 监听错误
    response.on('error', (error) => {
      console.error(`SSE 连接错误 [${connection.id}]:`, error);
      this.removeConnection(connection.id);
    });

    return connection;
  }

  /**
   * 获取连接
   */
  getConnection(id: string): SSEConnection | undefined {
    const connection = this.connections.get(id);
    if (connection) {
      // 更新最后活动时间
      connection.lastActivity = new Date();
    }
    return connection;
  }

  /**
   * 移除连接
   */
  removeConnection(id: string): boolean {
    const connection = this.connections.get(id);
    if (connection) {
      // 确保响应已关闭
      if (!connection.response.destroyed) {
        connection.response.end();
      }
      this.connections.delete(id);
      return true;
    }
    return false;
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): SSEConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 清理过期连接
   */
  private cleanupExpiredConnections(): void {
    const now = new Date();
    const expiredConnections: string[] = [];

    for (const [id, connection] of this.connections) {
      const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime();
      
      if (timeSinceLastActivity > this.connectionTimeout) {
        expiredConnections.push(id);
      }
    }

    for (const id of expiredConnections) {
      console.log(`清理过期 SSE 连接: ${id}`);
      this.removeConnection(id);
    }
  }

  /**
   * 广播消息到所有连接
   */
  broadcast(message: any): void {
    const messageStr = JSON.stringify(message);
    
    for (const connection of this.connections.values()) {
      try {
        if (!connection.response.destroyed) {
          connection.response.write(`data: ${messageStr}\n\n`);
          connection.lastActivity = new Date();
        }
      } catch (error) {
        console.error(`广播消息失败 [${connection.id}]:`, error);
        this.removeConnection(connection.id);
      }
    }
  }

  /**
   * 发送消息到指定连接
   */
  sendToConnection(connectionId: string, message: any): boolean {
    const connection = this.getConnection(connectionId);
    if (!connection || connection.response.destroyed) {
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      connection.response.write(`data: ${messageStr}\n\n`);
      return true;
    } catch (error) {
      console.error(`发送消息失败 [${connectionId}]:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * 获取连接统计信息
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    averageConnectionTime: number;
  } {
    const now = new Date();
    let totalConnectionTime = 0;
    let activeConnections = 0;

    for (const connection of this.connections.values()) {
      if (!connection.response.destroyed) {
        activeConnections++;
        totalConnectionTime += now.getTime() - connection.connectedAt.getTime();
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections,
      averageConnectionTime: activeConnections > 0 ? totalConnectionTime / activeConnections : 0,
    };
  }

  /**
   * 设置连接超时时间
   */
  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    const connectionIds = Array.from(this.connections.keys());
    for (const id of connectionIds) {
      this.removeConnection(id);
    }
  }
} 