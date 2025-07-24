# GitLab MCP 服务器使用文档

## 概述

GitLab MCP 服务器是一个基于 Model Context Protocol (MCP) 的 GitLab 集成工具，支持合并请求管理、文件操作和代码审查功能。

## 环境配置

### 环境变量

```bash
GITLAB_HOST=https://gitlab.com  # GitLab 主机地址
GITLAB_TOKEN=your_access_token  # GitLab 访问令牌
```

### 配置 Cursor

在 Cursor 的 MCP 配置中添加：

```json
{
    "gitlab-mcp": {
      "command": "node",
    "args": ["dist/src/index.js"],
      "env": {
        "GITLAB_HOST": "https://gitlab.com",
      "GITLAB_TOKEN": "your_access_token"
    }
  }
}
```

## 功能模块

### 1. 合并请求操作

#### 获取合并请求信息
```bash
# 获取指定 MR 的详细信息
get_merge_request projectPath="owner/repo" mergeRequestIid=123
```

#### 获取合并请求变更
```bash
# 获取 MR 的文件变更和差异
get_merge_request_changes projectPath="owner/repo" mergeRequestIid=123
```

#### 列出合并请求
```bash
# 列出项目的合并请求
list_merge_requests projectPath="owner/repo" state="opened" perPage=20
```

#### 更新合并请求描述
```bash
# 更新 MR 描述
update_merge_request_description projectPath="owner/repo" mergeRequestIid=123 description="新的描述内容"
```

### 2. 文件操作

#### 获取文件内容
```bash
# 获取项目文件内容
get_file_content projectPath="owner/repo" filePath="src/main.ts" ref="main"
```

### 3. 代码审查功能（新增）

#### 分析MR变更
```bash
# 分析合并请求的文件变更和差异信息
analyze_mr_changes projectPath="owner/repo" mergeRequestIid=123 focusFiles=["src/","tests/"]
```

**返回结果示例：**
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
      }
    }
  ]
}
```

#### 推送代码审查评论
```bash
# 将cursor生成的代码审查评论推送到GitLab MR
push_code_review_comments projectPath="owner/repo" mergeRequestIid=123
```

**参数说明：**
- `reviewComments`: 评论列表数组
  - `filePath`: 文件路径
  - `lineNumber`: 行号（可选，用于行内评论）
  - `severity`: 问题严重级别 ("critical", "warning", "suggestion")
  - `title`: 问题标题
  - `description`: 问题描述
  - `suggestion`: 修改建议
  - `category`: 问题分类（可选）
  - `autoFixable`: 是否可自动修复（可选）
- `summaryComment`: 总体审查评论（可选）
- `commentStyle`: 评论风格（"detailed", "summary", "minimal"）

**使用示例：**
```json
{
  "projectPath": "owner/repo",
  "mergeRequestIid": 123,
  "reviewComments": [
    {
      "filePath": "src/components/Button.tsx",
      "lineNumber": 23,
      "severity": "warning",
      "title": "缺少错误处理",
      "description": "点击处理函数缺少错误处理机制",
      "suggestion": "添加try-catch包装或错误边界处理",
      "category": "错误处理",
      "autoFixable": false
    },
    {
      "filePath": "src/utils/api.ts",
      "lineNumber": 45,
      "severity": "critical",
      "title": "潜在的安全漏洞",
      "description": "直接拼接用户输入到SQL查询中",
      "suggestion": "使用参数化查询或ORM来防止SQL注入",
      "category": "安全",
      "autoFixable": false
    }
  ],
  "summaryComment": "## 🤖 代码审查总结\n\n本次审查发现2个问题，建议在合并前修复critical级别的安全问题。",
  "commentStyle": "detailed"
}
```

**返回结果：**
```json
{
  "success": true,
  "summary": {
    "total_comments": 2,
    "successful_comments": 2,
    "failed_comments": 0,
    "inline_comments": 2,
    "file_comments": 0,
    "summary_comment_added": true
  },
  "message": "已成功推送 2 条代码审查评论到 MR #123"
}
```

#### 过滤可审查文件
```bash
# 根据配置规则过滤出需要代码审查的文件
filter_reviewable_files projectPath="owner/repo" mergeRequestIid=123 focusFiles=["src/"]
```

#### 获取文件代码审查规则
```bash
# 根据文件类型获取相应的代码审查规则
get_file_code_review_rules filePath="src/component.tsx"
```

## 完整工作流程示例

### 1. Cursor中进行代码审查

```typescript
// 1. 分析MR变更
const analysis = await analyzeMrChanges("owner/repo", 123);

