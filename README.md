# GitLab MCP Server

<div align="center">

一个基于标准MCP TypeScript SDK的GitLab MCP服务器，使用stdio传输方式，支持配置化的GitLab地址和token。

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitLab](https://img.shields.io/badge/GitLab-330F63?style=for-the-badge&logo=gitlab&logoColor=white)](https://gitlab.com/)
[![MCP](https://img.shields.io/badge/MCP-Protocol-blue?style=for-the-badge)](https://modelcontextprotocol.io/)

</div>

## ✨ 特性

- 🔄 **标准MCP协议**: 使用官方MCP TypeScript SDK，完全兼容MCP规范
- 📡 **stdio传输**: 标准的stdio传输方式，完美兼容Cursor、Claude Desktop等客户端
- ⚙️ **配置化支持**: 支持多GitLab实例，通过环境变量轻松配置
- 🛠️ **完整的MR工具集**: 提供获取MR、变更文件、文件内容等全套工具
- 📦 **单文件部署**: 构建为单个可执行JavaScript文件，部署简单
- 🔒 **安全可靠**: 支持私有GitLab实例，内置重试机制和错误处理
- ⚡ **高性能**: 异步处理，支持批量操作，响应迅速

## 🎯 适用场景

- **代码审查**: 快速获取MR信息和变更内容
- **项目管理**: 批量查看和管理合并请求
- **文档编写**: 获取项目文件内容用于文档生成
- **自动化工作流**: 与AI助手结合，自动化代码审查和项目管理

## 🚀 快速开始

### 前置条件

- Node.js >= 18.0.0
- pnpm (推荐) 或 npm
- GitLab访问令牌

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/gitlab-mcp.git
   cd gitlab-mcp
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **构建项目**
   ```bash
   pnpm run build
   ```
   构建完成后，会在`dist/`目录生成可执行的`index.js`文件。

4. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp env.example .env
   
   # 编辑配置文件
   export GITLAB_HOST="https://gitlab.com"  # 您的GitLab实例地址
   export GITLAB_TOKEN="glpat-xxxxxxxxxxxxx"  # 您的GitLab访问令牌
   ```

5. **测试服务器**
   ```bash
   # 测试连接
   node dist/index.js
   ```
   如果看到"✅ 已连接到GitLab"消息，说明配置成功。

## 🔧 MCP工具详解

### 1. get_merge_request

获取指定项目的合并请求详细信息。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID

**返回示例:**
```json
{
  "id": 123456,
  "iid": 42,
  "title": "feat: 添加用户认证功能",
  "description": "# 功能描述\n\n添加JWT认证和用户权限管理...",
  "state": "opened",
  "author": {
    "username": "developer",
    "name": "张三"
  },
  "source_branch": "feature/user-auth",
  "target_branch": "main",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-16T14:45:00.000Z",
  "web_url": "https://gitlab.com/company/project/-/merge_requests/42"
}
```

### 2. get_merge_request_changes

获取合并请求的文件变更列表，可选择包含diff内容。

**参数:**
- `projectPath` (string): 项目路径
- `mergeRequestIid` (number): 合并请求的内部ID
- `includeContent` (boolean, 可选): 是否包含文件diff内容，默认false

**返回示例:**
```json
{
  "changes": [
    {
      "old_path": "src/auth/login.ts",
      "new_path": "src/auth/login.ts",
      "new_file": false,
      "deleted_file": false,
      "renamed_file": false,
      "diff": "@@ -10,6 +10,8 @@ export class AuthService {\n   async login(credentials: LoginDto) {\n+    // 添加JWT验证\n+    const token = this.jwtService.sign(payload);\n     return { user, token };\n   }\n }"
    },
    {
      "old_path": null,
      "new_path": "src/auth/jwt.service.ts",
      "new_file": true,
      "deleted_file": false,
      "renamed_file": false
    }
  ],
  "summary": {
    "total_files": 8,
    "additions": 3,
    "deletions": 1,
    "modifications": 4,
    "renames": 0
  }
}
```

### 3. get_file_content

获取项目中指定文件的内容。

**参数:**
- `projectPath` (string): 项目路径
- `filePath` (string): 文件路径，如 `src/components/Button.tsx`
- `ref` (string, 可选): 分支、标签或commit SHA，默认"main"

**返回示例:**
```json
{
  "file_path": "src/components/Button.tsx",
  "file_name": "Button.tsx",
  "size": 1024,
  "encoding": "base64",
  "content": "aW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JzsKCmV4cG9ydCBmdW5jdGlvbiBCdXR0b24oKSB7CiAgcmV0dXJuIDxidXR0b24+Q2xpY2sgbWU8L2J1dHRvbj47Cn0=",
  "ref": "main",
  "blob_id": "abc123def456",
  "commit_id": "789ghi012jkl",
  "last_commit_id": "345mno678pqr"
}
```

### 4. list_merge_requests

列出项目的合并请求列表。

**参数:**
- `projectPath` (string): 项目路径
- `state` (string, 可选): 状态筛选，可选值: `opened`, `closed`, `merged`, `all`，默认`opened`
- `perPage` (number, 可选): 每页数量，默认20，最大100

**返回示例:**
```json
{
  "total": 5,
  "merge_requests": [
    {
      "id": 123456,
      "iid": 42,
      "title": "feat: 添加用户认证功能",
      "state": "opened",
      "author": {
        "username": "developer",
        "name": "张三"
      },
      "source_branch": "feature/user-auth",
      "target_branch": "main",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-16T14:45:00.000Z",
      "web_url": "https://gitlab.com/company/project/-/merge_requests/42"
    }
  ]
}
```

## 🖥️ 在Cursor中使用

### 配置步骤

1. **构建项目**
   ```bash
   pnpm run build
   ```

2. **获取绝对路径**
   ```bash
   pwd
   # 输出类似: /Users/username/projects/gitlab-mcp
   ```

3. **配置Cursor MCP设置**
   
   打开Cursor设置，找到MCP配置，添加以下内容：
   ```json
   {
     "mcpServers": {
       "gitlab-mcp": {
         "command": "node",
         "args": ["/Users/username/projects/gitlab-mcp/dist/index.js"],
         "env": {
           "GITLAB_HOST": "https://gitlab.com",
           "GITLAB_TOKEN": "glpat-xxxxxxxxxxxxx"
         }
       }
     }
   }
   ```

4. **重启Cursor**
   
   保存配置后重启Cursor使配置生效。

### 使用示例

配置完成后，您可以在Cursor的聊天界面中使用以下命令：

```
请获取项目 company/awesome-project 中 MR #123 的详细信息
```

```
请查看项目 company/awesome-project 中 MR #123 的文件变更，包含diff内容
```

```
请获取项目 company/awesome-project 中 src/main.ts 文件的内容
```

```
请列出项目 company/awesome-project 中所有正在进行的合并请求
```

## 🔑 GitLab Token配置

### 创建访问令牌

1. **登录GitLab**，点击右上角头像
2. **进入设置**: "Edit profile" → "Access Tokens"
3. **创建令牌**:
   - Token name: `mcp-server-token`
   - Expiration date: 根据需要设置
   - **选择权限** (必需):
     - ✅ `api` - 访问GitLab API
     - ✅ `read_user` - 读取用户信息
     - ✅ `read_repository` - 读取仓库内容
4. **点击 "Create personal access token"**
5. **复制令牌** (只显示一次，请妥善保存)

### 权限说明

| 权限 | 用途 | 必需 |
|------|------|------|
| `api` | 访问GitLab REST API | ✅ |
| `read_user` | 获取用户信息和验证连接 | ✅ |
| `read_repository` | 读取项目文件和MR信息 | ✅ |
| `read_merge_request` | 访问MR详细信息 | 自动包含在api中 |

## 📁 项目结构

```
gitlab-mcp/
├── src/                          # 源代码目录
│   ├── index.ts                  # 主入口文件，MCP服务器实现
│   ├── config/
│   │   └── types.ts              # TypeScript类型定义
│   └── gitlab/
│       └── client.ts             # GitLab API客户端封装
├── dist/                         # 构建输出目录
│   ├── index.js                  # 编译后的可执行文件
│   └── ...                       # 其他编译输出
├── package.json                  # 项目配置和依赖
├── tsconfig.json                 # TypeScript配置
├── pnpm-lock.yaml               # 依赖锁定文件
├── .gitignore                   # Git忽略规则
├── env.example                  # 环境变量模板
├── cursor-mcp-config.json       # Cursor配置示例
├── USAGE.md                     # 使用示例文档
└── README.md                    # 项目说明文档
```

## 🛠️ 开发指南

### 本地开发

```bash
# 开发模式（自动编译）
pnpm run dev

# 构建项目
pnpm run build

# 清理构建输出
pnpm run clean

# 启动服务器
pnpm start
```

### 添加新工具

1. **定义工具**：在`src/index.ts`的`ListToolsRequestSchema`处理器中添加工具定义
2. **实现处理器**：在`CallToolRequestSchema`处理器中添加case分支
3. **创建处理函数**：实现具体的工具逻辑
4. **测试验证**：构建并测试新工具

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `GITLAB_HOST` | GitLab实例地址 | `https://gitlab.com` | ✅ |
| `GITLAB_TOKEN` | GitLab访问令牌 | - | ✅ |
| `GITLAB_TIMEOUT` | 请求超时时间(ms) | `30000` | ❌ |
| `GITLAB_RETRIES` | 重试次数 | `3` | ❌ |

### 技术栈

- **运行时**: Node.js 18+
- **语言**: TypeScript 5.3+
- **MCP SDK**: @modelcontextprotocol/sdk
- **GitLab API**: @gitbeaker/node
- **验证**: Zod
- **构建**: TypeScript Compiler

## 🐛 故障排除

### 常见问题

#### 1. 连接失败
**症状**: "GitLab连接测试失败"
**解决方案**:
```bash
# 检查环境变量
echo $GITLAB_HOST
echo $GITLAB_TOKEN

# 测试网络连接
curl -H "Authorization: Bearer $GITLAB_TOKEN" "$GITLAB_HOST/api/v4/user"
```

#### 2. 权限不足
**症状**: "403 Forbidden" 或 "权限错误"
**解决方案**:
- 确保token具有 `api`, `read_user`, `read_repository` 权限
- 检查是否有访问目标项目的权限
- 验证token是否已过期

#### 3. 项目路径错误
**症状**: "404 Project Not Found"
**解决方案**:
- 确保项目路径格式正确: `owner/project-name`
- 检查项目是否存在且可访问
- 对于群组项目，使用完整路径: `group/subgroup/project`

#### 4. Cursor配置问题
**症状**: Cursor中无法使用MCP工具
**解决方案**:
```bash
# 确保文件路径正确且可执行
ls -la /path/to/gitlab-mcp/dist/index.js

# 测试配置
node /path/to/gitlab-mcp/dist/index.js

# 重启Cursor
```

### 调试技巧

1. **查看日志**: 服务器会在stderr输出日志信息
2. **测试连接**: 使用`node dist/index.js`直接测试
3. **验证环境**: 确保所有环境变量正确设置
4. **检查权限**: 使用GitLab Web界面验证token权限

## 🚧 路线图

- [ ] 支持更多GitLab API功能
- [ ] 添加缓存机制提升性能
- [ ] 支持批量操作
- [ ] 添加配置文件支持
- [ ] 实现更详细的错误处理

## 🤝 贡献

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - 提供优秀的MCP协议和SDK
- [@gitbeaker/node](https://github.com/jdalrymple/gitbeaker) - 强大的GitLab API客户端
- [Zod](https://github.com/colinhacks/zod) - TypeScript优先的模式验证库

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️**

Made with ❤️ by the GitLab MCP Team

</div> 