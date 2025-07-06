# GitLab MCP Server

> 🚀 一个可扩展的GitLab MCP（Model Context Protocol）服务器，支持多种GitLab操作和AI驱动的代码分析

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitLab](https://img.shields.io/badge/GitLab-330F63?style=for-the-badge&logo=gitlab&logoColor=white)](https://gitlab.com/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)

## 🎯 概述

GitLab MCP Server 是一个基于 Model Context Protocol (MCP) 的可扩展服务器，专为 GitLab 集成而设计。它采用现代化的插件架构，支持多种 GitLab 操作，可与 Claude、Cursor 等 AI 工具无缝集成。

## 🚀 快速开始

### 1 分钟快速体验

```bash
# 1. 安装
npm install -g gitlab-mcp-server

# 2. 配置环境变量
export GITLAB_HOST=https://gitlab.com
export GITLAB_TOKEN=your-gitlab-token

# 3. 启动服务器
gitlab-mcp
```

### 在 Cursor 中快速集成

在 Cursor 设置中添加以下配置：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp",
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-gitlab-token"
      }
    }
  }
}
```

## 📚 目录

- [🎯 概述](#概述)
- [🚀 快速开始](#快速开始)
- [✨ 核心特性](#核心特性)
- [🛠️ 支持的功能](#支持的功能)
- [📦 安装](#安装)
- [⚙️ 配置](#配置)
  - [📋 前置条件](#前置条件)
  - [🔑 步骤 1：获取 GitLab 访问令牌](#步骤-1获取-gitlab-访问令牌)
  - [🔧 步骤 2：选择配置方式](#步骤-2选择配置方式)
  - [✅ 步骤 3：验证配置](#步骤-3验证配置)
- [🚀 使用方法](#使用方法)
- [🔧 API 参考](#api-参考)
- [🏗️ 架构设计](#架构设计)
- [🔌 插件开发](#插件开发)
- [🧪 测试](#测试)
- [🛠️ 开发](#开发)
- [🐛 故障排除](#故障排除)
- [🤝 贡献指南](#贡献指南)
- [📄 许可证](#许可证)

### ✨ 核心特性

- 🔌 **插件化架构** - 易于扩展的插件系统
- 🎯 **MR 分析** - 智能分析 Merge Request 变更
- 📊 **代码洞察** - 生成详细的代码变更报告
- 🚀 **性能优化** - 内置缓存机制，提升响应速度
- 🛡️ **类型安全** - 完整的 TypeScript 支持
- 📝 **自动化文档** - 生成专业的 MR 描述和代码审查清单
- 🔧 **配置灵活** - 支持环境变量和配置文件

### 🛠️ 支持的功能

#### GitLab 操作

- 📋 获取 MR 信息和变更详情
- 📝 生成 MR 描述和代码审查清单
- 📊 列出项目的 MR 列表
- 🌿 管理项目分支
- 📂 获取文件内容
- 🏗️ 项目信息查询

#### AI 集成

- 🤖 自动生成 MR 变更摘要
- 📋 智能代码审查清单
- 🔍 代码质量分析
- 📈 影响范围评估

## 📦 安装

### 使用 npm

```bash
npm install -g gitlab-mcp-server
```

### 使用 pnpm

```bash
pnpm add -g gitlab-mcp-server
```

### 从源码安装

```bash
git clone https://github.com/your-username/gitlab-mcp-server.git
cd gitlab-mcp-server
pnpm install
pnpm run build
```

## ⚙️ 配置

### 📋 前置条件

在开始配置之前，请确保：

- ✅ 已安装 Node.js 18.0.0 或更高版本
- ✅ 已安装 npm 或 pnpm 包管理器
- ✅ 拥有 GitLab 账户和项目访问权限
- ✅ 能够访问 GitLab 实例（gitlab.com 或私有部署）

### 🔑 步骤 1：获取 GitLab 访问令牌

#### 1.1 登录 GitLab

访问您的 GitLab 实例（如 https://gitlab.com）并登录账户。

#### 1.2 创建个人访问令牌

1. 点击右上角的用户头像
2. 选择 **Preferences**（偏好设置）
3. 在左侧菜单中选择 **Access Tokens**（访问令牌）
4. 点击 **Add new token**（添加新令牌）

#### 1.3 配置令牌信息

填写以下信息：

- **Token name**：`gitlab-mcp-server`（或其他有意义的名称）
- **Expiration date**：建议设置为 1 年后（可选）
- **Select scopes**：选择以下权限：
  - ✅ `api` - 完整的 API 访问权限
  - ✅ `read_user` - 读取用户信息
  - ✅ `read_repository` - 读取仓库信息
  - ✅ `read_api` - 读取 API 资源

#### 1.4 保存令牌

1. 点击 **Create personal access token**
2. **重要**：立即复制生成的令牌，它只会显示一次
3. 将令牌保存在安全的地方

### 🔧 步骤 2：选择配置方式

我们支持两种配置方式，**推荐使用环境变量配置**：

| 配置方式 | 优点 | 缺点 | 推荐场景 |
|---------|------|------|----------|
| 环境变量 | 安全、灵活、易于部署 | 需要每次设置 | 生产环境、CI/CD |
| 配置文件 | 持久化、易于管理 | 安全性较低 | 开发环境 |

### 🌟 方式 A：环境变量配置（推荐）

#### 2.1 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 创建 .env 文件
touch .env
```

