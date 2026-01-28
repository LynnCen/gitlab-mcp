# 🔍 使用 MCP Inspector 测试 GitLab MCP Server

本文档介绍如何使用官方的 `@modelcontextprotocol/inspector` 工具来测试和调试 GitLab MCP Server。

## 📋 目录

- [什么是 MCP Inspector](#什么是-mcp-inspector)
- [安装和准备](#安装和准备)
- [测试方法](#测试方法)
  - [方法一：Web UI 模式（推荐）](#方法一web-ui-模式推荐)
  - [方法二：CLI 模式](#方法二cli-模式)
  - [方法三：编程方式](#方法三编程方式)
- [测试场景示例](#测试场景示例)
- [常见问题](#常见问题)

## 什么是 MCP Inspector

MCP Inspector 是官方提供的 MCP 服务器测试和调试工具，具有以下特性：

- 🌐 **Web UI**: 基于 React 的可视化界面，方便交互式测试
- 💻 **CLI 模式**: 命令行工具，适合自动化测试和 CI/CD
- 🔌 **多传输支持**: 支持 stdio、SSE、HTTP 等多种传输方式
- 🐛 **调试功能**: 实时查看请求/响应，便于问题排查
- 📊 **完整支持**: 测试 Tools、Resources、Prompts 全部 MCP 能力

## 安装和准备

### 1. 前置条件

```bash
# 确保已安装 Node.js >= 18
node --version

# 确保项目已构建
cd /path/to/gitlab-mcp
pnpm install
pnpm run build
```

### 2. 安装 MCP Inspector

```bash
# 全局安装（推荐）
npm install -g @modelcontextprotocol/inspector

# 或使用 npx（无需安装）
npx @modelcontextprotocol/inspector --help
```

### 3. 准备配置文件

在项目根目录创建 `mcp-inspector.json` 配置文件：

```json
{
  "mcpServers": {
    "gitlab-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
        "GITLAB_TOKEN": "your-gitlab-token-here",
        "LOG_LEVEL": "debug"
      }
    },
    "gitlab-mcp-dev": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://your-private-gitlab.com",
        "GITLAB_TOKEN": "your-dev-token-here",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

**⚠️ 重要**: 
- 将 `mcp-inspector.json` 添加到 `.gitignore`，避免泄露 token
- 使用真实的 GitLab token 替换 `your-gitlab-token-here`

## 测试方法

### 方法一：Web UI 模式（推荐）

#### 启动 Web UI

```bash
# 使用配置文件启动（推荐）
npx @modelcontextprotocol/inspector --config mcp-inspector.json --server gitlab-mcp

# 或直接指定命令启动
npx @modelcontextprotocol/inspector node dist/src/index.js
```

#### 使用 Web UI 测试

1. **启动服务器**
   - 命令执行后，会自动打开浏览器（默认 http://localhost:5173）
   - 界面会显示 "Connected" 状态

2. **测试 Tools（工具）**
   - 点击左侧 "Tools" 标签
   - 查看所有可用工具列表（应该看到 9 个工具）
   - 选择一个工具（如 `get_merge_request`）
   - 填写参数：
     ```json
     {
       "projectPath": "your-group/your-project",
       "mergeRequestIid": 123
     }
     ```
   - 点击 "Execute" 执行
   - 查看返回结果

3. **测试 Resources（资源）**
   - 点击左侧 "Resources" 标签
   - 查看所有可用资源（应该看到 5 个资源）
   - 选择一个资源（如 `project://your-group/your-project`）
   - 查看资源内容

4. **测试 Prompts（提示）**
   - 点击左侧 "Prompts" 标签
   - 查看所有可用提示（应该看到 2 个提示）
   - 选择一个提示（如 `mr-description`）
   - 填写参数并查看生成的提示内容

5. **查看日志**
   - 所有请求/响应会实时显示在界面中
   - 可以查看详细的 JSON 数据
   - 便于调试和问题排查

#### Web UI 优势

- ✅ 可视化操作，无需记忆命令
- ✅ 实时查看请求/响应
- ✅ 自动补全参数
- ✅ 支持复杂的 JSON 输入
- ✅ 便于探索和测试所有功能

### 方法二：CLI 模式

CLI 模式适合自动化测试、CI/CD 集成和脚本化操作。

#### 2.1 列出所有工具

```bash
# 使用配置文件
npx @modelcontextprotocol/inspector \
  --cli \
  --config mcp-inspector.json \
  --server gitlab-mcp \
  --method tools/list

# 直接指定命令
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/list
```

**输出示例**：
```json
{
  "tools": [
    {
      "name": "get_merge_request",
      "description": "获取指定项目的合并请求详细信息",
      "inputSchema": { ... }
    },
    ...
  ]
}
```

#### 2.2 调用工具（简单参数）

```bash
# 获取 MR 信息
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg mergeRequestIid=10821
```

#### 2.3 调用工具（JSON 参数）

```bash
# 获取 MR 变更（包含 diff）
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request_changes \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg mergeRequestIid=10821 \
  --tool-arg includeContent=true

# 分析 MR 变更（指定关注文件）
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name analyze_mr_changes \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg mergeRequestIid=10821 \
  --tool-arg 'focusFiles=["src/**/*.ts", "src/**/*.tsx"]'
```

#### 2.4 列出资源

```bash
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method resources/list
```

#### 2.5 读取资源

```bash
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method resources/read \
  --resource-uri "project://gdesign/meta"
```

#### 2.6 列出提示

```bash
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method prompts/list
```

#### 2.7 获取提示

```bash
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method prompts/get \
  --prompt-name mr-description \
  --prompt-arg projectPath=gdesign/meta \
  --prompt-arg mergeRequestIid=10821
```

### 方法三：编程方式

适合集成到自动化测试框架中。

创建测试脚本 `test-mcp.ts`：

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testGitLabMCP() {
  // 创建 stdio 传输
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/src/index.js"],
    env: {
      GITLAB_HOST: "https://gitlab.com",
      GITLAB_TOKEN: process.env.GITLAB_TOKEN || "",
      LOG_LEVEL: "info"
    },
    stderr: "pipe"
  });

  // 创建客户端
  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  });

  try {
    // 启动传输和连接
    await transport.start();
    await client.connect(transport);
    console.log("✅ 已连接到 GitLab MCP Server");

    // 1. 列出所有工具
    const toolsResponse = await client.listTools();
    console.log(`\n📦 可用工具: ${toolsResponse.tools.length} 个`);
    toolsResponse.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // 2. 调用工具：获取 MR 信息
    console.log("\n🔧 测试工具: get_merge_request");
    const mrResult = await client.callTool({
      name: "get_merge_request",
      arguments: {
        projectPath: "gdesign/meta",
        mergeRequestIid: 10821
      }
    });
    console.log("✅ 工具执行成功");
    console.log(JSON.stringify(mrResult.content, null, 2));

    // 3. 列出资源
    const resourcesResponse = await client.listResources();
    console.log(`\n📚 可用资源: ${resourcesResponse.resources.length} 个`);

    // 4. 列出提示
    const promptsResponse = await client.listPrompts();
    console.log(`\n💬 可用提示: ${promptsResponse.prompts.length} 个`);

  } catch (error) {
    console.error("❌ 测试失败:", error);
    throw error;
  } finally {
    // 清理资源
    await client.close();
    await transport.close();
    console.log("\n🔒 连接已关闭");
  }
}

// 运行测试
testGitLabMCP().catch(console.error);
```

运行测试：

```bash
# 编译
npx tsx test-mcp.ts

# 或使用 Node.js
node --loader ts-node/esm test-mcp.ts
```

## 测试场景示例

### 场景 1：完整的 MR 审查流程测试

```bash
#!/bin/bash
# test-mr-review.sh

PROJECT="gdesign/meta"
MR_IID=10821

echo "=== 1. 获取 MR 基本信息 ==="
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request \
  --tool-arg projectPath=$PROJECT \
  --tool-arg mergeRequestIid=$MR_IID

echo -e "\n=== 2. 获取 MR 变更列表 ==="
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request_changes \
  --tool-arg projectPath=$PROJECT \
  --tool-arg mergeRequestIid=$MR_IID \
  --tool-arg includeContent=false

echo -e "\n=== 3. 分析 MR 变更 ==="
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name analyze_mr_changes \
  --tool-arg projectPath=$PROJECT \
  --tool-arg mergeRequestIid=$MR_IID

echo -e "\n=== 测试完成 ==="
```

运行：

```bash
chmod +x test-mr-review.sh
./test-mr-review.sh
```

### 场景 2：测试文件操作

```bash
# 获取文件内容
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_file_content \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg filePath=src/index.ts \
  --tool-arg ref=main
```

### 场景 3：测试代码审查规则

```bash
# 获取 TypeScript 文件的审查规则
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_file_code_review_rules \
  --tool-arg filePath=src/components/Button.tsx \
  --tool-arg fileExtension=.tsx
```

### 场景 4：测试 MR 列表

```bash
# 列出所有打开的 MR
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name list_merge_requests \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg state=opened \
  --tool-arg perPage=10
```

### 场景 5：测试资源

```bash
# 读取项目资源
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method resources/read \
  --resource-uri "project://gdesign/meta"

# 读取 MR 资源
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method resources/read \
  --resource-uri "mr://gdesign/meta/10821"
```

## 集成到测试脚本

### package.json 添加测试命令

```json
{
  "scripts": {
    "test:mcp:ui": "npx @modelcontextprotocol/inspector --config mcp-inspector.json --server gitlab-mcp",
    "test:mcp:list": "npx @modelcontextprotocol/inspector --cli node dist/src/index.js --method tools/list",
    "test:mcp:mr": "npx @modelcontextprotocol/inspector --cli node dist/src/index.js --method tools/call --tool-name get_merge_request --tool-arg projectPath=gdesign/meta --tool-arg mergeRequestIid=10821"
  }
}
```

使用：

```bash
# 启动 Web UI
pnpm run test:mcp:ui

# 列出工具
pnpm run test:mcp:list

# 测试 MR 工具
pnpm run test:mcp:mr
```

## 常见问题

### Q1: Inspector 无法启动

**问题**: 运行 Inspector 时报错 "command not found"

**解决方案**:
```bash
# 确保已构建项目
pnpm run build

# 检查 dist/src/index.js 是否存在
ls -la dist/src/index.js

# 使用完整路径
npx @modelcontextprotocol/inspector node $(pwd)/dist/src/index.js
```

### Q2: GitLab 连接失败

**问题**: 测试时报错 "GitLab 连接测试失败"

**解决方案**:
```bash
# 检查环境变量
cat mcp-inspector.json

# 验证 token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://gitlab.com/api/v4/user

# 使用 debug 日志
# 在配置文件中设置: "LOG_LEVEL": "debug"
```

### Q3: 工具调用超时

**问题**: 调用工具时超时

**解决方案**:
```bash
# 增加超时时间（在配置文件中）
{
  "env": {
    "GITLAB_TIMEOUT": "60000"
  }
}

# 检查网络连接
ping gitlab.com
```

### Q4: 参数格式错误

**问题**: JSON 参数解析失败

**解决方案**:
```bash
# 确保 JSON 格式正确
--tool-arg 'focusFiles=["src/**/*.ts"]'  # ✅ 正确

# 避免 shell 转义问题
--tool-arg focusFiles='["src/**/*.ts"]'  # ✅ 也可以

--tool-arg focusFiles=["src/**/*.ts"]     # ❌ 错误
```

### Q5: Web UI 无法访问

**问题**: Web UI 启动后无法打开

**解决方案**:
```bash
# 检查端口占用
lsof -i :5173

# 指定不同端口
npx @modelcontextprotocol/inspector --port 3000 node dist/src/index.js

# 手动打开浏览器
open http://localhost:5173
```

## 调试技巧

### 1. 启用详细日志

```json
{
  "env": {
    "LOG_LEVEL": "debug",
    "DEBUG": "*"
  }
}
```

### 2. 查看 stderr 输出

```bash
# CLI 模式会显示 stderr
npx @modelcontextprotocol/inspector --cli node dist/src/index.js --method tools/list 2>&1
```

### 3. 使用 JSON 格式化工具

```bash
# 格式化输出
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/list | jq
```

### 4. 保存测试结果

```bash
# 保存到文件
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg mergeRequestIid=10821 \
  > test-result.json
```

## 最佳实践

1. **使用配置文件**: 避免在命令行中暴露敏感信息
2. **版本控制**: 将 `mcp-inspector.json` 加入 `.gitignore`
3. **自动化测试**: 将常用测试命令添加到 `package.json`
4. **CI/CD 集成**: 使用 CLI 模式进行自动化测试
5. **开发调试**: 使用 Web UI 模式进行交互式调试
6. **日志分析**: 启用 debug 日志排查问题

## 相关资源

- [MCP Inspector 官方文档](https://github.com/modelcontextprotocol/inspector)
- [MCP SDK 文档](https://modelcontextprotocol.io/)
- [GitLab MCP 使用指南](../../USAGE.md)
- [测试文档](../../TESTING.md)

---

**最后更新**: 2026-01-28  
**文档版本**: v1.0.0
