/**
 * 基于 Pino 的日志实现
 */

import pino from 'pino';
import type { Logger as PinoLoggerInstance } from 'pino';
import type { ILogger } from './Logger.js';
import type { LogLevel, LogContext, LoggerConfig } from './types.js';

/**
 * Pino 日志实现
 */
export class PinoLogger implements ILogger {
  private _pino: PinoLoggerInstance;
  private _level: LogLevel;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      pretty = false,
      timestamp = true,
      destination = 'stderr', // MCP 协议要求：日志必须输出到 stderr，stdout 仅用于 JSON-RPC 消息
      baseContext = {},
    } = config;

    this._level = level;

    // 创建 Pino 实例
    const pinoOptions: pino.LoggerOptions = {
      level,
      timestamp: timestamp ? pino.stdTimeFunctions.isoTime : false,
      base: baseContext,
    };

    // 确定输出目标
    const destValue = destination === 'stdout' ? 1 : destination === 'stderr' ? 2 : destination;

    // 如果是开发环境且启用 pretty，使用 pino-pretty
    if (pretty && process.env.NODE_ENV !== 'production') {
      this._pino = pino(pinoOptions, pino.destination({
        sync: false,
        dest: destValue,
      }));
    } else {
      this._pino = pino(pinoOptions, pino.destination({
        sync: false,
        dest: destValue,
      }));
    }
  }

  /**
   * 内部构造器，用于 child logger
   */
  private static createChild(pinoInstance: PinoLoggerInstance, level: LogLevel): PinoLogger {
    const child = Object.create(PinoLogger.prototype) as PinoLogger;
    child._pino = pinoInstance;
    child._level = level;
    return child;
  }

  trace(message: string, context?: LogContext): void {
    this._pino.trace(context || {}, message);
  }

  debug(message: string, context?: LogContext): void {
    this._pino.debug(context || {}, message);
  }

  info(message: string, context?: LogContext): void {
    this._pino.info(context || {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this._pino.warn(context || {}, message);
  }

  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    let finalContext: LogContext = {};
    
    if (errorOrContext instanceof Error) {
      finalContext = {
        ...context,
        err: {
          message: errorOrContext.message,
          stack: errorOrContext.stack,
          name: errorOrContext.name,
        },
      };
    } else if (errorOrContext) {
      finalContext = errorOrContext;
    }
    
    this._pino.error(finalContext, message);
  }

  fatal(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    let finalContext: LogContext = {};
    
    if (errorOrContext instanceof Error) {
      finalContext = {
        ...context,
        err: {
          message: errorOrContext.message,
          stack: errorOrContext.stack,
          name: errorOrContext.name,
        },
      };
    } else if (errorOrContext) {
      finalContext = errorOrContext;
    }
    
    this._pino.fatal(finalContext, message);
  }

  child(context: LogContext): ILogger {
    const childPino = this._pino.child(context);
    return PinoLogger.createChild(childPino, this._level);
  }

  setLevel(level: LogLevel): void {
    this._level = level;
    this._pino.level = level;
  }

  getLevel(): LogLevel {
    return this._level;
  }
}

