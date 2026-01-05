/**
 * JSON-RPC 消息验证器
 */

import { z } from 'zod';
import type { JsonRpcMessage, JsonRpcError } from '../../transport/types.js';

/**
 * JSON-RPC 消息 Schema
 */
const JsonRpcMessageSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]).optional(),
  method: z.string().optional(),
  params: z.any().optional(),
  result: z.any().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.any().optional(),
    })
    .optional(),
});

/**
 * 消息验证器
 */
export class MessageValidator {
  /**
   * 验证消息格式
   */
  static validate(message: unknown): message is JsonRpcMessage {
    try {
      JsonRpcMessageSchema.parse(message);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证并解析消息
   */
  static parse(message: unknown): JsonRpcMessage {
    const result = JsonRpcMessageSchema.safeParse(message);
    if (!result.success) {
      throw new Error(`Invalid JSON-RPC message: ${result.error.message}`);
    }
    return result.data;
  }

  /**
   * 创建错误响应
   */
  static createErrorResponse(
    id: string | number | undefined,
    code: number,
    message: string,
    data?: any
  ): JsonRpcMessage {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message,
        data,
      },
    };
  }

  /**
   * 创建成功响应
   */
  static createSuccessResponse(id: string | number | undefined, result: any): JsonRpcMessage {
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  }

  /**
   * 创建请求消息
   */
  static createRequest(id: string | number, method: string, params?: any): JsonRpcMessage {
    return {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };
  }
}

