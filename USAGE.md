# GitLab MCP 服务器使用文档

## 概述

GitLab MCP 服务器是一个基于 Model Context Protocol (MCP) 的 GitLab 集成工具，支持合并请求管理、文件操作和智能代码审查功能。结合AI助手，可以实现自动化的代码审查工作流程。

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

### 1. 合并请求基础操作

#### 获取合并请求信息
```bash
# 获取指定 MR 的详细信息
get_merge_request projectPath="owner/repo" mergeRequestIid=123
```

#### 获取合并请求变更
```bash
# 获取 MR 的文件变更和差异
get_merge_request_changes projectPath="owner/repo" mergeRequestIid=123 includeContent=true
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

### 3. 智能代码审查功能

#### 分析MR变更
```bash
# 分析合并请求的文件变更和差异信息，为代码审查提供基础数据
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
      },
      "raw_diff": "@@ -20,5 +20,7 @@ export function Button() {\n+  const handleClick = () => {\n+    onClick?.();\n+  };\n   return ("
    }
  ],
  "analyzed_at": "2024-01-16T14:45:00.000Z"
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
  "message": "已成功推送 2 条代码审查评论到 MR #123",
  "pushed_at": "2024-01-16T14:45:00.000Z"
}
```

#### 过滤可审查文件
```bash
# 根据配置规则过滤出需要代码审查的文件
filter_reviewable_files projectPath="owner/repo" mergeRequestIid=123 focusFiles=["src/"]
```

**返回结果示例：**
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

#### 获取文件代码审查规则
```bash
# 根据文件类型获取相应的代码审查规则
get_file_code_review_rules filePath="src/component.tsx"
```

**返回结果示例：**
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

#### 调试行内评论问题
```bash
# 检查合并请求的版本信息、diff_refs和commits，用于调试行内评论问题
debug_mr_sha_info projectPath="owner/repo" mergeRequestIid=123
```

**返回结果示例：**
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

## 完整工作流程示例

### 1. AI代码审查工作流

在Cursor中使用自然语言进行代码审查：

```
请分析项目 gdesign/meta 中 MR #11401 的所有变更，并按照项目代码规范进行全面的代码审查
```

**完整的工作流程包括：**

1. **自动分析**: 系统自动调用 `analyze_mr_changes` 分析变更
2. **智能审查**: AI基于分析结果和项目规范进行代码审查
3. **生成评论**: 自动生成分级的审查评论
4. **推送评论**: 调用 `push_code_review_comments` 推送到GitLab

### 2. 手动代码审查流程

```typescript
// 1. 分析MR变更
const analysis = await analyzeMrChanges("owner/repo", 123);

// 2. 基于分析结果进行代码审查
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

### 3. 评论分级策略

- **🚨 Critical问题 + 有行号** → 行内评论（精确定位到代码行）
- **⚠️ Warning问题 + 有行号** → 行内评论  
- **💡 Suggestion问题** → 文件级评论
- **📋 总结类问题** → 汇总到总体报告

### 4. 评论格式

#### 行内评论格式：
```markdown
### 🚨 **SQL注入风险**

> 🔴 **Critical** · 安全

直接拼接用户输入到查询中存在安全风险

**🔧 修复建议**
使用参数化查询或ORM防止SQL注入

---
*安全 | AI Code Review*
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
- **优雅降级**: 行内评论失败时自动转为文件级评论

### 🔧 行内评论问题修复

根据[GitLab Discussions API文档](https://docs.gitlab.com/api/discussions/)，已修复行内评论的技术问题：

#### 解决方案
- ✅ 使用**Merge Request Versions API**获取正确的SHA值
- ✅ 自动获取base_sha、start_sha、head_sha
- ✅ 多重备用方案确保评论成功推送
- ✅ 详细的调试工具和错误日志

#### 🛠️ 多重备用方案

系统实现了3种获取SHA的方法：

1. **优先：Versions API** (最准确)
2. **备用：MR diff_refs** (通常可用)  
3. **最后：Commits API** (备用方案)

## 最佳实践

### 1. 代码审查规范

- **分级审查**: 按照severity分级处理问题
- **精确定位**: 使用行号进行精确的问题定位
- **建设性建议**: 每个问题都提供具体的修复建议
- **分类管理**: 按照问题类型进行分类统计

### 2. 使用建议

- **批量处理**: 一次性分析所有变更，避免多次调用
- **聚焦重点**: 使用focusFiles参数关注重要文件
- **规范用词**: 使用标准的severity级别和category分类
- **及时反馈**: 及时推送审查结果，便于开发者修复

### 3. 性能优化

- **文件过滤**: 自动过滤不需要审查的文件类型
- **并发控制**: 内置速率限制避免API限制
- **缓存机制**: 重复分析时使用缓存数据
- **错误重试**: 失败请求自动重试机制

## 注意事项

1. **访问权限**: 确保GitLab访问令牌有足够的权限（api, read_repository, write_repository）
2. **速率限制**: 大量评论推送会自动添加延迟避免触发GitLab API限制
3. **行号准确性**: 行内评论需要准确的行号，建议基于diff分析结果
4. **文件过滤**: 系统会自动过滤不支持的文件类型和大文件
5. **版本兼容**: 确保GitLab版本支持Discussions API（GitLab 13.0+）
6. **评论格式**: 支持Markdown格式，可以使用表情符号和格式化文本
7. **调试工具**: 遇到问题时可以使用 `debug_mr_sha_info` 工具进行调试

## 故障排除

### 常见问题

1. **行内评论推送失败**
   - 使用 `debug_mr_sha_info` 检查SHA信息
   - 确认文件路径和行号准确性
   - 检查GitLab版本是否支持Discussions API

2. **权限不足错误**
   - 确认token具有 `write_repository` 权限
   - 检查对目标项目的访问权限

3. **评论格式问题**
   - 确保使用正确的Markdown语法
   - 避免使用不支持的HTML标签

4. **API限制**
   - 系统自动处理速率限制
   - 大批量操作会自动添加延迟 