// 2. Cursor基于分析结果进行代码审查
const reviewComments = [
  {
    filePath: "src/auth/login.ts",
    lineNumber: 45,
    severity: "critical",
    title: "SQL注入风险",
    description: "直接拼接用户输入到查询中存在安全风险",
    suggestion: "使用参数化查询或ORM防止SQL注入",
    category: "安全"
  },
  {
    filePath: "src/components/Form.tsx", 
    lineNumber: 67,
    severity: "warning",
    title: "缺少输入验证",
    description: "表单输入缺少客户端验证",
    suggestion: "添加输入格式验证和错误提示",
    category: "用户体验"
  }
];

// 3. 推送评论到GitLab
const result = await pushCodeReviewComments("owner/repo", 123, {
  reviewComments,
  summaryComment: "发现2个安全和用户体验问题，建议修复后合并",
  commentStyle: "detailed"
});
```

### 2. 评论分级策略

- **Critical问题 + 有行号** → 行内评论（精确定位到代码行）
- **Warning问题 + 有行号** → 行内评论  
- **其他问题** → 文件级评论
- **建议类问题** → 汇总到总体报告

### 3. 评论格式

#### 行内评论格式：
```markdown
🚨 **SQL注入风险**

直接拼接用户输入到查询中存在安全风险

**💡 建议**: 使用参数化查询或ORM防止SQL注入

---
*安全 | Cursor AI Review*
```

#### 总体报告格式：
```markdown
## 🤖 代码审查总结

本次审查发现以下问题：

### 🔍 问题统计
- 🚨 严重问题: 1个
- ⚠️ 警告: 1个
- 💡 建议: 0个

### 📋 主要建议
- 优先修复安全相关的critical问题
- 改善用户输入验证机制

---
> 这是AI自动生成的代码审查报告
```

## 错误处理

服务器包含完善的错误处理和重试机制：

- **自动重试**: 失败的API请求会自动重试最多3次
- **速率限制**: 内置速率限制防止触发GitLab API限制
- **错误恢复**: 批量操作中单个失败不会影响其他操作

### 🔧 行内评论问题修复

根据[GitLab Discussions API文档](https://docs.gitlab.com/api/discussions/)，我们已修复了行内评论"body invalid"的问题：

#### 问题原因
- 原来使用Commits API获取SHA值是不正确的
- 需要使用**Merge Request Versions API**获取正确的base_sha、start_sha、head_sha

#### 解决方案
```typescript
// ✅ 正确方式：使用MR Versions API
const versions = await getMergeRequestVersions(projectId, mrIid);
const position = {
  base_sha: versions[0].base_commit_sha,
  start_sha: versions[0].start_commit_sha, 
  head_sha: versions[0].head_commit_sha,
  position_type: 'text',
  new_path: filePath,
  new_line: lineNumber,
  old_path: filePath
};
```

#### 🔧 调试行内评论问题

如果仍然遇到 `"Cannot read properties of undefined (reading 'base_commit_sha')"` 错误，请使用调试工具：

```bash
# 1. 首先运行调试工具检查SHA信息
debug_mr_sha_info projectPath="owner/repo" mergeRequestIid=123
```

**调试工具会检查：**
- ✅ Versions API 响应数据结构
- ✅ MR diff_refs 字段
- ✅ Commits 信息
- ✅ 推荐使用的SHA获取方法

**示例调试输出：**
```json
{
  "versions": {
    "success": true,
    "data": [...],
    "latest_version": { /* 版本信息 */ }
  },
  "merge_request": {
    "success": true,
    "diff_refs": {
      "base_sha": "abc123...",
      "start_sha": "def456...",
      "head_sha": "ghi789..."
    }
  },
  "sha_analysis": {
    "available_sources": [
      {
        "method": "versions_api",
        "priority": 1,
        "complete": true
      }
    ],
    "recommended_method": "versions_api"
  }
}
```

#### 🛠️ 多重备用方案

现在的实现包含3种获取SHA的方法：

1. **优先：Versions API** (最准确)
   ```typescript
   const versions = await getMergeRequestVersions(projectId, mrIid);
   ```

2. **备用：MR diff_refs** (通常可用)
   ```typescript
   const mr = await getMergeRequest(projectId, mrIid);
   const sha = mr.diff_refs.base_sha;
   ```

3. **最后：Commits API** (备用方案)
   ```typescript
   const commits = await getMergeRequestCommits(projectId, mrIid);
   ```

#### API支持确认
- ✅ GitLab API完全支持行内评论
- ✅ 使用`POST /projects/:id/merge_requests/:merge_request_iid/discussions`
- ✅ @gitbeaker/rest库完全兼容
- ✅ 自动获取正确的SHA值和构建position参数
- ✅ 详细的错误日志和调试信息

## 注意事项

1. **访问权限**: 确保GitLab访问令牌有足够的权限
2. **速率限制**: 大量评论推送会自动添加延迟避免触发限制
3. **行号准确性**: 行内评论需要准确的行号，建议基于diff分析结果
4. **文件过滤**: 系统会自动过滤不支持的文件类型和大文件
5. **版本兼容**: 确保GitLab版本支持Discussions API（GitLab 13.0+） 