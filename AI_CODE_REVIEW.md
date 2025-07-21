# AI代码审查功能使用指南

## 📖 功能概述

基于现代AI技术的智能代码审查工具，结合Cursor AI Code Review最佳实践，为GitLab MR提供自动化、高质量的代码审查服务。

## 🚀 快速开始

### 1. 环境配置

在 `.env` 文件中添加AI代码审查配置：

```bash
# 启用AI代码审查
AI_CODE_REVIEW_ENABLED=true

# AI服务提供商 (openai | claude | gemini | local)
AI_PROVIDER=local

# API密钥 (如果使用云服务)
AI_API_KEY=your_api_key_here

# 模型配置
AI_MODEL=gpt-3.5-turbo
AI_TEMPERATURE=0.1
AI_MAX_TOKENS=4000

# 自动评论设置
AI_AUTO_COMMENT=false

# 审查深度 (quick | standard | thorough)
AI_REVIEW_DEPTH=standard
```

### 2. 启动服务

```bash
npm run dev
# 或
pnpm dev
```

## 🛠️ 可用工具

### 1. `ai_code_review` - 主要AI代码审查工具

对指定的GitLab MR进行全面的AI代码审查。

**参数：**
- `projectPath` (必需): 项目路径，格式如 `owner/repo`
- `mergeRequestIid` (必需): 合并请求的内部ID
- `autoComment` (可选): 是否自动添加评论到MR，默认 `false`
- `reviewDepth` (可选): 审查深度，可选值 `quick`、`standard`、`thorough`，默认 `standard`
- `focusFiles` (可选): 重点审查的文件列表
- `commentStyle` (可选): 评论风格，可选值 `detailed`、`summary`、`minimal`，默认 `detailed`

**使用示例：**

```json
{
  "projectPath": "gdesign/meta",
  "mergeRequestIid": 11291,
  "autoComment": true,
  "reviewDepth": "thorough",
  "focusFiles": ["src/hooks/use-ai-video.ts"],
  "commentStyle": "detailed"
}
```

### 2. `get_file_code_review_rules` - 获取文件审查规则

根据文件类型获取相应的代码审查规则。

**参数：**
- `filePath` (必需): 文件路径
- `fileExtension` (可选): 文件扩展名

### 3. `push_review_comments` - 手动推送评论

将代码审查结果手动推送到GitLab MR。

**参数：**
- `projectPath` (必需): 项目路径
- `mergeRequestIid` (必需): MR ID
- `reviewResults` (必需): 审查结果JSON字符串
- `reviewReport` (可选): 审查报告JSON字符串
- `commentStyle` (可选): 评论风格

### 4. `filter_reviewable_files` - 过滤可审查文件

根据配置规则过滤出需要代码审查的文件。

## 📋 审查规则

### 支持的文件类型

- **TypeScript** (`.ts`, `.tsx`)
- **JavaScript** (`.js`, `.jsx`)
- **Vue** (`.vue`)
- **Python** (`.py`)
- **Java** (`.java`)
- **C#** (`.cs`)
- **Go** (`.go`)
- **Rust** (`.rs`)

### 自动排除的文件

- `node_modules/`、`dist/`、`build/` 等构建目录
- 测试文件 (`.test.js`, `.spec.ts` 等)
- 配置文件 (`.config.js` 等)
- 文档文件 (`.md`, `README` 等)
- 锁定文件 (`package-lock.json`, `yarn.lock` 等)

### 审查重点

#### TypeScript/JavaScript
- 类型安全
- 性能优化
- 错误处理
- 代码规范
- ES6+语法使用

#### Vue
- 组件设计
- 性能优化
- Vue最佳实践
- 可访问性

#### 通用规则
- 代码可读性
- 维护性
- 安全性
- 架构合理性

## 🎯 审查深度说明

### Quick (快速)
- 基础语法检查
- 明显错误识别
- 关键安全问题

### Standard (标准)
- 代码质量评估
- 性能问题识别
- 最佳实践检查
- 安全漏洞扫描

### Thorough (深入)
- 全面代码分析
- 架构设计评估
- 详细优化建议
- 边界条件检查

## 📊 输出示例

### 审查报告示例

