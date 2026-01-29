# GitLab MCP 测试指南

本文档说明如何测试 GitLab MCP Server 的功能。

## 📚 测试方法

### MCP Inspector 测试（推荐）

使用官方的 MCP Inspector 工具进行交互式测试和调试：

- **Web UI 模式**: 可视化界面，方便探索所有工具、资源和提示
- **CLI 模式**: 命令行测试，适合自动化和脚本
- **编程方式**: 集成到测试框架

📖 **完整指南**: [MCP Inspector 测试文档](./docs/development/MCP-INSPECTOR-TESTING.md)

**快速启动**:
```bash
# 安装 Inspector
npm install -g @modelcontextprotocol/inspector

# 启动 Web UI
pnpm run test:mcp:ui

# 或使用 CLI 列出所有工具
pnpm run test:mcp:list
```

### 单元测试和集成测试

使用 Vitest 运行单元测试和集成测试：

```bash
# 运行所有测试
pnpm test

# 查看测试覆盖率
pnpm test:coverage

# UI 模式
pnpm test:ui
```

---

## 功能测试

以下是针对 `getMergeRequestChanges` 方法的具体功能测试说明。

## 快速开始

### 1. 环境准备

首先设置 GitLab 认证信息：

```bash
# 方法1: 使用环境变量
export GITLAB_HOST="https://your-gitlab-instance.com"
export GITLAB_TOKEN="your-personal-access-token"

# 方法2: 创建 .env 文件
echo "GITLAB_HOST=https://your-gitlab-instance.com" > .env
echo "GITLAB_TOKEN=your-personal-access-token" >> .env
```

### 2. 构建项目

```bash
pnpm run build
```

### 3. 运行测试

我们提供了两个测试脚本：

#### 快速测试 (推荐)

```bash
# 使用默认值测试 (gdesign/meta MR#11242)
node quick-test.js

# 指定项目和MR ID
node quick-test.js myproject/repo 123

# 查看帮助
node quick-test.js --help
```

#### 详细测试 (生成日志文件)

```bash
# 使用默认值
node test-mr-changes.js

# 指定参数
node test-mr-changes.js gdesign/meta 11242
node test-mr-changes.js myproject/repo:123

# 查看帮助
node test-mr-changes.js --help
```

详细测试会生成 `test-mr-changes.log` 文件，包含完整的执行日志。

## 测试案例

### 测试用例 1: 正常的MR (有变更)
```bash
node quick-test.js gdesign/meta 11242
```

期望结果：
- ✅ 成功获取项目信息
- ✅ 成功获取MR信息
- 📊 显示变更文件数量和文件列表

### 测试用例 2: 无变更的MR
```bash
node quick-test.js someproject/repo 999
```

期望结果：
- ✅ 成功获取项目和MR信息
- 📊 显示 "变更文件数: 0" 而不是报错

### 测试用例 3: 不存在的MR
```bash
node quick-test.js gdesign/meta 999999
```

期望结果：
- ❌ 应该显示清晰的错误信息，而不是 "Cannot read properties of undefined"

## 故障排除

### 常见问题

1. **认证失败**
   ```
   Error: Unauthorized
   ```
   解决方案：检查 GITLAB_HOST 和 GITLAB_TOKEN 是否正确设置

2. **项目不存在**
   ```
   Error: 404 Project Not Found
   ```
   解决方案：确认项目路径格式正确 (例如: `owner/project`)

3. **MR不存在**
   ```
   Error: 404 Merge Request Not Found
   ```
   解决方案：确认MR ID是该项目中的有效MR号

### 调试模式

如果需要查看详细的API调用信息，可以设置调试环境变量：

```bash
DEBUG=1 node quick-test.js
```

## 修复验证

本次修复主要解决以下问题：

1. **"Cannot read properties of undefined (reading 'map')" 错误**
   - ✅ 修复前：当GitLab API返回无`changes`字段时会崩溃
   - ✅ 修复后：安全处理，返回空的changes数组

2. **API调用错误**
   - ✅ 修复前：使用了不存在的API方法
   - ✅ 修复后：使用正确的 `MergeRequests.show()` 方法

3. **数据结构处理**
   - ✅ 修复前：假设`changes`字段总是存在且为数组
   - ✅ 修复后：安全检查数据类型，容错处理

## 预期输出示例

### 成功案例
```
🧪 快速测试: gdesign/meta MR#11242
==================================================
✅ GitLab 客户端已创建
📋 获取项目: gdesign/meta
✅ 项目 ID: 12345
🔍 获取 MR 变更: 11242

📊 结果分析:
- 数据类型: object
- 是否有 changes: true
- 变更文件数: 5
- 前3个文件:
  1. src/components/Button.tsx
  2. src/styles/theme.css
  3. README.md

🎉 测试成功完成!
```

### 无变更案例
```
📊 结果分析:
- 数据类型: object
- 是否有 changes: false
- 变更文件数: 0

🎉 测试成功完成!
```

## 文件说明

- `quick-test.js` - 快速测试脚本，输出简洁
- `test-mr-changes.js` - 详细测试脚本，生成日志文件
- `test-env.example` - 环境变量配置示例
- `test-mr-changes.log` - 详细测试生成的日志文件 (运行后生成)
- `TESTING.md` - 本测试指南

## 清理

测试完成后，可以删除测试文件：

```bash
rm -f test-mr-changes.log
rm -f test-*.js
rm -f TESTING.md
rm -f test-env.example
``` 