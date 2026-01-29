/**
 * ToolRegistry 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { ToolRegistry } from '../../../../../src-v2/capabilities/tools/ToolRegistry.js';
import type { ITool, ExecutionContext } from '../../../../../src-v2/capabilities/tools/types.js';

// 测试工具实现
class TestTool implements ITool {
  readonly name = 'test-tool';
  readonly description = 'Test tool';
  readonly inputSchema = z.object({
    message: z.string(),
  });
  readonly metadata = {
    category: 'test',
    tags: ['test', 'demo'],
  };

  async execute(params: any, context: ExecutionContext) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Echo: ${params.message}`,
        },
      ],
    };
  }
}

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let tool: ITool;

  beforeEach(() => {
    registry = new ToolRegistry();
    tool = new TestTool();
  });

  it('应该能够注册工具', () => {
    registry.registerTool(tool);
    expect(registry.hasTool('test-tool')).toBe(true);
  });

  it('应该能够在重复注册时抛出错误', () => {
    registry.registerTool(tool);
    expect(() => {
      registry.registerTool(tool);
    }).toThrow("Tool 'test-tool' is already registered");
  });

  it('应该能够获取已注册的工具', () => {
    registry.registerTool(tool);
    const retrieved = registry.getTool('test-tool');
    expect(retrieved).toBe(tool);
  });

  it('应该能够注销工具', () => {
    registry.registerTool(tool);
    registry.unregisterTool('test-tool');
    expect(registry.hasTool('test-tool')).toBe(false);
  });

  it('应该能够列出所有工具', () => {
    registry.registerTool(tool);
    const tools = registry.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].name).toBe('test-tool');
  });

  it('应该能够按类别过滤工具', () => {
    registry.registerTool(tool);
    const tools = registry.listTools({ category: 'test' });
    expect(tools).toHaveLength(1);
  });

  it('应该能够执行工具', async () => {
    registry.registerTool(tool);
    const context: ExecutionContext = {
      traceId: 'trace-1',
      requestId: 'req-1',
      startTime: Date.now(),
      metadata: new Map(),
    };
    const result = await registry.executeTool('test-tool', { message: 'Hello' }, context);
    expect(result.content[0].text).toBe('Echo: Hello');
  });

  it('应该在执行不存在的工具时抛出错误', async () => {
    const context: ExecutionContext = {
      traceId: 'trace-1',
      requestId: 'req-1',
      startTime: Date.now(),
      metadata: new Map(),
    };
    await expect(
      registry.executeTool('non-existent', {}, context)
    ).rejects.toThrow("Tool 'non-existent' not found");
  });

  it('应该验证工具参数', async () => {
    registry.registerTool(tool);
    const context: ExecutionContext = {
      traceId: 'trace-1',
      requestId: 'req-1',
      startTime: Date.now(),
      metadata: new Map(),
    };
    await expect(
      registry.executeTool('test-tool', { invalid: 'param' }, context)
    ).rejects.toThrow('Invalid parameters');
  });
});

