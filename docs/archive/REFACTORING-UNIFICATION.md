# GitLab MCP Server 架构统一改造方案

> **文档版本**: 1.0  
> **创建日期**: 2026-01-27  
> **状态**: 待执行

---

## 目录

- [一、问题诊断](#一问题诊断)
- [二、当前架构对比分析](#二当前架构对比分析)
- [三、统一化改造方案](#三统一化改造方案)
- [四、执行计划](#四执行计划)
- [五、清理清单](#五清理清单)
- [六、验收标准](#六验收标准)

---

## 一、问题诊断

### 1.1 核心问题概述

项目在进行 v1 → v2 的架构重构过程中中断，导致以下严重问题：

| 问题类别 | 严重程度 | 描述 |
|---------|---------|------|
| 版本共存 | 🔴 严重 | `src/` 和 `src-v2/` 两套代码并行存在 |
| 入口混乱 | 🔴 严重 | `package.json` 指向 v1，但版本号已是 2.0.0 |
| 配置分裂 | 🟠 中等 | 两套 TypeScript 配置并存 |
| 测试分散 | 🟠 中等 | `tests/` 和 `tests-v2/` 两套测试 |
| 类型安全 | 🟡 一般 | v2 大量使用 `@ts-nocheck` 和 `as any` |
| 文档过时 | 🟡 一般 | 架构文档与实际代码不匹配 |

### 1.2 详细问题清单

#### 1.2.1 目录结构混乱

```
gitlab-mcp/
├── src/                    ❌ v1 旧代码（应删除）
│   ├── index.ts            ❌ v1 入口
│   ├── config/             ❌ v1 配置
│   ├── gitlab/             ❌ v1 GitLab 客户端
│   ├── mcp/                ❌ v1 MCP 工具
│   ├── server/             ❌ v1 服务器实现
│   └── utils/              ❌ v1 工具函数
│
├── src-v2/                 ✅ v2 新代码（应成为唯一）
│   ├── index.ts            ✅ v2 入口
│   ├── bootstrap/          ✅ 启动逻辑
│   ├── cache/              ✅ 缓存系统
│   ├── capabilities/       ✅ MCP 能力层
│   ├── config/             ✅ 配置管理
│   ├── core/               ✅ 核心框架
│   ├── errors/             ✅ 错误处理
│   ├── logging/            ✅ 日志系统
│   ├── plugins/            ✅ 插件实现
│   ├── repositories/       ✅ 数据访问层
│   ├── services/           ✅ 业务服务层
│   ├── transport/          ✅ 传输层
│   └── utils/              ✅ 工具函数
│
├── tests/                  ❌ v1 测试（应删除或迁移）
├── tests-v2/               ✅ v2 测试（应成为唯一）
│
├── tsconfig.json           ❌ v1 配置（应更新）
├── tsconfig-v2.json        ❌ v2 临时配置（应删除）
```

#### 1.2.2 package.json 配置冲突

```json
// 当前状态 - 存在冲突
{
  "version": "2.0.0",                       // ✅ 版本已更新
  "main": "dist/src/index.js",              // ❌ 指向 v1
  "bin": {
    "gitlab-mcp": "dist/src/index.js"       // ❌ 指向 v1
  },
  "scripts": {
    "build": "... tsc ...",                 // ❌ 构建 v1
    "build:v2": "... tsc -p tsconfig-v2.json ...",  // ⚠️ 临时脚本
    "start": "node dist/src/index.js",      // ❌ 启动 v1
    "start:v2": "node dist/src-v2/index.js", // ⚠️ 临时脚本
    "test": "...",                          // ❌ v1 测试
    "test:v2": "vitest",                    // ⚠️ 临时脚本
  }
}
```

#### 1.2.3 TypeScript 类型安全问题

**受影响的 v2 文件（使用 `@ts-nocheck`）：**

- `src-v2/index.ts`
- `src-v2/logging/PinoLogger.ts`
- `src-v2/repositories/GitLabRepository.ts`
- `src-v2/bootstrap/registerTools.ts`
- `src-v2/config/ConfigManager.ts`
- `src-v2/core/server/MCPServer.ts`
- `src-v2/transport/WebSocketTransport.ts`

**问题原因：**

1. `@gitbeaker/rest` 库的类型定义与自定义接口不完全匹配
2. 为了快速推进开发，牺牲了类型安全性
3. 大量使用 `as any` 类型断言

#### 1.2.4 架构设计与实现不匹配

| 设计文档描述 | 实际实现 | 状态 |
|-------------|---------|------|
| 六层架构 | 部分实现 | ⚠️ |
| DI 容器 | 已移除 | ❌ |
| 中间件系统 | 已移除 | ❌ |
| 插件系统 | 简化版 | ⚠️ |
| HTTP/WebSocket 传输 | 未完成 | ❌ |
| stdio 传输 | 已实现 | ✅ |
| 认证/授权 | 未实现 | ❌ |
| 限流/缓存中间件 | 未实现 | ❌ |

---

## 二、当前架构对比分析

### 2.1 V1 架构（src/）

```
┌─────────────────────────────────────────┐
│           入口 (index.ts)                │
│  - 创建 ConfigManager                    │
│  - 创建 GitLabMcpServer                  │
│  - 连接 StdioServerTransport             │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      GitLabMcpServer (单体设计)          │
│  - 直接注册所有工具                       │
│  - 包含业务逻辑和 API 调用                │
│  - 紧耦合的模块结构                       │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         GitLabClient (数据访问)           │
│  - 所有 GitLab API 调用                   │
│  - 包含部分业务逻辑（如行内评论策略）       │
└─────────────────────────────────────────┘
```

**V1 特点：**
- ✅ 简单直接，易于理解
- ✅ 功能完整，可正常运行
- ❌ 可扩展性差
- ❌ 模块耦合度高
- ❌ 难以测试

### 2.2 V2 架构（src-v2/）

```
┌─────────────────────────────────────────┐
│           入口 (index.ts)                │
│  - 初始化所有服务                         │
│  - 创建注册表                            │
│  - 注册能力                              │
│  - 连接传输层                            │
└─────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ToolRegistry│ │ResourceRegistry│ │PromptRegistry│
│  8 个工具  │ │  5 个资源   │ │  3 个提示   │
└──────────┘ └──────────┘ └──────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│            服务层 (services/)            │
│  - MergeRequestService                  │
│  - FileOperationService                 │
│  - CodeReviewService                    │
│  - ProjectService                       │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         数据访问层 (repositories/)        │
│  - GitLabRepository                     │
│  - CacheRepository                      │
│  - ConfigRepository                     │
└─────────────────────────────────────────┘
```

**V2 特点：**
- ✅ 分层清晰
- ✅ 服务解耦
- ✅ 支持 Resources 和 Prompts
- ⚠️ 类型安全被牺牲
- ⚠️ 部分功能未完成
- ❌ 中间件系统未实现

### 2.3 功能对比

| 功能 | V1 | V2 | 说明 |
|-----|----|----|------|
| MR 工具（获取/列表/更新） | ✅ | ✅ | 功能等价 |
| 文件操作工具 | ✅ | ✅ | 功能等价 |
| 代码审查工具 | ✅ | ✅ | 功能等价 |
| Resources | ❌ | ✅ | V2 新增 |
| Prompts | ❌ | ✅ | V2 新增 |
| stdio 传输 | ✅ | ✅ | 功能等价 |
| HTTP 传输 | 部分 | ❌ | V1 有 Express，V2 未完成 |
| 结构化日志 | ❌ | ✅ | V2 使用 Pino |
| 统一错误处理 | ❌ | ✅ | V2 有 Error 类体系 |
| 缓存系统 | ❌ | ✅ | V2 有 MemoryCacheProvider |

---

## 三、统一化改造方案

### 3.1 改造目标

**核心原则：全面切换到 V2，删除 V1**

1. **统一代码目录**：`src-v2/` → `src/`
2. **统一配置文件**：合并 TypeScript 配置
3. **统一测试目录**：`tests-v2/` → `tests/`
4. **统一构建脚本**：移除所有 `:v2` 后缀脚本
5. **修复类型安全**：移除 `@ts-nocheck`，修复类型错误

### 3.2 改造步骤概览

```
Phase 1: 准备阶段
├── 1.1 备份当前代码
├── 1.2 运行所有测试确保 V2 功能正常
└── 1.3 记录功能基准

Phase 2: 目录统一
├── 2.1 删除 src/ (V1)
├── 2.2 重命名 src-v2/ → src/
├── 2.3 删除 tests/
├── 2.4 重命名 tests-v2/ → tests/
└── 2.5 更新所有导入路径

Phase 3: 配置统一
├── 3.1 合并 tsconfig 配置
├── 3.2 删除 tsconfig-v2.json
├── 3.3 更新 package.json 脚本
└── 3.4 更新 package.json 入口

Phase 4: 类型修复
├── 4.1 移除 @ts-nocheck
├── 4.2 修复类型错误
├── 4.3 替换 as any
└── 4.4 启用 strict 模式

Phase 5: 文档更新
├── 5.1 更新 architecture.md
├── 5.2 更新 README.md
├── 5.3 清理过时文档
└── 5.4 更新 CHANGELOG.md
```

### 3.3 目标目录结构

```
gitlab-mcp/
├── src/                        # 统一的源代码目录
│   ├── index.ts                # 主入口
│   ├── bootstrap/              # 启动引导
│   │   ├── index.ts
│   │   └── registerTools.ts
│   ├── cache/                  # 缓存系统
│   │   ├── index.ts
│   │   ├── CacheProvider.ts
│   │   └── MemoryCacheProvider.ts
│   ├── capabilities/           # MCP 能力层
│   │   ├── index.ts
│   │   ├── tools/
│   │   ├── resources/
│   │   └── prompts/
│   ├── config/                 # 配置管理
│   │   ├── index.ts
│   │   ├── ConfigManager.ts
│   │   ├── ConfigProvider.ts
│   │   ├── EnvConfigProvider.ts
│   │   └── types.ts
│   ├── core/                   # 核心框架
│   │   └── server/
│   │       ├── index.ts
│   │       └── MCPServer.ts
│   ├── errors/                 # 错误处理
│   │   ├── index.ts
│   │   ├── BaseError.ts
│   │   ├── BusinessError.ts
│   │   ├── SystemError.ts
│   │   ├── GitLabApiError.ts
│   │   ├── ErrorCode.ts
│   │   └── ErrorHandler.ts
│   ├── logging/                # 日志系统
│   │   ├── index.ts
│   │   ├── Logger.ts
│   │   ├── PinoLogger.ts
│   │   └── types.ts
│   ├── plugins/                # 插件实现
│   │   ├── gitlab-mr/
│   │   ├── gitlab-file/
│   │   └── gitlab-code-review/
│   ├── repositories/           # 数据访问层
│   │   ├── index.ts
│   │   ├── GitLabRepository.ts
│   │   ├── CacheRepository.ts
│   │   ├── ConfigRepository.ts
│   │   └── types.ts
│   ├── services/               # 业务服务层
│   │   ├── index.ts
│   │   ├── MergeRequestService.ts
│   │   ├── FileOperationService.ts
│   │   ├── CodeReviewService.ts
│   │   ├── CodeReviewRuleEngine.ts
│   │   ├── ProjectService.ts
│   │   ├── StreamingFileService.ts
│   │   └── types.ts
│   ├── transport/              # 传输层
│   │   ├── index.ts
│   │   ├── Transport.ts
│   │   ├── StdioTransport.ts
│   │   └── types.ts
│   └── utils/                  # 工具函数
│       ├── index.ts
│       └── path-validator.ts
│
├── tests/                      # 统一的测试目录
│   ├── unit/                   # 单元测试
│   ├── integration/            # 集成测试
│   ├── e2e/                    # 端到端测试
│   ├── benchmarks/             # 性能基准测试
│   └── coverage/               # 覆盖率报告
│
├── docs/                       # 文档
│   ├── api/                    # API 文档
│   ├── developers/             # 开发者指南
│   └── decisions/              # 设计决策
│
├── dist/                       # 构建输出
├── scripts/                    # 脚本
│
├── package.json                # 统一配置
├── tsconfig.json               # 统一 TS 配置
├── vitest.config.ts            # 测试配置
├── .env.example                # 环境变量示例
├── README.md                   # 项目说明
├── CHANGELOG.md                # 变更日志
└── LICENSE                     # 许可证
```

### 3.4 目标 package.json

```json
{
  "name": "gitlab-mcp-server",
  "version": "2.0.0",
  "description": "GitLab MCP Server - 提供 GitLab 集成的 MCP 服务",
  "main": "dist/src/index.js",
  "type": "module",
  "bin": {
    "gitlab-mcp": "dist/src/index.js"
  },
  "scripts": {
    "build": "npm run clean && tsc && chmod +x dist/src/index.js",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/src/index.js",
    "clean": "rm -rf dist",
    
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "tsx tests/e2e/index.ts",
    
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{ts,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,json,md}\"",
    "type-check": "tsc --noEmit",
    
    "prepublishOnly": "npm run clean && npm run build"
  },
  "dependencies": {
    "@gitbeaker/rest": "^43.0.0",
    "@modelcontextprotocol/sdk": "^1.15.1",
    "dotenv": "^17.2.0",
    "pino": "^8.x.x",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    "@vitest/ui": "^1.6.0",
    "c8": "^8.0.1",
    "eslint": "^8.57.0",
    "husky": "^9.0.11",
    "lint-staged": "^15.2.10",
    "prettier": "^3.3.3",
    "tsx": "^4.20.3",
    "typescript": "^5.3.3",
    "vitest": "^1.6.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### 3.5 目标 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@transport/*": ["src/transport/*"],
      "@capabilities/*": ["src/capabilities/*"],
      "@services/*": ["src/services/*"],
      "@repositories/*": ["src/repositories/*"],
      "@plugins/*": ["src/plugins/*"],
      "@config/*": ["src/config/*"],
      "@logging/*": ["src/logging/*"],
      "@errors/*": ["src/errors/*"],
      "@cache/*": ["src/cache/*"],
      "@utils/*": ["src/utils/*"]
    },
    
    "types": ["node"]
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

---

## 四、执行计划

### 4.1 Phase 1: 准备阶段（预计 1 天）

#### 4.1.1 创建备份分支

```bash
# 创建备份分支
git checkout -b backup/pre-unification
git push origin backup/pre-unification

# 创建工作分支
git checkout main
git checkout -b refactor/unification
```

#### 4.1.2 验证 V2 功能

```bash
# 构建 V2
npm run build:v2

# 运行 V2 测试
npm run test:v2

# 手动验证启动
npm run start:v2
```

#### 4.1.3 记录功能基准

- [ ] 确认 8 个工具正常工作
- [ ] 确认 5 个资源正常工作
- [ ] 确认 3 个提示正常工作
- [ ] 记录当前测试覆盖率

### 4.2 Phase 2: 目录统一（预计 2-3 小时）

#### 4.2.1 删除 V1 代码

```bash
# 删除 V1 源代码
rm -rf src/

# 删除 V1 测试
rm -rf tests/
```

#### 4.2.2 重命名目录

```bash
# 重命名 V2 源代码
mv src-v2/ src/

# 重命名 V2 测试
mv tests-v2/ tests/
```

#### 4.2.3 更新导入路径

更新以下文件中的路径引用：
- `vitest.config.ts`
- 所有测试文件中的 `../src-v2/` → `../src/`
- 文档中的路径引用

### 4.3 Phase 3: 配置统一（预计 2-3 小时）

#### 4.3.1 合并 TypeScript 配置

1. 将 `tsconfig-v2.json` 的配置合并到 `tsconfig.json`
2. 删除 `tsconfig-v2.json`
3. 更新 `include` 路径

#### 4.3.2 更新 package.json

1. 更新 `main` 和 `bin` 入口
2. 移除所有 `:v2` 后缀脚本
3. 更新脚本指向新路径

#### 4.3.3 更新 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '@': './src',
      '@core': './src/core',
      '@transport': './src/transport',
      '@capabilities': './src/capabilities',
      '@services': './src/services',
      '@repositories': './src/repositories',
      '@plugins': './src/plugins',
      '@config': './src/config',
      '@logging': './src/logging',
      '@errors': './src/errors',
      '@cache': './src/cache',
      '@utils': './src/utils',
    },
  },
});
```

### 4.4 Phase 4: 类型修复（预计 1-2 天）

#### 4.4.1 需要修复的文件清单

| 文件 | 问题 | 修复优先级 |
|-----|------|-----------|
| `src/index.ts` | `@ts-nocheck` | 高 |
| `src/logging/PinoLogger.ts` | `@ts-nocheck` | 高 |
| `src/repositories/GitLabRepository.ts` | `@ts-nocheck`, `as any` | 高 |
| `src/bootstrap/registerTools.ts` | `@ts-nocheck` | 中 |
| `src/config/ConfigManager.ts` | `@ts-nocheck` | 中 |
| `src/core/server/MCPServer.ts` | `@ts-nocheck` | 中 |
| `src/transport/WebSocketTransport.ts` | `@ts-nocheck` | 低（未使用） |

#### 4.4.2 修复策略

**步骤 1：逐个文件移除 `@ts-nocheck`**

```typescript
// 移除文件顶部的
// @ts-nocheck
```

**步骤 2：修复类型错误**

常见修复模式：

```typescript
// 修复前：as any
const result = await client.getMergeRequest() as any;

// 修复后：正确类型
const result: MergeRequestResponse = await client.getMergeRequest();
```

**步骤 3：创建类型声明**

为 `@gitbeaker/rest` 创建类型适配器：

```typescript
// src/types/gitbeaker.d.ts
import { Gitlab } from '@gitbeaker/rest';

// 扩展类型定义
declare module '@gitbeaker/rest' {
  interface MergeRequestExtended {
    // 添加缺失的类型
  }
}
```

**步骤 4：逐步启用 strict 模式**

```json
// tsconfig.json 分阶段启用
{
  "compilerOptions": {
    // Phase 1：基础检查
    "strict": false,
    "noImplicitAny": true,
    
    // Phase 2：空值检查
    "strictNullChecks": true,
    
    // Phase 3：完全严格
    "strict": true
  }
}
```

### 4.5 Phase 5: 文档更新（预计半天）

#### 4.5.1 需要更新的文档

| 文档 | 更新内容 |
|-----|---------|
| `README.md` | 更新安装、使用说明 |
| `architecture.md` | 更新为实际实现的架构 |
| `development-plan.md` | 标记已完成/取消的任务 |
| `CHANGELOG.md` | 添加 v2.0.0 正式版记录 |
| `docs/api/` | 确保 API 文档准确 |

#### 4.5.2 需要删除的文档

- `phase1-completion-report.md` → 归档到 `docs/archive/`
- `unused-modules-analysis.md` → 删除
- `review.md` → 归档

---

## 五、清理清单

### 5.1 需要删除的文件/目录

```
# V1 代码（改造时删除）
□ src/

# V1 测试（改造时删除）  
□ tests/

# 临时配置（改造后删除）
□ tsconfig-v2.json

# 编译产物（重新构建）
□ dist/

# 过时日志
□ tests/logs/

# 临时报告（归档）
□ phase1-completion-report.md
□ unused-modules-analysis.md
□ test-mr-changes.log
```

### 5.2 需要保留但更新的文件

```
# 配置文件
□ package.json（更新脚本和入口）
□ tsconfig.json（合并 v2 配置）
□ vitest.config.ts（更新路径）

# 文档
□ README.md（更新使用说明）
□ architecture.md（更新为实际架构）
□ CHANGELOG.md（添加记录）
□ USAGE.md（验证准确性）

# Cursor 配置
□ cursor-mcp-config.json（验证路径）
```

### 5.3 Git 提交策略

```bash
# 1. 删除 V1
git add -A
git commit -m "refactor: remove v1 code (src/, tests/)"

# 2. 重命名目录
git add -A
git commit -m "refactor: rename src-v2/ to src/, tests-v2/ to tests/"

# 3. 更新配置
git add -A
git commit -m "refactor: unify TypeScript and package.json configs"

# 4. 修复类型
git add -A
git commit -m "fix: restore type safety, remove @ts-nocheck"

# 5. 更新文档
git add -A
git commit -m "docs: update documentation for v2.0.0 release"

# 6. 打标签
git tag -a v2.0.0 -m "Release v2.0.0 - Unified Architecture"
```

---

## 六、验收标准

### 6.1 功能验收

- [ ] `npm run build` 成功构建
- [ ] `npm run start` 成功启动
- [ ] `npm run test` 所有测试通过
- [ ] 8 个工具功能正常
- [ ] 5 个资源功能正常
- [ ] 3 个提示功能正常
- [ ] Cursor IDE 集成正常

### 6.2 代码质量验收

- [ ] 无 `@ts-nocheck` 注释
- [ ] `as any` 使用最小化（<10 处）
- [ ] `npm run lint` 无错误
- [ ] `npm run type-check` 无错误
- [ ] 测试覆盖率 ≥ 60%

### 6.3 目录结构验收

- [ ] 只有 `src/` 目录（无 `src-v2/`）
- [ ] 只有 `tests/` 目录（无 `tests-v2/`）
- [ ] 只有 `tsconfig.json`（无 `tsconfig-v2.json`）
- [ ] `package.json` 无 `:v2` 后缀脚本

### 6.4 文档验收

- [ ] `README.md` 准确反映当前状态
- [ ] `architecture.md` 与实际代码匹配
- [ ] `CHANGELOG.md` 包含 v2.0.0 记录
- [ ] API 文档准确完整

---

## 附录

### A. 命令速查

```bash
# 构建
npm run build

# 开发
npm run dev

# 启动
npm run start

# 测试
npm run test
npm run test:coverage
npm run test:ui

# 代码质量
npm run lint
npm run lint:fix
npm run format
npm run type-check
```

### B. 相关文档

- [架构设计](./architecture.md)
- [开发计划](./development-plan.md)
- [API 参考](./docs/api-reference.md)
- [使用指南](./USAGE.md)

### C. 联系方式

- 作者: Lynncen
- 项目: gitlab-mcp-server

---

**文档结束**

> 本文档版本：1.0  
> 最后更新：2026-01-27  
> 下次审查：改造完成后
