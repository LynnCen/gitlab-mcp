/**
 * 传输管理器
 */

import type { ITransport } from './Transport.js';
import type { TransportType } from './types.js';

/**
 * 传输管理器
 */
export class TransportManager {
  private transports: Map<TransportType, ITransport> = new Map();

  /**
   * 注册传输
   */
  registerTransport(transport: ITransport): void {
    if (this.transports.has(transport.type)) {
      throw new Error(`Transport of type '${transport.type}' is already registered`);
    }
    this.transports.set(transport.type, transport);
  }

  /**
   * 启动所有传输
   */
  async startAll(): Promise<void> {
    const startPromises = Array.from(this.transports.values()).map((transport) =>
      transport.start().catch((error) => {
        console.error(`Failed to start transport ${transport.name}:`, error);
        throw error;
      })
    );
    await Promise.all(startPromises);
  }

  /**
   * 停止所有传输
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.transports.values()).map((transport) =>
      transport.stop().catch((error) => {
        console.error(`Failed to stop transport ${transport.name}:`, error);
      })
    );
    await Promise.all(stopPromises);
  }

  /**
   * 获取指定传输
   */
  getTransport(type: TransportType): ITransport | undefined {
    return this.transports.get(type);
  }

  /**
   * 获取所有传输
   */
  getAllTransports(): ITransport[] {
    return Array.from(this.transports.values());
  }

  /**
   * 检查传输是否已注册
   */
  hasTransport(type: TransportType): boolean {
    return this.transports.has(type);
  }

  /**
   * 注销传输
   */
  unregisterTransport(type: TransportType): void {
    this.transports.delete(type);
  }
}

