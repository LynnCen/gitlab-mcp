# API 参考文档

## 概述

GitLab MCP Server v2.0 提供三种核心能力：**Tools（工具）**、**Resources（资源）** 和 **Prompts（提示）**。

## Tools（工具）

工具是 AI 可以调用的功能接口，用于执行操作或获取动态数据。

### GitLab MR 工具

#### get_merge_request

获取合并请求详情。

**参数**:
- `projectPath` (string, 必需): 项目路径，格式：`owner/repo` 或 `group/subgroup/repo`
- `mergeRequestIid` (number, 必需): 合并请求的内部 ID

**返回**:
```json
{
  "id": 123,
  "iid": 1,
  "title": "Feature: Add new functionality",
  "description": "Description of the MR",
  "state": "opened",
  "author": { ... },
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**示例**:
```json
{
  "projectPath": "gdesign/meta",
  "mergeRequestIid": 10821
}
```

#### get_merge_request_changes

获取合并请求的变更列表。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `mergeRequestIid` (number, 必需): 合并请求的内部 ID
- `includeContent` (boolean, 可选): 是否包含文件内容，默认 `false`

**返回**:
```json
{
  "changes": [
    {
      "old_path": "src/old.ts",
      "new_path": "src/new.ts",
      "new_file": false,
      "deleted_file": false,
      "renamed_file": false,
      "diff": "+new line\n-old line"
    }
  ],
  "summary": {
    "total_files": 5,
    "added_files": 2,
    "modified_files": 2,
    "deleted_files": 1
  }
}
```

#### list_merge_requests

列出项目的合并请求。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `state` (string, 可选): 状态过滤，可选值：`opened`, `closed`, `merged`, `all`，默认 `opened`
- `perPage` (number, 可选): 每页数量，默认 20
- `page` (number, 可选): 页码，默认 1

**返回**:
```json
{
  "total": 10,
  "merge_requests": [ ... ]
}
```

#### update_merge_request_description

更新合并请求描述。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `mergeRequestIid` (number, 必需): 合并请求的内部 ID
- `description` (string, 必需): 新的描述内容（支持 Markdown）

**返回**: 更新后的合并请求对象

### GitLab File 工具

#### get_file_content

获取文件内容。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `filePath` (string, 必需): 文件路径（相对于项目根目录）
- `ref` (string, 可选): 分支、标签或 commit SHA，默认 `main`

**返回**:
```json
{
  "file_name": "src/index.ts",
  "file_path": "src/index.ts",
  "size": 1024,
  "encoding": "base64",
  "content": "file content",
  "ref": "main",
  "commit_id": "abc123..."
}
```

### GitLab Code Review 工具

#### analyze_mr_changes

分析合并请求变更，生成代码审查分析。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `mergeRequestIid` (number, 必需): 合并请求的内部 ID
- `focusFiles` (string[], 可选): 重点关注的文件列表

**返回**:
```json
{
  "merge_request": { ... },
  "analysis_summary": {
    "total_files": 5,
    "reviewable_files": 3,
    "issues_found": 10
  },
  "file_analysis": [
    {
      "file_path": "src/index.ts",
      "issues": [ ... ]
    }
  ]
}
```

#### push_code_review_comments

推送代码审查评论到 GitLab。

**参数**:
- `projectPath` (string, 必需): 项目路径
- `mergeRequestIid` (number, 必需): 合并请求的内部 ID
- `reviewComments` (array, 必需): 审查评论列表
  - `filePath` (string, 必需): 文件路径
  - `lineNumber` (number, 可选): 行号（用于行内评论）
  - `severity` (string, 必需): 严重级别，可选值：`critical`, `warning`, `suggestion`
  - `title` (string, 必需): 问题标题
  - `description` (string, 必需): 问题描述
  - `suggestion` (string, 可选): 修改建议
- `summaryComment` (string, 可选): 总体审查评论
- `commentStyle` (string, 可选): 评论风格，可选值：`detailed`, `summary`, `minimal`，默认 `detailed`

**返回**:
```json
{
  "success": true,
  "comments_pushed": 10,
  "discussions_created": 5
}
```

#### get_file_code_review_rules

获取文件的代码审查规则。

**参数**:
- `filePath` (string, 必需): 文件路径
- `fileExtension` (string, 必需): 文件扩展名（如 `.ts`, `.vue`）

**返回**:
```json
{
  "file_path": "src/index.ts",
  "rules": [
    {
      "id": "typescript-no-any",
      "name": "禁止使用 any 类型",
      "description": "...",
      "severity": "warning"
    }
  ]
}
```

## Resources（资源）

资源是服务器提供给 AI 模型的上下文数据，可以通过 URI 直接访问。

### 项目资源

**URI**: `gitlab://projects/{projectPath}`

