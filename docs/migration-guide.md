# 迁移指南：从 v1.x 到 v2.0

## 概述

GitLab MCP Server v2.0 是一次完全重构，采用了全新的架构设计。本文档帮助您从 v1.x 迁移到 v2.0。

## 主要变更

### 架构变更

v2.0 采用了全新的六层架构：

1. **传输层**: 支持 Stdio、HTTP、WebSocket
2. **协议层**: JSON-RPC 协议处理
3. **能力层**: Tools、Resources、Prompts
4. **中间件层**: 日志、错误处理、认证、限流等
5. **业务层**: 服务封装业务逻辑
6. **数据访问层**: 仓储模式封装 GitLab API

### 目录结构变更

**v1.x**:
```
src/
├── server/
├── config/
├── tools/
└── ...
```

**v2.0**:
```
src-v2/
├── transport/        # 传输层
├── core/            # 核心框架（DI、协议、插件）
├── capabilities/    # 能力层（Tools、Resources、Prompts）
├── middleware/      # 中间件
├── services/        # 业务服务层
├── repositories/    # 数据访问层
├── plugins/         # 插件实现
└── ...
```

### 配置变更

#### v1.x 配置

```typescript
const config = {
  host: 'https://gitlab.com',
  token: 'your-token',
  timeout: 30000,
  retries: 3
};
```

#### v2.0 配置

```typescript
// 使用环境变量（推荐）
GITLAB_HOST=https://gitlab.com
GITLAB_TOKEN=your-token
GITLAB_TIMEOUT=30000
GITLAB_RETRIES=3

// 或使用 ConfigManager
const configManager = new ConfigManager(new EnvConfigProvider());
const gitlabConfig = configManager.getGitLabConfig();
```

### API 变更

#### 工具调用

**v1.x**:
```typescript
const result = await server.callTool('get_merge_request', {
  projectPath: 'owner/repo',
  mergeRequestIid: 1
});
```

**v2.0**:
```typescript
const tool = toolRegistry.getTool('get_merge_request');
const result = await tool.execute({
  projectPath: 'owner/repo',
  mergeRequestIid: 1
}, context);
```

#### 资源访问

**v1.x**: 不支持 Resources

**v2.0**:
```typescript
const resource = resourceRegistry.getResource('gitlab://projects/owner/repo');
const content = await resource.getContent();
```

#### 提示模板

**v1.x**: 不支持 Prompts

**v2.0**:
```typescript
const prompt = promptRegistry.getPrompt('mr-description');
const rendered = await prompt.render({
  style: 'detailed',
  mergeRequest: { ... }
});
```

## 迁移步骤

### 1. 更新依赖

```bash
# 卸载旧版本
npm uninstall gitlab-mcp-server

# 安装新版本
npm install gitlab-mcp-server@^2.0.0
```

### 2. 更新配置

将配置文件迁移到环境变量：

```bash
# .env
GITLAB_HOST=https://gitlab.com
GITLAB_TOKEN=your-token
GITLAB_TIMEOUT=30000
GITLAB_RETRIES=3
```

### 3. 更新代码

#### 初始化服务器

**v1.x**:
```typescript
import { GitLabMcpServer } from 'gitlab-mcp-server';

const server = new GitLabMcpServer(config);
await server.initialize();
```

**v2.0**:
```typescript
import { ConfigManager } from 'gitlab-mcp-server/v2/config';
import { EnvConfigProvider } from 'gitlab-mcp-server/v2/config';
import { PluginRegistry } from 'gitlab-mcp-server/v2/core/plugin';
import { GitLabMRPlugin } from 'gitlab-mcp-server/v2/plugins/gitlab-mr';

const configManager = new ConfigManager(new EnvConfigProvider());
const pluginRegistry = new PluginRegistry();

const mrPlugin = new GitLabMRPlugin();
await mrPlugin.initialize({ ... });
pluginRegistry.register(mrPlugin);
```

#### 调用工具

**v1.x**:
```typescript
const result = await server.callTool('get_merge_request', params);
```

**v2.0**:
```typescript
const toolRegistry = new ToolRegistry();
// ... 注册工具

const tool = toolRegistry.getTool('get_merge_request');
const result = await tool.execute(params, context);
```

### 4. 测试迁移

1. 运行所有现有测试
2. 验证工具调用结果
3. 检查错误处理
4. 验证性能

## 兼容性说明

### 不兼容变更

- ❌ 完全重构，API 不兼容
- ❌ 配置方式变更
- ❌ 目录结构变更
- ❌ 工具调用方式变更

### 兼容功能

- ✅ 所有工具功能保持不变
- ✅ 工具参数和返回值格式保持一致
- ✅ 错误处理逻辑保持一致

## 新功能

v2.0 新增了以下功能：

1. **Resources（资源）**: 通过 URI 访问项目、MR、文件等
2. **Prompts（提示）**: 预定义的提示词模板
3. **插件系统**: 模块化的插件架构
4. **流式处理**: 支持大文件的流式传输
5. **中间件**: 日志、错误处理、认证、限流等
6. **多传输支持**: HTTP、WebSocket 传输

## 常见问题

### Q: 如何迁移自定义工具？

A: 将工具实现为插件：

```typescript
class MyCustomPlugin extends Plugin {
  register(registry: CapabilityRegistry): void {
    registry.tools.registerTool(new MyCustomTool());
  }
}
```

### Q: 如何保持向后兼容？

A: v2.0 是全新架构，不提供向后兼容。建议：

1. 在新分支中测试 v2.0
2. 逐步迁移功能
3. 保持 v1.x 运行直到迁移完成

### Q: 性能有变化吗？

A: v2.0 性能应该更好：

- 缓存机制优化
- 流式处理减少内存占用
- 中间件链优化

## 获取帮助

如果遇到迁移问题：

1. 查看 [API 参考文档](./api-reference.md)
2. 查看 [架构文档](../architecture.md)
3. 提交 Issue 到 GitHub

## 回滚方案

如果需要回滚到 v1.x：

```bash
npm install gitlab-mcp-server@^1.1.0
```

恢复旧配置文件和代码。

