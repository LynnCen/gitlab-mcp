/**
 * 日志类型定义
 */

/**
 * 日志级别
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * 日志上下文
 */
export interface LogContext {
  [key: string]: any;
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /**
   * 日志级别
   */
  level?: LogLevel;

  /**
   * 是否启用彩色输出（仅开发环境）
   */
  pretty?: boolean;

  /**
   * 是否启用时间戳
   */
  timestamp?: boolean;

  /**
   * 输出目标（stdout, stderr, file）
   */
  destination?: 'stdout' | 'stderr' | string;

  /**
   * 基础上下文（所有日志都会包含这些字段）
   */
  baseContext?: LogContext;
}

/**
 * 日志记录器接口（类型别名）
 */
export interface ILogger {
  trace(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  fatal(message: string, context?: Record<string, unknown>): void;
  child?(context: Record<string, unknown>): ILogger;
}