获取项目信息。

**示例**: `gitlab://projects/gdesign/meta`

### 合并请求资源

**URI**: `gitlab://projects/{projectPath}/mrs/{iid}`

获取合并请求详情。

**示例**: `gitlab://projects/gdesign/meta/mrs/10821`

### 合并请求变更资源

**URI**: `gitlab://projects/{projectPath}/mrs/{iid}/changes`

获取合并请求变更列表。

**示例**: `gitlab://projects/gdesign/meta/mrs/10821/changes`

### 文件资源

**URI**: `gitlab://projects/{projectPath}/files/{filePath}?ref={ref}`

获取文件内容。

**示例**: `gitlab://projects/gdesign/meta/files/src/index.ts?ref=main`

### 代码审查规则资源

**URI**: `gitlab://code-review-rules`

获取所有代码审查规则。

## Prompts（提示）

提示是预定义的提示词模板，帮助 AI 更好地理解任务场景。

### mr-description

生成合并请求描述的提示模板。

**参数**:
- `style` (string, 可选): 描述风格，可选值：`detailed`, `summary`, `minimal`，默认 `detailed`
- `mergeRequest` (object, 必需): 合并请求对象
- `changes` (object, 可选): 变更信息

**示例输出**:
```
# 合并请求描述

## 概述
本次合并请求实现了...

## 变更内容
- 新增功能：...
- 修复问题：...

## 测试
- [x] 单元测试通过
- [x] 集成测试通过
```

### code-review-typescript

TypeScript 代码审查提示模板。

**参数**:
- `filePath` (string, 必需): 文件路径
- `fileContent` (string, 必需): 文件内容
- `diff` (string, 可选): 变更差异

### code-review-vue

Vue 代码审查提示模板。

**参数**:
- `filePath` (string, 必需): 文件路径
- `fileContent` (string, 必需): 文件内容
- `diff` (string, 可选): 变更差异

## 错误处理

所有工具和资源在出错时都会返回标准化的错误信息：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

### 错误码

- `NOT_FOUND_PROJECT`: 项目不存在或无权访问
- `NOT_FOUND_MERGE_REQUEST`: 合并请求不存在或无权访问
- `NOT_FOUND_RESOURCE`: 资源不存在或无权访问
- `GITLAB_API_ERROR`: GitLab API 调用失败
- `GITLAB_AUTH_FAILED`: GitLab 认证失败
- `VALIDATION_ERROR`: 参数验证失败

## 使用示例

### 使用工具

```typescript
// 获取合并请求
const result = await toolRegistry.executeTool('get_merge_request', {
  projectPath: 'gdesign/meta',
  mergeRequestIid: 10821
});
```

### 访问资源

```typescript
// 获取资源内容
const resource = resourceRegistry.getResource('gitlab://projects/gdesign/meta');
const content = await resource.getContent();
```

### 渲染提示

```typescript
// 渲染提示模板
const prompt = promptRegistry.getPrompt('mr-description');
const rendered = await prompt.render({
  style: 'detailed',
  mergeRequest: { ... },
  changes: { ... }
});
```

