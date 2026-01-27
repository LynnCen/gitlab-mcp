/**
 * PromptRegistry 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PromptRegistry } from '../../../../src-v2/capabilities/prompts/PromptRegistry.js';
import { Prompt } from '../../../../src-v2/capabilities/prompts/Prompt.js';
import type { PromptArgument } from '../../../../src-v2/capabilities/prompts/types.js';

// Mock Prompt
class MockPrompt extends Prompt {
  readonly name = 'mock-prompt';
  readonly description = 'Test prompt';
  readonly template = 'mock-template';
  readonly version = '1.0.0';
  readonly arguments: PromptArgument[] = [
    {
      name: 'test',
      description: 'Test argument',
      required: true,
      type: 'string',
    },
  ];

  constructor() {
    super();
  }

  async render(args: Record<string, unknown>): Promise<string> {
    return Promise.resolve(`Test prompt: ${args.test}`);
  }
}

describe('PromptRegistry', () => {
  let registry: PromptRegistry;

  beforeEach(() => {
    registry = new PromptRegistry();
  });

  describe('registerPrompt', () => {
    it('应该能够注册提示', () => {
      const prompt = new MockPrompt();
      registry.registerPrompt(prompt);

      expect(registry.getPrompt('mock-prompt')).toBe(prompt);
    });

    it('应该在重复注册时抛出错误', () => {
      const prompt = new MockPrompt();
      registry.registerPrompt(prompt);

      expect(() => {
        registry.registerPrompt(new MockPrompt());
      }).toThrow("Prompt 'mock-prompt' is already registered");
    });
  });

  describe('listPrompts', () => {
    it('应该列出所有提示', () => {
      const prompt = new MockPrompt();
      registry.registerPrompt(prompt);

      const prompts = registry.listPrompts();
      expect(prompts.length).toBe(1);
      expect(prompts[0].name).toBe('mock-prompt');
    });
  });

  describe('renderPrompt', () => {
    it('应该能够渲染提示', async () => {
      const prompt = new MockPrompt();
      registry.registerPrompt(prompt);

      const result = await registry.renderPrompt('mock-prompt', { test: 'value' });
      expect(result).toBe('Test prompt: value');
    });
  });
});

