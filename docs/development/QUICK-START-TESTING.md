# 🚀 快速开始测试 GitLab MCP

5 分钟快速上手，使用 MCP Inspector 测试你的 GitLab MCP Server。

## 📋 准备工作

### 1. 构建项目

```bash
cd /path/to/gitlab-mcp
pnpm install
pnpm run build
```

### 2. 配置 GitLab Token

```bash
# 复制配置模板
cp mcp-inspector.example.json mcp-inspector.json

# 编辑配置文件，填入你的 GitLab Token
# 在 "GITLAB_TOKEN" 字段填入你的 token
nano mcp-inspector.json
```

**获取 GitLab Token**:
1. 登录 GitLab → 右上角头像 → Settings
2. Access Tokens → 创建新 token
3. 选择权限：`api`, `read_user`, `read_repository`, `write_repository`
4. 复制 token 到配置文件

## 🎯 方式一：交互式测试（最简单）

```bash
# 运行交互式测试脚本
pnpm run test:mcp
```

会显示一个菜单，选择你想测试的功能：

```
请选择测试方式:

  1) Web UI 模式（推荐）- 可视化交互测试
  2) CLI 模式 - 列出所有工具
  3) CLI 模式 - 列出所有资源
  4) CLI 模式 - 列出所有提示
  5) 测试 MR 工具 - 获取 MR 信息
  6) 测试 MR 工具 - 获取 MR 变更
  7) 测试文件工具 - 获取文件内容
  8) 运行完整测试套件
  0) 退出

请输入选项 [0-8]:
```

**推荐流程**：
1. 选择 `1` 启动 Web UI，在浏览器中可视化测试
2. 选择 `8` 运行完整测试套件，验证所有功能

## 🌐 方式二：Web UI 测试（推荐新手）

### 启动 Web UI

```bash
pnpm run test:mcp:ui
```

浏览器会自动打开 `http://localhost:5173`

### 使用 Web UI

1. **查看工具列表**
   - 左侧点击 "Tools"
   - 看到 9 个可用工具

2. **测试获取 MR**
   - 选择 `get_merge_request`
   - 填入参数：
     ```json
     {
       "projectPath": "your-group/your-project",
       "mergeRequestIid": 123
     }
     ```
   - 点击 "Execute"
   - 查看返回的 MR 信息

3. **测试获取 MR 变更**
   - 选择 `get_merge_request_changes`
   - 填入参数：
     ```json
     {
       "projectPath": "your-group/your-project",
       "mergeRequestIid": 123,
       "includeContent": true
     }
     ```
   - 查看文件变更和 diff

4. **测试其他工具**
   - 依次测试其他工具
   - 查看 Resources 和 Prompts

## 💻 方式三：CLI 测试（适合脚本化）

### 列出所有工具

```bash
pnpm run test:mcp:list
```

### 列出所有资源

```bash
pnpm run test:mcp:resources
```

### 列出所有提示

```bash
pnpm run test:mcp:prompts
```

### 测试获取 MR

```bash
npx @modelcontextprotocol/inspector \
  --cli node dist/src/index.js \
  --method tools/call \
  --tool-name get_merge_request \
  --tool-arg projectPath=gdesign/meta \
  --tool-arg mergeRequestIid=10821
```

## ✅ 验证清单

测试以下功能确保一切正常：

- [ ] 服务器启动成功（Web UI 可访问）
- [ ] 可以列出 9 个工具
- [ ] 可以列出 5 个资源模板
- [ ] 可以列出 2 个提示
- [ ] 可以获取 MR 基本信息
- [ ] 可以获取 MR 文件变更
- [ ] 可以获取文件内容
- [ ] 可以列出 MR 列表
- [ ] 可以获取代码审查规则

## 🐛 常见问题

### 问题 1: 配置文件不存在

```
错误: 配置文件 mcp-inspector.json 不存在
```

**解决方案**:
```bash
cp mcp-inspector.example.json mcp-inspector.json
# 编辑 mcp-inspector.json，填入你的 GITLAB_TOKEN
```

### 问题 2: GitLab 连接失败

```
GitLab连接测试失败
```

**解决方案**:
```bash
# 1. 检查 token 是否正确
cat mcp-inspector.json | grep GITLAB_TOKEN

# 2. 测试 token
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://gitlab.com/api/v4/user

# 3. 检查 GITLAB_HOST 是否正确
```

### 问题 3: 项目未构建

```
错误: 项目未构建
```

**解决方案**:
```bash
pnpm run build
```

### 问题 4: 端口被占用

```
Error: listen EADDRINUSE: address already in use :::5173
```

**解决方案**:
```bash
# 查找并终止占用端口的进程
lsof -ti:5173 | xargs kill -9

# 或使用不同端口
npx @modelcontextprotocol/inspector --port 3000 node dist/src/index.js
```

## 📚 下一步

- **深入学习**: 阅读 [完整测试文档](./MCP-INSPECTOR-TESTING.md)
- **自动化测试**: 查看 [测试指南](../../TESTING.md)
- **开发插件**: 阅读 [插件开发指南](./plugin-development-guide.md)
- **了解架构**: 查看 [架构设计](./architecture.md)

## 🎓 测试技巧

1. **使用 Web UI 探索**: 最快了解所有功能
2. **使用 CLI 自动化**: 适合脚本和 CI/CD
3. **保存测试用例**: 创建常用测试的 shell 脚本
4. **查看日志**: 启用 debug 日志排查问题
5. **使用 jq 格式化**: `... | jq` 美化 JSON 输出

## 🆘 获取帮助

- 📖 [完整测试文档](./MCP-INSPECTOR-TESTING.md)
- 📚 [文档中心](../README.md)
- 🐛 [提交 Issue](https://github.com/LynnCen/gitlab-mcp/issues)
- 💬 [参与讨论](https://github.com/LynnCen/gitlab-mcp/discussions)

---

**预计时间**: 5-10 分钟  
**难度**: 简单  
**最后更新**: 2026-01-28
