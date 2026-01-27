/**
 * MessageValidator 单元测试
 */

import { describe, it, expect } from 'vitest';
import { MessageValidator } from '../../../../src-v2/core/protocol/MessageValidator.js';
import type { JsonRpcMessage } from '../../../../src-v2/transport/types.js';

describe('MessageValidator', () => {
  describe('validate', () => {
    it('应该能够验证有效的请求消息', () => {
      const message: JsonRpcMessage = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
        params: { key: 'value' },
      };
      expect(MessageValidator.validate(message)).toBe(true);
    });

    it('应该能够验证有效的响应消息', () => {
      const message: JsonRpcMessage = {
        jsonrpc: '2.0',
        id: 1,
        result: { success: true },
      };
      expect(MessageValidator.validate(message)).toBe(true);
    });

    it('应该能够验证有效的错误消息', () => {
      const message: JsonRpcMessage = {
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32600,
          message: 'Invalid Request',
        },
      };
      expect(MessageValidator.validate(message)).toBe(true);
    });

    it('应该拒绝无效的消息', () => {
      expect(MessageValidator.validate({ jsonrpc: '1.0' })).toBe(false);
      expect(MessageValidator.validate({})).toBe(false);
      expect(MessageValidator.validate(null)).toBe(false);
    });
  });

  describe('parse', () => {
    it('应该能够解析有效的消息', () => {
      const message = {
        jsonrpc: '2.0',
        id: 1,
        method: 'test',
      };
      const parsed = MessageValidator.parse(message);
      expect(parsed.jsonrpc).toBe('2.0');
      expect(parsed.id).toBe(1);
      expect(parsed.method).toBe('test');
    });

    it('应该在解析无效消息时抛出错误', () => {
      expect(() => {
        MessageValidator.parse({ jsonrpc: '1.0' });
      }).toThrow('Invalid JSON-RPC message');
    });
  });

  describe('createErrorResponse', () => {
    it('应该能够创建错误响应', () => {
      const response = MessageValidator.createErrorResponse(1, -32600, 'Invalid Request');
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error?.code).toBe(-32600);
      expect(response.error?.message).toBe('Invalid Request');
    });
  });

  describe('createSuccessResponse', () => {
    it('应该能够创建成功响应', () => {
      const response = MessageValidator.createSuccessResponse(1, { success: true });
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.result).toEqual({ success: true });
    });
  });

  describe('createRequest', () => {
    it('应该能够创建请求消息', () => {
      const request = MessageValidator.createRequest(1, 'test', { key: 'value' });
      expect(request.jsonrpc).toBe('2.0');
      expect(request.id).toBe(1);
      expect(request.method).toBe('test');
      expect(request.params).toEqual({ key: 'value' });
    });
  });
});

