# GitLab MCP 使用指南

本文档提供 GitLab MCP 服务器的详细使用说明。

## 目录

- [功能概述](#功能概述)
- [工具详解](#工具详解)
- [使用示例](#使用示例)
- [代码审查工作流](#代码审查工作流)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 功能概述

GitLab MCP 服务器提供以下核心功能：

| 功能模块 | 说明 |
|----------|------|
| 合并请求管理 | 获取、列出、更新 MR 信息 |
| 文件操作 | 获取仓库文件内容 |
| 代码审查 | 分析变更、推送评论 |
| 审查规则 | 基于文件类型的智能规则 |

## 工具详解

### 1. get_merge_request

获取指定项目的合并请求详细信息。

**参数**：
- `projectPath` (string): 项目路径，格式：`owner/repo`
- `mergeRequestIid` (number): 合并请求的内部 ID

**返回示例**：
```json
{
  "id": 123456,
  "iid": 42,
  "title": "feat: 添加用户认证功能",
  "description": "功能描述...",
  "state": "opened",
  "author": {
    "username": "developer",
    "name": "张三"
  },
  "source_branch": "feature/user-auth",
  "target_branch": "main",
  "web_url": "https://gitlab.com/company/project/-/merge_requests/42"
}
```

### 2. get_merge_request_changes

获取合并请求的文件变更列表。

**参数**：
- `projectPath` (string): 项目路径
- `mergeRequestIid` (number): 合并请求 ID
- `includeContent` (boolean, 可选): 是否包含 diff 内容，默认 false
- `focusFiles` (string[], 可选): 重点关注的文件列表

**返回示例**：
```json
{
  "changes": [
    {
      "old_path": "src/auth/login.ts",
      "new_path": "src/auth/login.ts",
      "new_file": false,
      "deleted_file": false,
      "diff": "@@ -10,6 +10,8 @@ export class AuthService {\n+  // 添加JWT验证\n+  const token = this.jwtService.sign(payload);"
    }
  ],
  "summary": {
    "totalFiles": 8,
    "additions": 120,
    "deletions": 30,
    "modifiedFiles": ["src/auth/login.ts"],
    "newFiles": ["src/auth/jwt.service.ts"],
    "deletedFiles": []
  }
}
```

### 3. list_merge_requests

列出项目的合并请求。

**参数**：
- `projectPath` (string): 项目路径
- `state` (string, 可选): 状态筛选 - `opened`, `closed`, `merged`, `all`，默认 `opened`
- `perPage` (number, 可选): 每页数量，默认 20

### 4. update_merge_request_description

更新合并请求描述，支持 Markdown 格式。

**参数**：
- `projectPath` (string): 项目路径
- `mergeRequestIid` (number): 合并请求 ID
- `description` (string): 新的描述内容

### 5. get_file_content

获取项目中指定文件的内容。

**参数**：
- `projectPath` (string): 项目路径
- `filePath` (string): 文件路径，如 `src/components/Button.tsx`
- `ref` (string, 可选): 分支、标签或 commit SHA，默认 `main`

### 6. analyze_mr_changes

分析合并请求的文件变更，为代码审查提供基础数据。

**参数**：
- `projectPath` (string): 项目路径
- `mergeRequestIid` (number): 合并请求 ID
- `focusFiles` (string[], 可选): 重点关注的文件列表

**返回示例**：
```json
{
  "merge_request": {
    "title": "feat: 添加新功能",
    "author": "developer",
    "source_branch": "feature/new-feature",
    "target_branch": "main"
  },
  "analysis_summary": {
    "total_files": 15,
    "reviewed_files": 8,
    "total_issues": 5,
    "issues_by_severity": {
      "critical": 1,
      "warning": 2,
      "suggestion": 2
    }
  }
}
```

### 7. push_code_review_comments

将代码审查评论推送到 GitLab MR，支持行内评论。

**参数**：
- `projectPath` (string): 项目路径
- `mergeRequestIid` (number): 合并请求 ID
- `reviewComments` (array): 审查评论列表
  - `filePath` (string): 文件路径
  - `lineNumber` (number, 可选): 行号
  - `severity` (string): 严重级别 - `critical`, `warning`, `suggestion`
  - `title` (string): 问题标题
  - `description` (string): 问题描述
  - `suggestion` (string): 修改建议
- `summaryComment` (string, 可选): 总体审查评论
- `commentStyle` (string, 可选): 评论风格 - `detailed`, `summary`, `minimal`

**使用示例**：
```json
{
  "projectPath": "company/project",
  "mergeRequestIid": 123,
  "reviewComments": [
    {
      "filePath": "src/auth/login.ts",
      "lineNumber": 45,
      "severity": "critical",
      "title": "SQL注入风险",
      "description": "直接拼接用户输入存在安全风险",
      "suggestion": "使用参数化查询防止SQL注入"
    }
  ],
  "summaryComment": "## 代码审查总结\n\n发现1个严重问题，建议修复后合并。"
}
```

### 8. get_file_code_review_rules

根据文件类型获取代码审查规则。

**参数**：
- `filePath` (string): 文件路径
- `fileExtension` (string, 可选): 文件扩展名

## 使用示例

### 在 Cursor 中使用

**获取 MR 信息**：
```text
请获取项目 company/awesome-project 中 MR #123 的详细信息
```

**查看文件变更**：
```text
请查看项目 company/awesome-project 中 MR #123 的文件变更，包含 diff 内容
```

**完整代码审查**：
```text
请分析项目 company/awesome-project 中 MR #123 的所有变更，
按照项目代码规范进行全面的代码审查，生成行内评论并推送到 GitLab
```

**生成 MR 描述**：
```text
查看项目 company/awesome-project MR #123 的变更内容，
按照规范生成 MR 描述文档，并更新到 GitLab
```

## 代码审查工作流

### 完整工作流程

1. **获取变更信息**
   ```text
   请获取项目 xxx 中 MR #123 的所有变更
   ```

2. **分析代码变更**
   ```text
   请分析这些变更，检查代码质量和潜在问题
   ```

3. **推送审查评论**
   ```text
   请将审查结果作为行内评论推送到 GitLab
   ```

### 评论分级策略

| 级别 | 图标 | 说明 | 处理方式 |
|------|------|------|----------|
| Critical | 🚨 | 严重问题 | 必须修复 |
| Warning | ⚠️ | 警告问题 | 建议修复 |
| Suggestion | 💡 | 改进建议 | 可选优化 |

### 评论格式示例

行内评论：
```markdown
### 🚨 **SQL注入风险**

> 🔴 **Critical** · 安全

直接拼接用户输入到查询中存在安全风险

**🔧 修复建议**
使用参数化查询或 ORM 防止 SQL 注入

---
*安全 | AI Code Review*
```

## 最佳实践

### 1. 代码审查规范

- **分级处理**：按照 severity 级别优先处理
- **精确定位**：使用行号进行精确的问题定位
- **建设性建议**：每个问题都提供具体的修复建议

### 2. 使用建议

- **批量处理**：一次性分析所有变更，避免多次调用
- **聚焦重点**：使用 focusFiles 参数关注重要文件
- **及时反馈**：及时推送审查结果，便于开发者修复

### 3. 性能优化

- **文件过滤**：自动过滤不需要审查的文件类型（如 lock 文件）
- **并发控制**：内置速率限制避免 API 限制
- **错误重试**：失败请求自动重试机制

## 故障排除

### 常见问题

#### 1. 连接失败

**症状**：GitLab 连接测试失败

**解决方案**：
```bash
# 检查环境变量
echo $GITLAB_HOST
echo $GITLAB_TOKEN

# 测试网络连接
curl -H "Authorization: Bearer $GITLAB_TOKEN" "$GITLAB_HOST/api/v4/user"
```

#### 2. 权限不足

**症状**：403 Forbidden 或权限错误

**解决方案**：
- 确保 token 具有 `api`, `read_repository`, `write_repository` 权限
- 检查是否有访问目标项目的权限
- 验证 token 是否已过期

#### 3. 项目路径错误

**症状**：404 Project Not Found

**解决方案**：
- 确保项目路径格式正确：`owner/project-name`
- 对于群组项目，使用完整路径：`group/subgroup/project`

#### 4. 行内评论失败

**症状**：评论推送失败或位置错误

**解决方案**：
- 确认文件路径和行号准确性
- 检查 GitLab 版本是否支持 Discussions API（13.0+）
- 使用 `debug_mr_sha_info` 工具调试

### 调试技巧

1. **查看日志**：服务器在 stderr 输出日志信息
2. **测试连接**：使用 `node dist/src/index.js` 直接测试
3. **验证环境**：确保所有环境变量正确设置

---

**相关文档**：
- [配置指南](./configuration.md)
- [API 参考](./api-reference.md)
- [开发文档](./development/README.md)