#### 2.2 配置环境变量

将以下内容添加到 `.env` 文件中：

```env
# GitLab Configuration（必填）
GITLAB_HOST=https://gitlab.com
GITLAB_TOKEN=your-gitlab-token-here

# Server Configuration（可选）
MCP_SERVER_NAME=gitlab-mcp-server
MCP_SERVER_VERSION=1.0.0
LOG_LEVEL=info

# Plugin Configuration（可选）
ENABLE_GITLAB_PLUGIN=true
ENABLE_ANALYTICS_PLUGIN=false
ENABLE_SECURITY_PLUGIN=false

# Cache Configuration（可选）
ENABLE_CACHE=true
CACHE_TTL=300
```

#### 2.3 替换配置值

- 将 `your-gitlab-token-here` 替换为步骤 1 中获取的访问令牌
- 如果使用私有 GitLab，将 `https://gitlab.com` 替换为您的 GitLab 实例地址

### 📄 方式 B：配置文件

#### 2.1 创建配置文件

在项目根目录创建 `config.json` 文件：

```bash
# 创建配置文件
touch config.json
```

#### 2.2 配置内容

将以下内容添加到 `config.json` 文件中：

```json
{
  "gitlab": {
    "host": "https://gitlab.com",
    "token": "your-gitlab-token-here"
  },
  "server": {
    "name": "gitlab-mcp-server",
    "version": "1.0.0",
    "logLevel": "info"
  },
  "plugins": {
    "gitlab": true,
    "analytics": false,
    "security": false
  },
  "cache": {
    "enabled": true,
    "ttl": 300
  }
}
```

#### 2.3 替换配置值

- 将 `your-gitlab-token-here` 替换为步骤 1 中获取的访问令牌
- 如果使用私有 GitLab，将 `https://gitlab.com` 替换为您的 GitLab 实例地址

### ✅ 步骤 3：验证配置

#### 3.1 测试连接

运行以下命令测试 GitLab 连接：

```bash
# 如果使用全局安装
gitlab-mcp --test-connection

# 如果使用 npx
npx gitlab-mcp-server --test-connection

# 如果是开发环境
npm run test-connection
```

#### 3.2 检查配置

成功的配置应该显示：

```
✅ GitLab连接测试成功
✅ 用户身份验证成功
✅ API访问权限验证成功
✅ 配置验证完成
```

#### 3.3 故障排除

如果遇到错误，请检查：

- ❌ **401 Unauthorized**: 检查访问令牌是否正确
- ❌ **403 Forbidden**: 检查令牌权限是否足够
- ❌ **404 Not Found**: 检查 GitLab 主机地址是否正确
- ❌ **Network Error**: 检查网络连接和防火墙设置

### 🔒 安全提醒

- 🚨 **永远不要**将访问令牌提交到版本控制系统
- 🚨 **永远不要**在公共场所分享访问令牌
- 🚨 将 `.env` 文件添加到 `.gitignore` 中
- 🚨 定期轮换访问令牌

## 🚀 使用方法

### 🖥️ 独立运行服务器

如果您想直接运行服务器（用于调试或独立使用）：

```bash
# 使用全局安装
gitlab-mcp

# 使用 npx
npx gitlab-mcp-server

# 开发模式
pnpm run dev
```

