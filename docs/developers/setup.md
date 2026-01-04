# 开发环境设置指南

> **创建日期**: 2025-12-30

本文档说明如何设置 GitLab MCP 服务器 v2.0 的开发环境。

---

## 一、前置要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0（推荐）或 npm >= 9.0.0
- **Git**: 最新版本

---

## 二、安装依赖

### 2.1 安装生产依赖

根据技术选型，需要安装以下生产依赖：

```bash
pnpm add tsyringe reflect-metadata pino pino-pretty node-cache fastify @fastify/cors
```

### 2.2 安装开发依赖

开发依赖已在 `package.json` 中定义，运行：

```bash
pnpm install
```

这将安装：
- **测试框架**: vitest, @vitest/ui, c8
- **代码质量**: eslint, @typescript-eslint/*, prettier
- **Git Hooks**: husky, lint-staged
- **开发工具**: tsx（已安装）

---

## 三、配置 Git Hooks

### 3.1 初始化 Husky

```bash
npx husky install
```

### 3.2 设置 pre-commit hook

Husky 配置已创建在 `.husky/pre-commit`，包含：
- TypeScript 类型检查
- ESLint 代码检查
- Prettier 格式化检查
- 快速测试

### 3.3 设置 commit-msg hook

`.husky/commit-msg` 已创建，可根据需要启用 commitlint。

---

## 四、配置环境变量

### 4.1 复制环境变量模板

```bash
cp .env.example .env
```

### 4.2 编辑 .env 文件

填写你的 GitLab 配置：
- `GITLAB_HOST`: GitLab 实例地址
- `GITLAB_TOKEN`: GitLab 访问令牌

---

## 五、验证安装

### 5.1 类型检查

```bash
pnpm type-check:v2
```

### 5.2 代码检查

```bash
pnpm lint
```

### 5.3 格式化检查

```bash
pnpm format:check
```

### 5.4 运行测试

```bash
pnpm test:v2
```

---

## 六、开发工作流

### 6.1 启动开发服务器

```bash
pnpm dev:v2
```

这将启动 TypeScript 监听模式，自动编译代码。

### 6.2 运行测试

```bash
# 运行所有测试
pnpm test:v2

# 运行测试并显示 UI
pnpm test:v2:ui

# 运行测试并生成覆盖率报告
pnpm test:v2:coverage
```

### 6.3 代码格式化

```bash
# 格式化代码
pnpm format

# 检查格式
pnpm format:check
```

### 6.4 构建项目

```bash
pnpm build:v2
```

---

## 七、目录结构说明

```
gitlab-mcp/
├── src/              # 旧代码（保持不动）
├── src-v2/           # 新架构代码
│   ├── core/         # 核心框架
│   ├── transport/    # 传输层
│   ├── capabilities/ # 能力层
│   ├── middleware/   # 中间件
│   ├── services/     # 业务层
│   ├── repositories/ # 数据访问层
│   └── plugins/      # 插件
├── tests-v2/         # 新测试代码
├── docs/             # 文档
└── package.json      # 依赖管理
```

---

## 八、常见问题

### 8.1 依赖安装失败

如果遇到依赖安装问题：

```bash
# 清理缓存
pnpm store prune

# 重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 8.2 TypeScript 路径别名不工作

确保 `tsconfig-v2.json` 中的 `paths` 配置正确，并且 IDE 已重启。

### 8.3 Git Hooks 不执行

确保 Husky 已初始化：

```bash
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

---

## 九、下一步

环境设置完成后，可以开始：

1. 阅读架构文档：`architecture.md`
2. 阅读开发计划：`development-plan.md`
3. 查看接口设计：`docs/design/interfaces.md`
4. 开始阶段 1 开发：核心框架实现

