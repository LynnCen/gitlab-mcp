import { SSETransportAdapter, SSEConnection } from '../mcp/transport/SSETransportAdapter.js';

/**
 * 连接事件类型
 */
export type ConnectionEvent = 'connected' | 'disconnected' | 'error' | 'message';

/**
 * 连接事件监听器
 */
export interface ConnectionEventListener {
  onConnectionEvent(event: ConnectionEvent, connection: SSEConnection, data?: any): void;
}

/**
 * 连接管理器 - 观察者模式
 * 管理 SSE 连接生命周期并通知观察者
 */
export class ConnectionManager {
  private listeners: Set<ConnectionEventListener> = new Set();
  private sseAdapter: SSETransportAdapter;

  constructor(sseAdapter: SSETransportAdapter) {
    this.sseAdapter = sseAdapter;
  }

  /**
   * 添加事件监听器
   */
  addListener(listener: ConnectionEventListener): void {
    this.listeners.add(listener);
  }

  /**
   * 移除事件监听器
   */
  removeListener(listener: ConnectionEventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(event: ConnectionEvent, connection: SSEConnection, data?: any): void {
    for (const listener of this.listeners) {
      try {
        listener.onConnectionEvent(event, connection, data);
      } catch (error) {
        console.error('连接事件监听器错误:', error);
      }
    }
  }

  /**
   * 创建新连接
   */
  createConnection(response: any): SSEConnection {
    const connection = this.sseAdapter.createConnection(response);
    
    // 通知连接建立
    this.notifyListeners('connected', connection);
    
    console.log(`新 SSE 连接建立: ${connection.id}`);
    return connection;
  }

  /**
   * 获取连接
   */
  getConnection(id: string): SSEConnection | undefined {
    return this.sseAdapter.getConnection(id);
  }

  /**
   * 移除连接
   */
  removeConnection(id: string): boolean {
    const connection = this.sseAdapter.getConnection(id);
    const removed = this.sseAdapter.removeConnection(id);
    
    if (removed && connection) {
      // 通知连接断开
      this.notifyListeners('disconnected', connection);
      console.log(`SSE 连接断开: ${id}`);
    }
    
    return removed;
  }

  /**
   * 处理连接错误
   */
  handleConnectionError(connectionId: string, error: any): void {
    const connection = this.sseAdapter.getConnection(connectionId);
    if (connection) {
      // 通知连接错误
      this.notifyListeners('error', connection, error);
      console.error(`SSE 连接错误 [${connectionId}]:`, error);
    }
  }

  /**
   * 处理连接消息
   */
  handleConnectionMessage(connectionId: string, message: any): void {
    const connection = this.sseAdapter.getConnection(connectionId);
    if (connection) {
      // 通知消息接收
      this.notifyListeners('message', connection, message);
    }
  }

  /**
   * 广播消息
   */
  broadcast(message: any): void {
    this.sseAdapter.broadcast(message);
  }

  /**
   * 发送消息到指定连接
   */
  sendToConnection(connectionId: string, message: any): boolean {
    return this.sseAdapter.sendToConnection(connectionId, message);
  }

  /**
   * 获取所有连接
   */
  getAllConnections(): SSEConnection[] {
    return this.sseAdapter.getAllConnections();
  }

  /**
   * 获取连接数量
   */
  getConnectionCount(): number {
    return this.sseAdapter.getConnectionCount();
  }

  /**
   * 获取连接统计信息
   */
  getStats(): {
    totalConnections: number;
    activeConnections: number;
    averageConnectionTime: number;
    listeners: number;
  } {
    const sseStats = this.sseAdapter.getStats();
    return {
      ...sseStats,
      listeners: this.listeners.size,
    };
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    const connections = this.getAllConnections();
    
    for (const connection of connections) {
      this.notifyListeners('disconnected', connection);
    }
    
    this.sseAdapter.closeAllConnections();
    console.log('所有 SSE 连接已关闭');
  }

  /**
   * 检查连接健康状态
   */
  checkConnectionHealth(): {
    healthy: SSEConnection[];
    unhealthy: SSEConnection[];
  } {
    const connections = this.getAllConnections();
    const healthy: SSEConnection[] = [];
    const unhealthy: SSEConnection[] = [];

    for (const connection of connections) {
      if (connection.response.destroyed) {
        unhealthy.push(connection);
      } else {
        healthy.push(connection);
      }
    }

    // 清理不健康的连接
    for (const connection of unhealthy) {
      this.removeConnection(connection.id);
    }

    return { healthy, unhealthy };
  }
}

/**
 * 默认连接事件监听器
 */
export class DefaultConnectionListener implements ConnectionEventListener {
  onConnectionEvent(event: ConnectionEvent, connection: SSEConnection, data?: any): void {
    const timestamp = new Date().toISOString();
    const baseInfo = `[${timestamp}] 连接 ${connection.id}`;

    switch (event) {
      case 'connected':
        console.log(`${baseInfo} 已连接`);
        break;
      case 'disconnected':
        console.log(`${baseInfo} 已断开`);
        break;
      case 'error':
        console.error(`${baseInfo} 发生错误:`, data);
        break;
      case 'message':
        console.log(`${baseInfo} 收到消息`);
        break;
    }
  }
} 