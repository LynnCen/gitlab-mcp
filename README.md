# GitLab MCP Server 2.0

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
- 🤖 **智能代码审查**: 支持AI驱动的代码审查，自动生成和推送审查评论
- 📝 **行内评论支持**: 精确的行级代码评论，支持critical/warning/suggestion分级
- 🔍 **变更分析**: 深度分析MR变更，提供结构化的diff数据
- 📋 **审查规则引擎**: 基于文件类型和路径的智能审查规则匹配
- 📦 **单文件部署**: 构建为单个可执行JavaScript文件，部署简单
- 🔒 **安全可靠**: 支持私有GitLab实例，内置重试机制和错误处理
- ⚡ **高性能**: 异步处理，支持批量操作，响应迅速

## 🎯 适用场景

- **智能代码审查**: 与AI助手结合，自动分析代码变更并生成专业的审查评论
- **团队协作**: 标准化代码审查流程，支持多种严重级别的问题分类
- **质量把控**: 基于文件类型和项目规范的智能审查规则引擎
- **传统代码审查**: 快速获取MR信息和变更内容
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
   git clone https://github.com/LynnCen/gitlab-mcp
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
   node dist/src/index.js
   ```

   如果看到"✅ 已连接到GitLab"消息，说明配置成功。

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

   >注意：command的值需要是绝对路径，args的值需要是相对路径，env的值需要是环境变量

   ```json
   {
     "mcpServers": {
       "gitlab-mcp": {
       "type": "stdio",
       "command": "node",
       "args": ["/Users/lynncen/personal/code/gitlab-mcp/dist/src/index.js"],
       "env": {
        "GITLAB_TOKEN": "xxxxx",
        "GITLAB_HOST": "xxxxxx"
       }
    }
     }
   }
   ```

4. **配置cursor rules**

- 配置mr-description-generator.mdc文件，并配置到cursor rules中
- 配置mr-code-review.mdc文件，并配置到cursor rules中

5. **重启Cursor**
   
保存配置后重启Cursor使配置生效。

### 使用示例

**生成Mr描述**

```text
查看项目为gdesign/meta，mrid为10821的mr信息以及所有变更内容，按照mr生成规划生成文档，随后将该文档帮我更新到对应的mrid的描述下
```

**生成技术方案**

```text
查看项目为gdesign/meta，mrid为10821的mr信息以及所有变更内容，按照mr生成技术方案，使用markdown格式输出。
```

**AI代码审查完整工作流：**

```text
请分析项目 gdesign/meta 中 MR #11401 的所有变更，并按照项目代码规范进行全面的代码审查，生成行内评论，并生成代码审查报告，并推送到GitLab MR中
```

**具体功能示例：**

```text
请获取项目 company/awesome-project 中 MR #123 的详细信息
```

```text
请查看项目 company/awesome-project 中 MR #123 的文件变更，包含diff内容
```

```text
请分析项目 company/awesome-project 中 MR #123 的变更，重点关注 src/ 目录下的文件
```

```text
请对项目 company/awesome-project 的 MR #123 进行代码审查，并将评论推送到GitLab
```

```text
请获取项目 company/awesome-project 中 src/main.ts 文件的内容
```

```text
请列出项目 company/awesome-project 中所有正在进行的合并请求
```

```text
请更新项目 company/awesome-project 中 MR #123 的描述为: "## 功能更新\n\n- 添加用户认证\n- 修复登录问题"
```

**在Cursor中的使用示例：**

配置完成后，您可以在Cursor的聊天界面中使用以下命令：

```text
请获取项目 company/awesome-project 中 MR #123 的详细信息
```

```text
请查看项目 company/awesome-project 中 MR #123 的文件变更，包含diff内容
```

```text
请获取项目 company/awesome-project 中 src/main.ts 文件的内容
```

```text
请列出项目 company/awesome-project 中所有正在进行的合并请求
```

```text
请更新项目 company/awesome-project 中 MR #123 的描述为: "## 功能更新\n\n- 添加用户认证\n- 修复登录问题"
```

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

**返回:**
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

### 5. update_merge_request_description

更新指定合并请求的描述信息，支持Markdown格式。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID
- `description` (string): 新的描述内容，支持Markdown格式

**返回示例:**
```json
{
  "success": true,
  "message": "合并请求描述更新成功",
  "merge_request": {
    "id": 123456,
    "iid": 42,
    "title": "feat: 添加用户认证功能",
    "description": "# 功能描述\n\n## 主要变更\n- 添加JWT认证机制\n- 实现用户权限管理\n- 增加登录/注销功能\n\n## 测试说明\n- 单元测试覆盖率: 95%\n- 集成测试通过\n\n## 部署注意事项\n- 需要更新环境变量配置\n- 数据库迁移已包含",
    "state": "opened",
    "author": {
      "username": "developer",
      "name": "张三"
    },
    "source_branch": "feature/user-auth",
    "target_branch": "main",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-16T14:45:00.000Z",
    "web_url": "https://gitlab.com/company/project/-/merge_requests/42",
    "description_length": 186
  }
}
```

### 6. analyze_mr_changes

分析合并请求的文件变更和差异信息，为代码审查提供基础数据。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID
- `focusFiles` (string[], 可选): 重点关注的文件列表

**返回示例:**
```json
{
  "merge_request": {
    "title": "feat: 添加新功能",
    "author": "developer",
    "source_branch": "feature/new-feature",
    "target_branch": "main",
    "web_url": "https://gitlab.com/project/-/merge_requests/42"
  },
  "analysis_summary": {
    "total_files": 15,
    "reviewable_files": 8,
    "excluded_files": 7
  },
  "file_analysis": [
    {
      "file_path": "src/components/Button.tsx",
      "change_type": "modified",
      "extension": ".tsx",
      "diff_lines": 45,
      "diff_analysis": {
        "newLines": [
          {"lineNumber": 23, "content": "const handleClick = () => {"},
          {"lineNumber": 24, "content": "  onClick?.();"}
        ],
        "deletedLines": [],
        "contextLines": [
          {"lineNumber": 22, "content": "return ("}
        ]
      },
      "raw_diff": "@@ -20,5 +20,7 @@ export function Button() {\n+  const handleClick = () => {\n+    onClick?.();\n+  };\n   return ("
    }
  ],
  "analyzed_at": "2024-01-16T14:45:00.000Z"
}
```

### 7. push_code_review_comments

将cursor生成的代码审查评论推送到GitLab MR，支持行内评论和文件级评论。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID
- `reviewComments` (array): 代码审查评论列表
- `summaryComment` (string, 可选): 总体审查评论
- `commentStyle` (string, 可选): 评论风格，可选值: `detailed`, `summary`, `minimal`

**reviewComments 数组项结构:**
- `filePath` (string): 文件路径
- `lineNumber` (number, 可选): 行号，用于行内评论
- `severity` (string): 问题严重级别，可选值: `critical`, `warning`, `suggestion`
- `title` (string): 问题标题
- `description` (string): 问题描述
- `suggestion` (string): 修改建议
- `category` (string, 可选): 问题分类
- `autoFixable` (boolean, 可选): 是否可自动修复

**返回示例:**
```json
{
  "success": true,
  "summary": {
    "total_comments": 5,
    "successful_comments": 5,
    "failed_comments": 0,
    "inline_comments": 3,
    "file_comments": 2,
    "summary_comment_added": true
  },
  "summary_comment": {
    "id": 731879
  },
  "comment_results": [
    {
      "filePath": "src/auth/login.ts",
      "lineNumber": 45,
      "body": "### 🚨 **SQL注入风险**\n\n> 🔴 **Critical** · 安全\n\n直接拼接用户输入到查询中存在安全风险\n\n**🔧 修复建议**\n使用参数化查询或ORM防止SQL注入",
      "severity": "critical",
      "success": true,
      "id": "abc123",
      "type": "inline"
    }
  ],
  "message": "已成功推送 5 条代码审查评论到 MR #42",
  "pushed_at": "2024-01-16T14:45:00.000Z"
}
```

### 8. filter_reviewable_files

根据配置规则过滤出需要代码审查的文件。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID
- `focusFiles` (string[], 可选): 重点关注的文件列表

**返回示例:**
```json
{
  "total_files": 15,
  "reviewable_files": 8,
  "excluded_files": 7,
  "files": [
    {
      "file_path": "src/components/Button.tsx",
      "reviewable": true,
      "reason": "TypeScript React组件"
    },
    {
      "file_path": "package-lock.json",
      "reviewable": false,
      "reason": "自动生成的依赖文件"
    }
  ],
  "exclusion_rules": [
    "*.lock",
    "*.min.js",
    "dist/*",
    "node_modules/*"
  ]
}
```

### 9. get_file_code_review_rules

根据文件类型和路径获取相应的代码审查规则。

**参数:**
- `filePath` (string): 文件路径
- `fileExtension` (string, 可选): 文件扩展名

**返回示例:**
```json
{
  "file_path": "src/components/Button.tsx",
  "file_type": "typescript-react",
  "rules": [
    {
      "category": "类型安全",
      "rules": [
        "必须使用TypeScript类型定义",
        "避免使用any类型",
        "Props必须有接口定义"
      ]
    },
    {
      "category": "React规范",
      "rules": [
        "使用函数组件和Hooks",
        "正确使用useEffect依赖",
        "避免在render中创建对象"
      ]
    }
  ],
  "severity_mapping": {
    "类型安全": "warning",
    "性能问题": "warning",
    "安全漏洞": "critical"
  }
}
```

### 10. debug_mr_sha_info

检查合并请求的版本信息、diff_refs和commits，用于调试行内评论问题。

**参数:**
- `projectPath` (string): 项目路径，格式: `owner/repo`
- `mergeRequestIid` (number): 合并请求的内部ID

**返回示例:**
```json
{
  "versions": {
    "success": true,
    "data": [
      {
        "id": 123,
        "head_commit_sha": "abc123def456",
        "base_commit_sha": "def456ghi789",
        "start_commit_sha": "ghi789jkl012"
      }
    ],
    "latest_version": {
      "head_commit_sha": "abc123def456",
      "base_commit_sha": "def456ghi789"
    }
  },
  "merge_request": {
    "success": true,
    "diff_refs": {
      "base_sha": "def456ghi789",
      "head_sha": "abc123def456",
      "start_sha": "ghi789jkl012"
    }
  },
  "sha_analysis": {
    "available_sources": [
      {
        "method": "versions_api",
        "priority": 1,
        "complete": true
      },
      {
        "method": "diff_refs",
        "priority": 2,
        "complete": true
      }
    ],
    "recommended_method": "versions_api"
  }
}
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
     - ✅ `write_repository` - 写入仓库内容（更新MR描述需要）
