/**
 * HTTP + SSE 传输实现
 * 
 * 使用 HTTP POST 接收请求，Server-Sent Events 推送响应
 */

import fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import type { ITransport } from './Transport.js';
import type { JsonRpcMessage, TransportConfig } from './types.js';
import type { ILogger } from '../logging/Logger.js';

/**
 * HTTP 传输配置
 */
export interface HttpTransportConfig extends TransportConfig {
  /**
   * 监听端口
   */
  port?: number;

  /**
   * 监听地址
   */
  host?: string;

  /**
   * CORS 配置
   */
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };

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
 * HTTP 传输实现
 */
export class HttpTransport implements ITransport {
  readonly type = 'http' as const;
  readonly name: string;
  private app: FastifyInstance | null = null;
  private config: HttpTransportConfig;
  private logger?: ILogger;
  private messageHandlers: Array<(message: JsonRpcMessage) => void> = [];
  private errorHandlers: Array<(error: Error) => void> = [];
  private closeHandlers: Array<() => void> = [];
  private started = false;
  private sseClients: Map<string, FastifyReply> = new Map();

  constructor(config: HttpTransportConfig, logger?: ILogger) {
    this.name = config.name || 'http';
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

    this.app = fastify({ logger: false });

    // 注册 CORS
    if (this.config.cors) {
      await this.app.register(cors, {
        origin: this.config.cors.origin || '*',
        credentials: this.config.cors.credentials || false,
      });
    }

    // 注册路由
    this.registerRoutes();

    // 启动服务器
    const port = this.config.port || 3000;
    const host = this.config.host || '0.0.0.0';

    try {
      await this.app.listen({ port, host });
      this.started = true;
      this.logger?.info(`HTTP transport started on ${host}:${port}`);
    } catch (error) {
      this.logger?.error('Failed to start HTTP transport', error as Error);
      throw error;
    }
  }

  /**
   * 注册路由
   */
  private registerRoutes(): void {
    if (!this.app) {
      return;
    }

    // POST /mcp/messages - 接收客户端消息
    this.app.post('/mcp/messages', async (request: FastifyRequest, reply: FastifyReply) => {
      // 认证检查
      if (!this.checkAuth(request)) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const message = request.body as JsonRpcMessage;
      this.handleMessage(message);

      return reply.send({ success: true });
    });

    // GET /mcp/stream - SSE 事件流
    this.app.get('/mcp/stream', async (request: FastifyRequest, reply: FastifyReply) => {
      // 认证检查
      if (!this.checkAuth(request)) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      // 设置 SSE 响应头
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      const clientId = this.generateClientId();
      this.sseClients.set(clientId, reply);

      // 连接关闭时清理
      request.raw.on('close', () => {
        this.sseClients.delete(clientId);
      });

      // 发送初始连接消息
      reply.raw.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);
    });

    // GET /health - 健康检查
    this.app.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ status: 'ok', transport: 'http' });
    });
  }

  /**
   * 检查认证
   */
  private checkAuth(request: FastifyRequest): boolean {
    if (!this.config.auth?.enabled) {
      return true;
    }

    const authHeader = request.headers.authorization;

    if (this.config.auth.type === 'bearer') {
      const token = authHeader?.replace('Bearer ', '');
      return token === this.config.auth.token;
    }

    if (this.config.auth.type === 'api-key') {
      const apiKey = request.headers['x-api-key'] as string;
      return apiKey === this.config.auth.apiKey;
    }

    return false;
  }

  /**
   * 生成客户端 ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 处理消息
   */
  private handleMessage(message: JsonRpcMessage): void {
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
   * 停止传输
   */
  async stop(): Promise<void> {
    if (!this.started || !this.app) {
      return;
    }

    // 关闭所有 SSE 连接
    this.sseClients.forEach((reply) => {
      reply.raw.end();
    });
    this.sseClients.clear();

    // 关闭服务器
    await this.app.close();
    this.started = false;
    this.logger?.info('HTTP transport stopped');

    this.closeHandlers.forEach((handler) => handler());
  }

  /**
   * 发送消息
   */
  async send(message: JsonRpcMessage): Promise<void> {
    if (!this.started) {
      throw new Error('Transport is not started');
    }

    // 通过 SSE 发送消息给所有连接的客户端
    const data = `data: ${JSON.stringify(message)}\n\n`;
    this.sseClients.forEach((reply) => {
      try {
        reply.raw.write(data);
      } catch (error) {
        this.logger?.error('Failed to send SSE message', error as Error);
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
    return this.started && this.app !== null;
  }
}