### 🎯 在 AI 工具中集成

#### 📝 在 Cursor 中使用

**步骤 1：打开 Cursor 设置**
1. 在 Cursor 中按 `Cmd/Ctrl + ,` 打开设置
2. 在左侧菜单中找到 **Features** → **MCP Servers**
3. 点击 **Edit in settings.json**

**步骤 2：添加服务器配置**

如果您使用**环境变量配置**：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp"
    }
  }
}
```

如果您使用**配置文件**或需要**覆盖环境变量**：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp",
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-token-here"
      }
    }
  }
}
```

**步骤 3：重启 Cursor**
保存配置后，重启 Cursor 以加载 MCP 服务器。

#### 🤖 在 Claude Desktop 中使用

**步骤 1：找到配置文件**

不同操作系统的配置文件位置：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

**步骤 2：编辑配置文件**

如果您使用**环境变量配置**：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp"
    }
  }
}
```

如果您使用**配置文件**或需要**覆盖环境变量**：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp",
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-token-here"
      }
    }
  }
}
```

**步骤 3：重启 Claude Desktop**

### 🔧 高级配置

#### 开发环境配置

对于开发环境，推荐使用以下配置：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/gitlab-mcp-server",
      "env": {
        "LOG_LEVEL": "debug",
        "ENABLE_CACHE": "false"
      }
    }
  }
}
```

#### 生产环境配置

对于生产环境，推荐使用以下配置：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "gitlab-mcp",
      "env": {
        "LOG_LEVEL": "warn",
        "ENABLE_CACHE": "true",
        "CACHE_TTL": "600"
      }
    }
  }
}
```

### ✅ 验证集成

#### 1. 检查服务器状态

在 AI 工具中，您应该能看到：

- ✅ GitLab MCP 服务器已连接
- ✅ 可用的工具列表
- ✅ 可用的资源

#### 2. 测试基本功能

尝试运行以下命令：

```
请帮我获取项目 "username/project-name" 的最新 MR 列表
```

#### 3. 使用示例

以下是一些常见的使用场景：

**获取 MR 信息：**
```
请帮我获取项目 "gitlab-org/gitlab" 的 MR #1234 的详细信息
```

**生成 MR 描述：**
```
请为项目 "my-org/my-project" 的 MR #56 生成一个详细的变更描述
```

**列出项目的 MR：**
```
请列出项目 "my-org/my-project" 最近的 10 个已合并的 MR
```

**分析代码变更：**
```
请分析项目 "my-org/my-project" 的 MR #89 的代码变更，并生成审查清单
```

#### 3. 常见问题

**服务器无法连接**
- 检查命令路径是否正确
- 确认 GitLab 访问令牌有效
- 查看 AI 工具的错误日志

**权限不足**
- 确认令牌具有必要的权限
- 检查项目访问权限

**功能不可用**
- 确认插件已正确启用
- 检查网络连接

## 🔧 API 参考

### 工具 (Tools)

#### `gitlab_get_mr_info`
获取指定 MR 的基本信息

```typescript
{
  projectPath: string;  // 项目路径，如 "owner/repo"
  mrIid: number;        // MR 的内部 ID
}
```

#### `gitlab_generate_mr_description`
生成 MR 的详细描述 markdown

```typescript
{
  projectPath: string;
  mrIid: number;
  includeFiles?: boolean;    // 是否包含文件变更列表
  includeDiffs?: boolean;    // 是否包含代码差异
}
```

#### `gitlab_list_project_mrs`
列出项目的 MR 列表

```typescript
{
  projectPath: string;
  state?: "opened" | "closed" | "merged" | "all";
  limit?: number;
}
```

### 资源 (Resources)

#### `gitlab://mr/{projectPath}/{mrIid}`
访问指定的 GitLab MR 信息

#### `gitlab://mr/{projectPath}/{mrIid}/changes`
访问指定的 GitLab MR 变更详情

#### `gitlab://project/{projectPath}`
访问指定的 GitLab 项目信息

### 提示模板 (Prompts)

#### `gitlab_analyze_mr_changes`
分析 MR 变更并生成专业描述

#### `gitlab_review_mr_checklist`
生成详细的代码审查清单

## 🏗️ 架构设计

### 插件化架构