4. **点击 "Create personal access token"**
5. **复制令牌** (只显示一次，请妥善保存)

### 权限说明

| 权限 | 用途 | 必需 |
|------|------|------|
| `api` | 访问GitLab REST API | ✅ |
| `read_user` | 获取用户信息和验证连接 | ✅ |
| `read_repository` | 读取项目文件和MR信息 | ✅ |
| `write_repository` | 更新MR描述和推送代码审查评论 | ✅ |
| `read_merge_request` | 访问MR详细信息 | 自动包含在api中 |

**⚠️ 重要说明**:

- 代码审查功能需要 `write_repository` 权限来推送评论
- 行内评论需要访问MR的版本信息和diff数据
- 确保token对目标项目有足够的访问权限

## 📚 文档

### 完整文档

- **[文档中心](./docs/README.md)** - 所有文档的索引和导航
- **[使用指南](./USAGE.md)** - 详细的使用说明和示例
- **[测试文档](./TESTING.md)** - 测试指南和最佳实践
- **[变更日志](./CHANGELOG.md)** - 版本变更记录

### 开发文档

- **[开发指南](./docs/development/README.md)** - 开发文档索引
- **[架构设计](./docs/development/architecture.md)** - 系统架构详解
- **[插件开发](./docs/development/plugin-development-guide.md)** - 插件开发教程
- **[API 参考](./docs/api-reference.md)** - 完整的 API 文档