```json
{
  "merge_request": {
    "title": "feat：AI视频适配最大轮训时间",
    "author": "lincen",
    "source_branch": "bugfix/lincen/ai-video-polling",
    "target_branch": "master",
    "web_url": "https://gitlab.example.com/project/-/merge_requests/123"
  },
  "review_summary": {
    "summary": {
      "files_reviewed": 3,
      "total_issues": 5,
      "critical_issues": 0,
      "warnings": 2,
      "suggestions": 3,
      "average_score": 85,
      "overall_status": "WARNING"
    },
    "recommendations": [
      "⚡ 发现 2 个性能相关问题，建议优化",
      "📚 建议为配置变更添加相应文档"
    ]
  },
  "detailed_results": [
    {
      "file_path": "src/hooks/use-ai-video.ts",
      "overall_score": 82,
      "issues": [
        {
          "line_number": 32,
          "severity": "warning",
          "category": "性能优化",
          "title": "硬编码的轮询间隔时间",
          "description": "轮询间隔时间被硬编码，不便于配置调整",
          "suggestion": "将轮询配置提取到配置文件或环境变量中",
          "auto_fixable": false,
          "rule_source": "配置管理最佳实践"
        }
      ],
      "suggestions": [
        "考虑添加错误重试机制",
        "建议添加超时处理逻辑"
      ],
      "compliance_status": "WARNING"
    }
  ]
}
```

### GitLab评论示例

**总体报告评论：**

```markdown
## 🤖 AI代码审查详细报告

### 📊 审查概况
- **审查文件**: 3 个
- **总体评分**: 85/100 ⭐
- **审查状态**: ⚠️ **WARNING**

### 🔍 问题分析
| 类型 | 数量 | 说明 |
|------|------|------|
| 🚨 严重问题 | 0 | 必须在合并前修复 |
| ⚠️ 警告 | 2 | 建议尽快处理 |
| 💡 建议 | 3 | 优化建议 |

### 📋 审查建议
- ⚡ 发现 2 个性能相关问题，建议优化
- 📚 建议为配置变更添加相应文档

### 🕒 审查信息
- **审查时间**: 2025-01-23 15:30:25
- **审查工具**: AI Code Reviewer v1.0
- **MR信息**: feat：AI视频适配最大轮训时间

---
> 这是AI自动生成的代码审查报告。如有疑问，请联系开发团队。
```

**问题评论示例：**

```markdown
### ⚠️ 硬编码的轮询间隔时间

**📁 文件**: `src/hooks/use-ai-video.ts` (第32行)

**📝 问题描述**: 轮询间隔时间被硬编码，不便于配置调整

**💡 修改建议**: 将轮询配置提取到配置文件或环境变量中

---
*分类: 性能优化 | 规则来源: 配置管理最佳实践*
```

## ⚙️ 高级配置

### 自定义审查规则

可以通过修改 `src/server/tools/ai-code-review.ts` 中的 `CODE_REVIEW_RULES` 来自定义审查规则：

```typescript
const CODE_REVIEW_RULES = {
  '.ts': {
    focus_areas: ['类型安全', '性能优化', '代码规范'],
    specific_rules: [
      '确保所有函数都有明确的返回类型',
      '避免使用 any 类型'
    ],
    severity_mapping: {
      'any类型使用': 'warning',
      '未处理的Promise': 'critical'
    }
  }
};
```

### 文件过滤配置

通过 `FILE_FILTER_CONFIG` 自定义文件过滤规则：

```typescript
const FILE_FILTER_CONFIG = {
  includedExtensions: ['.ts', '.js', '.vue'],
  excludePatterns: [/node_modules/, /\.test\./],
  maxFileSize: 100 * 1024, // 100KB
  maxDiffLines: 500
};
```

## 🔧 故障排除

### 常见问题

1. **AI服务不可用**
   - 检查 `AI_CODE_REVIEW_ENABLED` 是否设置为 `true`
   - 验证 API 密钥是否正确
   - 确认网络连接

2. **无法添加评论**
   - 检查 GitLab 令牌权限
   - 确认项目访问权限
   - 验证 MR 状态

3. **文件被跳过**
   - 检查文件类型是否支持
   - 验证文件大小限制
   - 查看排除模式

### 调试模式

启用调试模式获取详细日志：

```bash
DEBUG=true npm run dev
```

## 🤝 贡献指南

欢迎贡献代码和建议！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支
3. 编写测试
4. 提交 Pull Request

## 📄 许可证

MIT License

---

*基于 Cursor AI Code Review 最佳实践构建* 