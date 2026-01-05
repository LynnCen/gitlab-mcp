/**
 * ProtocolErrorHandler 单元测试
 */

import { describe, it, expect } from 'vitest';
import { ProtocolErrorHandler, JsonRpcErrorCode } from '../../../../src-v2/core/protocol/ProtocolErrorHandler.js';
import { BusinessError } from '../../../../src-v2/errors/BusinessError.js';
import { SystemError } from '../../../../src-v2/errors/SystemError.js';
import { ErrorCodes } from '../../../../src-v2/errors/ErrorCode.js';

describe('ProtocolErrorHandler', () => {
  describe('toJsonRpcError', () => {
    it('应该能够将 BaseError 转换为 JSON-RPC 错误', () => {
      const error = new BusinessError(ErrorCodes.VALIDATION_INVALID_PARAMS, 'Invalid params');
      const response = ProtocolErrorHandler.toJsonRpcError(error, 1);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(JsonRpcErrorCode.InvalidParams);
      expect(response.error?.message).toBe('Invalid params');
    });

    it('应该能够将标准 Error 转换为 JSON-RPC 错误', () => {
      const error = new Error('Test error');
      const response = ProtocolErrorHandler.toJsonRpcError(error, 1);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error?.code).toBe(JsonRpcErrorCode.InternalError);
      expect(response.error?.message).toBe('Test error');
    });

    it('应该能够处理未知错误类型', () => {
      const response = ProtocolErrorHandler.toJsonRpcError('Unknown error', 1);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(1);
      expect(response.error?.code).toBe(JsonRpcErrorCode.InternalError);
    });
  });

  describe('createParseError', () => {
    it('应该能够创建解析错误响应', () => {
      const response = ProtocolErrorHandler.createParseError();
      expect(response.error?.code).toBe(JsonRpcErrorCode.ParseError);
    });
  });

  describe('createInvalidRequest', () => {
    it('应该能够创建无效请求错误响应', () => {
      const response = ProtocolErrorHandler.createInvalidRequest(1);
      expect(response.error?.code).toBe(JsonRpcErrorCode.InvalidRequest);
    });
  });

  describe('createMethodNotFound', () => {
    it('应该能够创建方法未找到错误响应', () => {
      const response = ProtocolErrorHandler.createMethodNotFound('testMethod', 1);
      expect(response.error?.code).toBe(JsonRpcErrorCode.MethodNotFound);
      expect(response.error?.message).toContain('testMethod');
    });
  });

  describe('createInvalidParams', () => {
    it('应该能够创建无效参数错误响应', () => {
      const response = ProtocolErrorHandler.createInvalidParams('Invalid params', 1);
      expect(response.error?.code).toBe(JsonRpcErrorCode.InvalidParams);
      expect(response.error?.message).toBe('Invalid params');
    });
  });
});

