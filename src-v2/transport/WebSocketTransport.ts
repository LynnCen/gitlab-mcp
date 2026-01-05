/**
 * WebSocket 传输实现
 * 
 * 双向实时通信，支持心跳检测和自动重连
 */

import { WebSocketServer, WebSocket } from 'ws';
import { createServer, Server as HttpServer } from 'http';
import type { ITransport } from './Transport.js';
import type { JsonRpcMessage, TransportConfig } from './types.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * WebSocket 传输配置
 */
export interface WebSocketTransportConfig extends TransportConfig {
  /**
   * 监听端口
   */
  port?: number;

  /**
   * 监听地址
   */
  host?: string;

  /**
   * WebSocket 路径
   */
  path?: string;

  /**
   * 心跳间隔（毫秒）
   */
  heartbeatInterval?: number;

  /**
   * 重连超时（毫秒）
   */
  reconnectTimeout?: number;

  /**
   * 认证配置
   */
  auth?: {
    enabled: boolean;
    type: 'bearer' | 'api-key';
    token?: string;
    apiKey?: string;
  };
}

/**
 * WebSocket 客户端信息
 */
interface WebSocketClient {
  ws: WebSocket;
  id: string;
  lastHeartbeat: number;
  isAlive: boolean;
}

/**
 * WebSocket 传输实现
 */
export class WebSocketTransport implements ITransport {
  readonly type = 'websocket' as const;
  readonly name: string;
  private httpServer: HttpServer | null = null;
  private wss: WebSocketServer | null = null;
  private config: WebSocketTransportConfig;
  private logger?: ILogger;
  private messageHandlers: Array<(message: JsonRpcMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private closeHandlers: Array<() => void> = [];
  private clients: Map<string, WebSocketClient> = new Map();
  private started = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketTransportConfig, logger?: ILogger) {
    this.name = config.name || 'websocket';
    this.config = config;
    this.logger = logger;
  }

  /**
   * 启动传输
   */
  async start(): Promise<void> {
    if (this.started) {
      return;
    }

    const port = this.config.port || 3001;
    const host = this.config.host || '0.0.0.0';
    const path = this.config.path || '/mcp';

    // 创建 HTTP 服务器
    this.httpServer = createServer();

    // 创建 WebSocket 服务器
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path,
    });

    // 处理连接
    this.wss.on('connection', (ws: WebSocket, request) => {
      this.handleConnection(ws, request);
    });

    // 启动心跳检测
    this.startHeartbeat();

    // 启动服务器
    return new Promise((resolve, reject) => {
      if (!this.httpServer) {
        reject(new Error('HTTP server not initialized'));
        return;
      }

      this.httpServer.listen(port, host, () => {
        this.started = true;
        this.logger?.info(`WebSocket transport started on ${host}:${port}${path}`);
        resolve();
      });

      this.httpServer.on('error', (error) => {
        this.logger?.error('WebSocket transport error', error);
        reject(error);
      });
    });
  }

  /**
   * 处理连接
   */
  private handleConnection(ws: WebSocket, request: any): void {
    // 认证检查
    if (!this.checkAuth(request)) {
      ws.close(1008, 'Unauthorized');
      return;
    }

    const clientId = this.generateClientId();
    const client: WebSocketClient = {
      ws,
      id: clientId,
      lastHeartbeat: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);
    this.logger?.info(`WebSocket client connected: ${clientId}`);

    // 处理消息
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as JsonRpcMessage;
        this.handleMessage(message, clientId);
      } catch (error) {
        this.logger?.error('Failed to parse WebSocket message', error as Error);
        this.sendError(clientId, -32700, 'Parse error');
      }
    });

    // 处理心跳
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastHeartbeat = Date.now();
      }
    });

    // 处理关闭
    ws.on('close', () => {
      this.clients.delete(clientId);
      this.logger?.info(`WebSocket client disconnected: ${clientId}`);
    });

    // 处理错误
    ws.on('error', (error) => {
      this.logger?.error(`WebSocket client error (${clientId}):`, error);
      this.errorHandlers.forEach((handler) => handler(error));
    });

    // 发送欢迎消息
    this.sendToClient(clientId, {
      jsonrpc: '2.0',
      id: undefined,
      result: { type: 'connected', clientId },
    });
  }

  /**
   * 检查认证
   */
  private checkAuth(request: any): boolean {
    if (!this.config.auth?.enabled) {
      return true;
    }

    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    const apiKey = url.searchParams.get('apiKey');

    if (this.config.auth.type === 'bearer') {
      return token === this.config.auth.token;
    }

    if (this.config.auth.type === 'api-key') {
      return apiKey === this.config.auth.apiKey;
    }

    return false;
  }

  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return `ws-client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理消息
   */
  private handleMessage(message: JsonRpcMessage, clientId: string): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        this.errorHandlers.forEach((errorHandler) => {
          errorHandler(error as Error);
        });
      }
    });
  }

  /**
   * 发送消息给特定客户端
   */
  private sendToClient(clientId: string, message: JsonRpcMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * 发送错误消息
   */
  private sendError(clientId: string, code: number, message: string): void {
    this.sendToClient(clientId, {
      jsonrpc: '2.0',
      id: undefined,
      error: { code, message },
    });
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000; // 默认 30 秒

    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (!client.isAlive) {
          // 客户端未响应心跳，关闭连接
          this.logger?.warn(`Client ${clientId} did not respond to heartbeat, closing connection`);
          client.ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        // 标记为待检测
        client.isAlive = false;
        client.ws.ping();
      });
    }, interval);
  }

  /**
   * 停止传输
   */
  async stop(): Promise<void> {
    if (!this.started) {
      return;
    }

    // 停止心跳检测
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // 关闭所有客户端连接
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();

    // 关闭 WebSocket 服务器
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    // 关闭 HTTP 服务器
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          this.httpServer = null;
          this.started = false;
          this.logger?.info('WebSocket transport stopped');
          this.closeHandlers.forEach((handler) => handler());
          resolve();
        });
      });
    }

    this.started = false;
  }

  /**
   * 发送消息
   */
  async send(message: JsonRpcMessage): Promise<void> {
    if (!this.started) {
      throw new Error('Transport is not started');
    }

    // 发送给所有连接的客户端
    const data = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    });
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
    return this.started && this.wss !== null && this.httpServer !== null;
  }

  /**
   * 获取连接的客户端数量
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

