# 插件开发指南

## 概述

GitLab MCP Server v2.0 采用插件化架构，所有功能都通过插件提供。本文档介绍如何开发自定义插件。

## 插件架构

### 插件结构

一个插件可以注册三种能力：

1. **Tools（工具）**: 可执行的函数接口
2. **Resources（资源）**: 通过 URI 访问的数据
3. **Prompts（提示）**: 预定义的提示词模板

### 插件生命周期

1. **初始化 (initialize)**: 插件初始化，获取依赖服务
2. **注册 (register)**: 注册能力到注册表
3. **销毁 (dispose)**: 清理资源（可选）

## 创建插件

### 1. 创建插件类

```typescript
import { Plugin } from '../../core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../core/plugin/types.js';

export class MyCustomPlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'my-custom-plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'My custom plugin description',
    mcpVersion: '1.0.0',
  };

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);
    // 初始化逻辑
  }

  register(registry: CapabilityRegistry): void {
    // 注册工具、资源、提示
  }
}
```

### 2. 创建工具

```typescript
import { Tool } from '../../../capabilities/tools/Tool.js';
import { z } from 'zod';
import type { ExecutionContext, ToolResult } from '../../../capabilities/tools/types.js';

export class MyCustomTool extends Tool {
  readonly name = 'my_custom_tool';
  readonly description = 'My custom tool description';
  readonly inputSchema = z.object({
    param1: z.string().describe('Parameter 1'),
    param2: z.number().optional().describe('Parameter 2'),
  });
  readonly metadata = {
    category: 'custom',
    tags: ['custom', 'example'],
    plugin: 'my-custom-plugin',
    version: '1.0.0',
  };

  async execute(params: unknown, context: ExecutionContext): Promise<ToolResult> {
    const { param1, param2 } = this.inputSchema.parse(params);

    // 执行逻辑
    const result = {
      message: `Processed ${param1} with ${param2 || 'default'}`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
}
```

### 3. 创建资源

```typescript
import { Resource } from '../../../capabilities/resources/Resource.js';
import type { ResourceContent } from '../../../capabilities/resources/types.js';

export class MyCustomResource extends Resource {
  readonly uri = 'custom://my-resource';
  readonly name = 'My Custom Resource';
  readonly description = 'My custom resource description';
  readonly mimeType = 'application/json';
  readonly cacheable = true;
  readonly subscribable = false;

  async getContent(): Promise<ResourceContent> {
    const data = {
      message: 'Hello from custom resource',
      timestamp: new Date().toISOString(),
    };

    return {
      uri: this.uri,
      mimeType: this.mimeType,
      text: JSON.stringify(data, null, 2),
    };
  }
}
```

### 4. 创建提示

```typescript
import { Prompt } from '../../../capabilities/prompts/Prompt.js';
import type { PromptArgument } from '../../../capabilities/prompts/types.js';

export class MyCustomPrompt extends Prompt {
  readonly name = 'my-custom-prompt';
  readonly description = 'My custom prompt description';
  readonly template = 'Process the following: {{input}}';
  readonly version = '1.0.0';
  readonly arguments: PromptArgument[] = [
    {
      name: 'input',
      description: 'Input text',
      required: true,
      type: 'string',
    },
  ];

  async render(args: Record<string, unknown>): Promise<string> {
    const input = args.input as string;
    return this.template.replace('{{input}}', input);
  }
}
```

### 5. 注册能力

在插件的 `register` 方法中注册所有能力：

```typescript
register(registry: CapabilityRegistry): void {
  // 注册工具
  registry.tools.registerTool(new MyCustomTool());

  // 注册资源
  registry.resources.registerResource(new MyCustomResource());

  // 注册提示
  registry.prompts.registerPrompt(new MyCustomPrompt());
}
```

## 使用依赖服务

插件可以通过 `PluginContext` 获取依赖服务：

```typescript
async initialize(context: PluginContext): Promise<void> {
  await super.initialize(context);

  // 获取服务
  const logger = context.logger;
  const config = context.config;

  // 使用服务
  logger?.info('Plugin initialized');
}
```

### 可用的服务

