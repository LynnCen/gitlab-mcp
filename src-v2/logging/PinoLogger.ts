/**
 * 基于 Pino 的日志实现
 */

import pino, { Logger as PinoLogger } from 'pino';
import type { ILogger } from './Logger.js';
import type { LogLevel, LogContext, LoggerConfig } from './types.js';

/**
 * Pino 日志实现
 */
export class PinoLogger implements ILogger {
  private readonly pino: PinoLogger;
  private level: LogLevel;

  constructor(config: LoggerConfig = {}) {
    const {
      level = 'info',
      pretty = false,
      timestamp = true,
      destination = 'stdout',
      baseContext = {},
    } = config;

    this.level = level;

    // 创建 Pino 实例
    const pinoOptions: pino.LoggerOptions = {
      level,
      timestamp: timestamp ? pino.stdTimeFunctions.isoTime : false,
      base: baseContext,
    };

    // 如果是开发环境且启用 pretty，使用 pino-pretty
    if (pretty && process.env.NODE_ENV !== 'production') {
      this.pino = pino(pinoOptions, pino.destination({
        sync: false,
        dest: destination === 'stdout' ? 1 : destination === 'stderr' ? 2 : destination,
      }));
    } else {
      this.pino = pino(pinoOptions, pino.destination({
        sync: false,
        dest: destination === 'stdout' ? 1 : destination === 'stderr' ? 2 : destination,
      }));
    }
  }

  trace(message: string, context?: LogContext): void {
    this.pino.trace(context || {}, message);
  }

  debug(message: string, context?: LogContext): void {
    this.pino.debug(context || {}, message);
  }

  info(message: string, context?: LogContext): void {
    this.pino.info(context || {}, message);
  }

  warn(message: string, context?: LogContext): void {
    this.pino.warn(context || {}, message);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error && {
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    this.pino.error(errorContext, message);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error && {
        err: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
      }),
    };
    this.pino.fatal(errorContext, message);
  }

  child(context: LogContext): ILogger {
    const childPino = this.pino.child(context);
    const child = new PinoLogger();
    (child as any).pino = childPino;
    (child as any).level = this.level;
    return child;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
    this.pino.level = level;
  }

  getLevel(): LogLevel {
    return this.level as LogLevel;
  }
}