```
src/
├── core/                 # 核心框架
│   ├── server.ts        # MCP 服务器
│   ├── plugin.ts        # 插件基类
│   ├── config.ts        # 配置管理
│   ├── logger.ts        # 日志系统
│   └── cache.ts         # 缓存管理
├── plugins/             # 插件目录
│   └── gitlab.ts        # GitLab 插件
├── types/               # 类型定义
│   └── index.ts         # 核心类型
└── index.ts             # 入口文件
```

### 设计模式

- **工厂模式** - 插件创建和管理
- **策略模式** - 不同的 GitLab 操作策略
- **观察者模式** - 事件系统
- **装饰器模式** - 缓存和日志装饰

## 🔌 插件开发

### 创建自定义插件

```typescript
import { BasePlugin } from '../core/plugin.js';
import { PluginManifest, PluginContext } from '../types/index.js';

export class CustomPlugin extends BasePlugin {
  getManifest(): PluginManifest {
    return {
      name: 'custom-plugin',
      version: '1.0.0',
      description: '自定义插件',
      author: 'Your Name',
      capabilities: {
        tools: true,
        resources: false,
        prompts: true,
      },
    };
  }

  async initialize(): Promise<void> {
    this.log('info', '自定义插件初始化');
  }

  getTools(): MCPTool[] {
    return [
      {
        name: 'custom_tool',
        description: '自定义工具',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' }
          },
          required: ['input']
        }
      }
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    if (name === 'custom_tool') {
      return `处理输入: ${args.input}`;
    }
    throw new Error(`未知工具: ${name}`);
  }

  // ... 其他方法
}
```

### 注册插件

```typescript
import { MCPServer } from './core/server.js';
import { customPluginFactory } from './plugins/custom.js';

const server = new MCPServer();
server.registerPlugin('custom', customPluginFactory);
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并监听变更
pnpm test:watch

# 运行测试并生成覆盖率报告
pnpm test --coverage
```

### 测试示例

```typescript
import { GitLabPlugin } from '../src/plugins/gitlab.js';
import { createMockContext } from './utils/mock.js';

describe('GitLabPlugin', () => {
  it('should get MR info', async () => {
    const plugin = new GitLabPlugin(createMockContext());
    const result = await plugin.handleToolCall('gitlab_get_mr_info', {
      projectPath: 'owner/repo',
      mrIid: 1
    });
    
    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
  });
});
```

## 🛠️ 开发

### 开发环境设置

```bash
# 克隆项目
git clone https://github.com/your-username/gitlab-mcp-server.git
cd gitlab-mcp-server

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 构建项目
pnpm run build

# 代码检查
pnpm run lint

# 修复代码格式
pnpm run lint:fix
```

