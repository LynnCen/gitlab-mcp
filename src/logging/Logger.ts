/**
 * 日志接口
 */

import type { LogLevel, LogContext } from './types.js';

/**
 * Logger 接口
 */
export interface ILogger {
  /**
   * 记录 trace 级别日志
   */
  trace(message: string, context?: LogContext): void;

  /**
   * 记录 debug 级别日志
   */
  debug(message: string, context?: LogContext): void;

  /**
   * 记录 info 级别日志
   */
  info(message: string, context?: LogContext): void;

  /**
   * 记录 warn 级别日志
   */
  warn(message: string, context?: LogContext): void;

  /**
   * 记录 error 级别日志
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * 记录 fatal 级别日志
   */
  fatal(message: string, error?: Error, context?: LogContext): void;

  /**
   * 创建子 logger（带上下文）
   */
  child(context: LogContext): ILogger;

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void;

  /**
   * 获取日志级别
   */
  getLevel(): LogLevel;
}