- `logger`: ILogger - 日志服务
- `config`: Config - 配置对象
- `mrService`: IMergeRequestService - MR 服务（如果可用）
- `fileService`: IFileOperationService - 文件服务（如果可用）
- `codeReviewService`: ICodeReviewService - 代码审查服务（如果可用）
- `projectService`: IProjectService - 项目服务（如果可用）

## 插件示例

### 完整示例

```typescript
import { Plugin } from '../../core/plugin/Plugin.js';
import type {
  PluginMetadata,
  PluginContext,
  CapabilityRegistry,
} from '../../core/plugin/types.js';
import { MyCustomTool } from './tools/MyCustomTool.js';
import { MyCustomResource } from './resources/MyCustomResource.js';
import { MyCustomPrompt } from './prompts/MyCustomPrompt.js';

export class MyCustomPlugin extends Plugin {
  readonly metadata: PluginMetadata = {
    name: 'my-custom-plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'My custom plugin',
    mcpVersion: '1.0.0',
  };

  async initialize(context: PluginContext): Promise<void> {
    await super.initialize(context);
    this.context?.logger?.info('My custom plugin initialized');
  }

  register(registry: CapabilityRegistry): void {
    // 注册工具
    registry.tools.registerTool(new MyCustomTool());

    // 注册资源
    registry.resources.registerResource(new MyCustomResource());

    // 注册提示
    registry.prompts.registerPrompt(new MyCustomPrompt());
  }
}
```

## 最佳实践

### 1. 错误处理

```typescript
async execute(params: unknown, context: ExecutionContext): Promise<ToolResult> {
  try {
    // 执行逻辑
    return { content: [{ type: 'text', text: 'Success' }] };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
}
```

### 2. 输入验证

始终使用 Zod Schema 验证输入：

```typescript
readonly inputSchema = z.object({
  required: z.string(),
  optional: z.number().optional(),
  withDefault: z.string().default('default-value'),
});
```

### 3. 日志记录

使用上下文中的 logger：

```typescript
this.context?.logger?.debug('Debug message', { data });
this.context?.logger?.info('Info message');
this.context?.logger?.warn('Warning message');
this.context?.logger?.error('Error message', { error });
```

### 4. 资源 URI 设计

遵循 URI 规范：

- 使用明确的 scheme：`custom://`
- 使用层次化路径：`custom://category/resource`
- 支持查询参数：`custom://resource?id=123`

### 5. 提示模板

使用清晰的变量名和文档：

```typescript
readonly template = `
# Task: {{taskName}}

## Context
{{context}}

## Instructions
{{instructions}}
`;
```

## 测试插件

### 单元测试

```typescript
import { describe, it, expect } from 'vitest';
import { MyCustomPlugin } from './index.js';

describe('MyCustomPlugin', () => {
  it('should register all capabilities', () => {
    const plugin = new MyCustomPlugin();
    const toolRegistry = new ToolRegistry();
    const resourceRegistry = new ResourceRegistry();
    const promptRegistry = new PromptRegistry();

    plugin.register({
      tools: toolRegistry,
      resources: resourceRegistry,
      prompts: promptRegistry,
    });

    expect(toolRegistry.hasTool('my_custom_tool')).toBe(true);
    expect(resourceRegistry.hasResource('custom://my-resource')).toBe(true);
    expect(promptRegistry.hasPrompt('my-custom-prompt')).toBe(true);
  });
});
```

## 发布插件

### 1. 版本管理

遵循语义化版本：

- `1.0.0`: 初始版本
- `1.1.0`: 新功能
- `1.0.1`:  bug 修复
- `2.0.0`: 重大变更

### 2. 文档

提供完整的文档：

- README.md: 插件说明
- API 文档: 工具、资源、提示的详细说明
- 示例代码: 使用示例

### 3. 测试

确保测试覆盖：

- 单元测试覆盖率 > 80%
- 集成测试
- E2E 测试（如适用）

## 参考

- [GitLab MR Plugin](../src-v2/plugins/gitlab-mr/index.ts) - 完整插件示例
- [API 参考文档](./api-reference.md) - API 详细说明
- [架构文档](../architecture.md) - 系统架构说明

