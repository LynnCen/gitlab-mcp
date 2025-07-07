# GitLab MCP Server 2.0

一个采用设计模式重构的 GitLab MCP 服务器，使用 Server-Sent Events (SSE) 传输协议，基于 TypeScript 和 MCP 官方 SDK 构建。

## ✨ 核心特性

- 🏗️ **设计模式架构**: 采用工厂、策略、单例、适配器、观察者模式
- 🌐 **SSE 传输**: 使用 Server-Sent Events 进行实时通信  
- 🔄 **MR 变更分析**: 获取 MR 变更文件列表和内容
- 📄 **文件内容获取**: 批量获取项目文件内容
- ⚡ **高性能**: 连接池、重试机制、错误处理
- 🛠️ **开发友好**: 完整的开发工具和脚本

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/gitlab-mcp.git
cd gitlab-mcp
```

### 2. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 配置环境变量

创建 `.env` 文件：

```bash
# GitLab 配置 (必需)
GITLAB_HOST=https://gitlab.com
GITLAB_TOKEN=your-gitlab-access-token

# 服务器配置 (可选)
PORT=3000
HOST=localhost
DEBUG=false

# 其他配置
SKIP_GITLAB_TEST=false
CORS_ORIGINS=*
```

### 4. 启动服务器

```bash
# 生产模式
npm run serve

# 开发模式
npm run dev

# 跳过构建步骤
npm run serve:skip-build

# 仅测试 GitLab 连接
npm run test-gitlab
```

## 🔧 MCP 工具

### 1. get_mr_changes
获取 GitLab MR 的变更文件列表

**参数:**
- `projectPath` (string): 项目路径，如 'owner/repo'
- `mrIid` (number): MR 的内部 ID
- `includeContent` (boolean): 是否包含文件内容和 diff

**返回:**
```json
{
  "changes": [
    {
      "oldPath": "src/old-file.ts",
      "newPath": "src/new-file.ts", 
      "changeType": "modified",
      "diff": "...",
      "content": "..."
    }
  ],
  "summary": {
    "totalFiles": 5,
    "addedFiles": 1,
    "modifiedFiles": 3,
    "deletedFiles": 1,
    "renamedFiles": 0
  },
  "mr": {
    "id": 123,
    "iid": 45,
    "title": "Feature: Add new component",
    "state": "opened"
  }
}
```

### 2. get_file_content
获取单个文件内容

**参数:**
- `projectPath` (string): 项目路径
- `filePath` (string): 文件路径
- `ref` (string, 可选): 分支或 commit，默认 'main'

### 3. get_multiple_file_contents
批量获取多个文件内容

**参数:**
- `projectPath` (string): 项目路径
- `filePaths` (string[]): 文件路径数组
- `ref` (string, 可选): 分支或 commit，默认 'main'

## 🖥️ 服务器端点

服务器提供以下 HTTP 端点：

- `GET /sse` - SSE 连接端点
- `POST /message` - 消息处理端点
- `GET /health` - 健康检查
- `GET /test-gitlab` - GitLab 连接测试
- `GET /tools` - 可用工具列表
- `GET /connections` - 连接统计信息

## 🔌 在 Cursor 中使用

### 1. 配置 MCP 设置

在 Cursor 中，打开设置并添加以下 MCP 配置：

**方式 1: 使用本地构建**
```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "command": "node",
      "args": ["/path/to/gitlab-mcp/dist/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-token-here"
      }
    }
  }
}
```

**方式 2: 使用 SSE 连接 (推荐)**
```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "transport": {
        "type": "sse",
        "url": "http://localhost:3000/sse"
      }
    }
  }
}
```

### 2. 启动服务器

```bash
# 设置环境变量
export GITLAB_HOST=https://gitlab.com  
export GITLAB_TOKEN=glpat-xxxxxxxxxxxxx

# 启动服务器
npm run serve
```

### 3. 在 Cursor 中验证

重启 Cursor，在聊天中输入：

```
请获取项目 owner/repo 中 MR #123 的变更文件列表
```

## 🛠️ 开发指南

### 本地开发

```bash
# 开发模式 (自动重启)
npm run dev

# 构建项目
npm run build

# 运行测试
npm test

# 代码检查
npm run lint
```

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|-------|------|--------|------|
| `GITLAB_HOST` | GitLab 服务器地址 | `https://gitlab.com` | ✅ |
| `GITLAB_TOKEN` | GitLab 访问令牌 | - | ✅ |
| `PORT` | 服务器端口 | `3000` | ❌ |
| `HOST` | 服务器主机 | `localhost` | ❌ |
| `DEBUG` | 调试模式 | `false` | ❌ |
| `SKIP_GITLAB_TEST` | 跳过连接测试 | `false` | ❌ |
| `CORS_ORIGINS` | CORS 允许的源 | `*` | ❌ |

### GitLab 访问令牌权限

创建 GitLab 访问令牌时，需要以下权限：

- ✅ `api` - API 访问
- ✅ `read_user` - 读取用户信息  
- ✅ `read_repository` - 读取仓库
- ✅ `read_merge_request` - 读取合并请求

## 📝 故障排除

### 常见问题

#### 1. GitLab 连接失败
```bash
# 测试连接
npm run test-gitlab

# 跳过连接测试启动
SKIP_GITLAB_TEST=true npm run serve
```

#### 2. 端口被占用
```bash
# 使用不同端口
PORT=3001 npm run serve
```

#### 3. CORS 错误
```bash
# 设置 CORS 源
CORS_ORIGINS=http://localhost:3000,https://your-domain.com npm run serve
```

#### 4. 权限不足
确保 GitLab 令牌具有所需权限，或联系管理员。

### 调试模式

```bash
# 启用调试日志
DEBUG=true npm run serve

# 开发模式 (包含详细日志)
npm run dev
```

## 🤝 贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

该项目基于 MIT 许可证开源。查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议和 SDK
- [@gitbeaker/node](https://github.com/jdalrymple/gitbeaker) - GitLab API 客户端
- [Express.js](https://expressjs.com/) - Web 服务器框架 