### 代码提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加或修改测试
chore: 构建过程或辅助工具的变动
```

## 📊 性能优化

### 缓存策略

- **内存缓存** - 默认启用，TTL 为 5 分钟
- **请求去重** - 相同请求自动合并
- **增量更新** - 只获取变更的数据

### 最佳实践

1. **批量操作** - 使用批量 API 减少请求次数
2. **懒加载** - 按需加载 MR 详情
3. **并发控制** - 限制并发请求数量
4. **错误重试** - 自动重试失败的请求

## 🔒 安全性

### 令牌管理

- 使用环境变量存储敏感信息
- 支持令牌轮换和自动续期
- 最小权限原则

### 数据保护

- 所有 API 调用使用 HTTPS
- 敏感数据不记录到日志
- 定期清理缓存数据

## 🐛 故障排除

### 🔧 配置相关问题

#### 1. 环境变量未生效

**问题描述：**
```bash
Error: 缺少必要的配置: GITLAB_TOKEN
```

**解决方案：**
- 确认 `.env` 文件位于正确的目录（项目根目录）
- 检查 `.env` 文件的格式是否正确（无空格、无引号）
- 确认环境变量名称拼写正确
- 重启终端或应用程序

#### 2. 配置文件未找到

**问题描述：**
```bash
Error: 无法加载配置文件: config.json
```

**解决方案：**
- 确认配置文件路径正确
- 检查 JSON 格式是否有效
- 确认文件权限正确
- 尝试使用绝对路径

#### 3. 令牌权限不足

**问题描述：**
```bash
Error: 403 Forbidden - Insufficient permissions
```

**解决方案：**
- 重新创建令牌，确保选择了所有必要的权限：
  - ✅ `api` - 完整的 API 访问权限
  - ✅ `read_user` - 读取用户信息
  - ✅ `read_repository` - 读取仓库信息
  - ✅ `read_api` - 读取 API 资源
- 确认令牌未过期
- 检查项目访问权限

### 🖥️ 集成相关问题

#### 4. Cursor 中无法找到 MCP 服务器

**问题描述：**
Cursor 中没有显示 GitLab MCP 服务器。

**解决方案：**
- 确认 Cursor 版本支持 MCP（需要较新版本）
- 检查 `settings.json` 配置格式
- 重启 Cursor 应用程序
- 查看 Cursor 的开发者工具中的错误日志

#### 5. Claude Desktop 无法连接

**问题描述：**
Claude Desktop 显示 MCP 服务器连接失败。

**解决方案：**
- 确认配置文件位置正确
- 检查命令路径是否正确：
  ```bash
  # 验证命令是否可执行
  which gitlab-mcp
  ```
- 确认 Claude Desktop 版本支持 MCP
- 重启 Claude Desktop

#### 6. 命令未找到

**问题描述：**
```bash
Error: command not found: gitlab-mcp
```

**解决方案：**
- 确认已全局安装：`npm install -g gitlab-mcp-server`
- 检查 npm 全局 bin 目录是否在 PATH 中
- 尝试使用 npx：`npx gitlab-mcp-server`
- 重新安装包

### 🔗 网络相关问题

#### 7. 连接超时

**问题描述：**
```bash
Error: Request timeout
```

**解决方案：**
- 检查网络连接
- 确认 GitLab 实例地址正确
- 检查代理设置
- 尝试增加超时时间

#### 8. SSL 证书问题

**问题描述：**
```bash
Error: SSL certificate problem
```

**解决方案：**
- 对于自签名证书，可以设置：
  ```bash
  NODE_TLS_REJECT_UNAUTHORIZED=0
  ```
- 或者配置正确的证书路径
- 联系系统管理员获取正确的证书

### 🐛 运行时问题

#### 9. 内存占用过高

**解决方案：**
- 调整缓存 TTL 设置：
  ```env
  CACHE_TTL=60
  ```
- 减少并发请求数量
- 定期重启服务器

#### 10. 日志过多

**解决方案：**
- 调整日志级别：
  ```env
  LOG_LEVEL=warn
  ```
- 配置日志轮转
- 定期清理日志文件

### 🔍 调试模式

启用详细调试信息：

```bash
# 启用调试日志
LOG_LEVEL=debug pnpm start

# 禁用缓存（便于调试）
ENABLE_CACHE=false pnpm start

# 组合使用
LOG_LEVEL=debug ENABLE_CACHE=false pnpm start
```

### 📝 获取帮助

如果以上解决方案都无法解决问题，请：

1. **收集信息：**
   - 错误的完整输出
   - 您的配置文件（隐藏敏感信息）
   - 操作系统和 Node.js 版本
   - 使用的 AI 工具版本

2. **提交问题：**
   - 访问 [GitHub Issues](https://github.com/your-username/gitlab-mcp-server/issues)
   - 使用问题模板创建新问题
   - 提供详细的重现步骤

3. **社区支持：**
   - 查看 [GitHub Discussions](https://github.com/your-username/gitlab-mcp-server/discussions)
   - 搜索现有的讨论和解决方案

## 📚 更多资源

- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [GitLab API 文档](https://docs.gitlab.com/ee/api/)
- [TypeScript 手册](https://www.typescriptlang.org/docs/)

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读我们的 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 贡献流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供了优秀的协议标准
- [GitLab](https://gitlab.com/) - 强大的 DevOps 平台
- [GitBeaker](https://github.com/jdalrymple/gitbeaker) - 出色的 GitLab API 客户端
- 所有贡献者和社区成员

## 📞 联系我们

- 问题报告：[GitHub Issues](https://github.com/your-username/gitlab-mcp-server/issues)
- 功能建议：[GitHub Discussions](https://github.com/your-username/gitlab-mcp-server/discussions)
- 电子邮件：[your-email@example.com](mailto:your-email@example.com)

---

<div align="center">
  <strong>⭐ 如果这个项目对您有帮助，请考虑给我们一个 star！</strong>
</div> 