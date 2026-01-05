/**
 * 协议错误处理器
 */

import type { JsonRpcMessage } from '../../transport/types.js';
import { MessageValidator } from './MessageValidator.js';
import type { BaseError } from '../../errors/BaseError.js';
import { ErrorCodes } from '../../errors/ErrorCode.js';

/**
 * JSON-RPC 错误码
 */
export enum JsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000,
}

/**
 * 协议错误处理器
 */
export class ProtocolErrorHandler {
  /**
   * 将错误转换为 JSON-RPC 错误响应
   */
  static toJsonRpcError(error: unknown, requestId?: string | number): JsonRpcMessage {
    // 如果是 BaseError，使用其错误码
    if (error instanceof Error && 'code' in error) {
      const baseError = error as BaseError;
      return MessageValidator.createErrorResponse(
        requestId,
        this.mapErrorCodeToJsonRpc(baseError.code),
        baseError.message,
        baseError.details
      );
    }

    // 如果是标准 Error
    if (error instanceof Error) {
      return MessageValidator.createErrorResponse(
        requestId,
        JsonRpcErrorCode.InternalError,
        error.message,
        { stack: error.stack }
      );
    }

    // 未知错误
    return MessageValidator.createErrorResponse(
      requestId,
      JsonRpcErrorCode.InternalError,
      'An unknown error occurred',
      { error: String(error) }
    );
  }

  /**
   * 将业务错误码映射到 JSON-RPC 错误码
   */
  private static mapErrorCodeToJsonRpc(code: string): number {
    // 业务错误使用 -32000 到 -32099
    if (code.startsWith('VALIDATION_')) {
      return JsonRpcErrorCode.InvalidParams;
    }
    if (code.startsWith('NOT_FOUND_')) {
      return JsonRpcErrorCode.MethodNotFound;
    }
    if (code.startsWith('CONFIGURATION_')) {
      return JsonRpcErrorCode.ServerError;
    }
    if (code.startsWith('GITLAB_')) {
      return JsonRpcErrorCode.ServerError;
    }

    // 默认内部错误
    return JsonRpcErrorCode.InternalError;
  }

  /**
   * 创建解析错误响应
   */
  static createParseError(): JsonRpcMessage {
    return MessageValidator.createErrorResponse(
      null,
      JsonRpcErrorCode.ParseError,
      'Parse error'
    );
  }

  /**
   * 创建无效请求错误响应
   */
  static createInvalidRequest(requestId?: string | number): JsonRpcMessage {
    return MessageValidator.createErrorResponse(
      requestId,
      JsonRpcErrorCode.InvalidRequest,
      'Invalid Request'
    );
  }

  /**
   * 创建方法未找到错误响应
   */
  static createMethodNotFound(method: string, requestId?: string | number): JsonRpcMessage {
    return MessageValidator.createErrorResponse(
      requestId,
      JsonRpcErrorCode.MethodNotFound,
      `Method not found: ${method}`
    );
  }

  /**
   * 创建无效参数错误响应
   */
  static createInvalidParams(message: string, requestId?: string | number): JsonRpcMessage {
    return MessageValidator.createErrorResponse(
      requestId,
      JsonRpcErrorCode.InvalidParams,
      message
    );
  }
}