## 🛠️ 开发指南

### 本地开发

```bash
# 开发模式（自动编译）
pnpm run dev

# 构建项目
npm run build

# 运行测试
npm test

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

详细的开发指南请查看 [开发文档](./docs/development/README.md)。

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
- **GitLab API**: @gitbeaker/rest
- **验证**: Zod
- **构建**: TypeScript Compiler

完整技术栈说明请查看 [技术选型文档](./docs/development/decisions/tech-stack.md)。

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
ls -la /path/to/gitlab-mcp/dist/src/index.js

# 测试配置
node /path/to/gitlab-mcp/dist/src/index.js

# 重启Cursor
```

### 调试技巧

1. **查看日志**: 服务器会在stderr输出日志信息
2. **测试连接**: 使用`node dist/src/index.js`直接测试
3. **验证环境**: 确保所有环境变量正确设置
4. **检查权限**: 使用GitLab Web界面验证token权限

## 🚧 路线图

- [x] ✅ **智能代码审查**: 支持AI驱动的代码审查和评论推送
- [x] ✅ **行内评论**: 精确的行级代码评论功能  
- [x] ✅ **变更分析**: 深度分析MR变更和diff数据
- [x] ✅ **审查规则**: 基于文件类型的智能审查规则引擎
- [x] ✅ **评论分级**: 支持critical/warning/suggestion三级分类
- [ ] 🔄 **批量审查**: 支持多MR批量代码审查
- [ ] 📊 **审查报告**: 生成详细的代码质量报告
- [ ] ⚡ **性能优化**: 添加缓存机制提升性能
- [ ] 📝 **配置文件**: 支持项目级审查规则配置文件
- [ ] 🔧 **更多GitLab功能**: 支持Issue、Pipeline等更多API功能

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
- [@gitbeaker/rest](https://github.com/jdalrymple/gitbeaker) - 强大的GitLab API客户端
- [Zod](https://github.com/colinhacks/zod) - TypeScript优先的模式验证库

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐️**

Made with ❤️ by the GitLab MCP Team

</div> 
