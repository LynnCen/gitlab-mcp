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

