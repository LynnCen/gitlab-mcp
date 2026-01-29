/**
 * PinoLogger 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PinoLogger } from '../../../../src-v2/logging/PinoLogger.js';
import type { LoggerConfig } from '../../../../src-v2/logging/types.js';

describe('PinoLogger', () => {
  let logger: PinoLogger;

  beforeEach(() => {
    logger = new PinoLogger({ level: 'debug' });
  });

  describe('日志级别方法', () => {
    it('应该能够记录 trace 日志', () => {
      expect(() => logger.trace('trace message')).not.toThrow();
    });

    it('应该能够记录 debug 日志', () => {
      expect(() => logger.debug('debug message')).not.toThrow();
    });

    it('应该能够记录 info 日志', () => {
      expect(() => logger.info('info message')).not.toThrow();
    });

    it('应该能够记录 warn 日志', () => {
      expect(() => logger.warn('warn message')).not.toThrow();
    });

    it('应该能够记录 error 日志', () => {
      expect(() => logger.error('error message')).not.toThrow();
    });

    it('应该能够记录 error 日志（带错误对象）', () => {
      const error = new Error('test error');
      expect(() => logger.error('error message', error)).not.toThrow();
    });

    it('应该能够记录 fatal 日志', () => {
      expect(() => logger.fatal('fatal message')).not.toThrow();
    });

    it('应该能够记录 fatal 日志（带错误对象）', () => {
      const error = new Error('test error');
      expect(() => logger.fatal('fatal message', error)).not.toThrow();
    });
  });

  describe('上下文', () => {
    it('应该能够记录带上下文的日志', () => {
      expect(() => {
        logger.info('info message', { userId: '123', action: 'test' });
      }).not.toThrow();
    });
  });

  describe('child', () => {
    it('应该能够创建子 logger', () => {
      const child = logger.child({ userId: '123' });
      expect(child).toBeInstanceOf(PinoLogger);
      expect(() => child.info('child message')).not.toThrow();
    });

    it('子 logger 应该继承父 logger 的配置', () => {
      const child = logger.child({ userId: '123' });
      expect(child.getLevel()).toBe(logger.getLevel());
    });
  });

  describe('setLevel', () => {
    it('应该能够设置日志级别', () => {
      logger.setLevel('warn');
      expect(logger.getLevel()).toBe('warn');
    });
  });

  describe('getLevel', () => {
    it('应该能够获取日志级别', () => {
      expect(logger.getLevel()).toBe('debug');
    });
  });

  describe('配置', () => {
    it('应该能够使用自定义配置创建 logger', () => {
      const config: LoggerConfig = {
        level: 'error',
        pretty: false,
        timestamp: true,
      };
      const customLogger = new PinoLogger(config);
      expect(customLogger.getLevel()).toBe('error');
    });

    it('应该能够使用默认配置创建 logger', () => {
      const defaultLogger = new PinoLogger();
      expect(defaultLogger.getLevel()).toBe('info'); // 默认级别
    });
  });
});

