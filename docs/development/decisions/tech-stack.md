# 技术选型文档

> **创建日期**: 2025-12-30  
> **状态**: 待确认

## 一、依赖注入框架

### 候选方案

#### 1. InversifyJS
- **优点**：
  - 功能完整，支持装饰器
  - 文档完善，社区活跃
  - 支持多种生命周期
- **缺点**：
  - 包体积较大（~100KB）
  - 需要 reflect-metadata
  - 学习曲线较陡
- **适用场景**：大型项目，需要复杂 DI 功能

#### 2. TSyringe
- **优点**：
  - 轻量级（~20KB）
  - 使用简单，API 清晰
  - 支持装饰器
- **缺点**：
  - 功能相对简单
  - 社区较小
- **适用场景**：中小型项目，简单 DI 需求

#### 3. 自研 DI 容器
- **优点**：
  - 完全可控
  - 无外部依赖
  - 可定制化
- **缺点**：
  - 开发成本高
  - 需要维护
  - 可能缺少高级特性
- **适用场景**：特殊需求，或作为学习项目

### 推荐选择

**选择：TSyringe**

**理由**：
1. 项目规模适中，不需要过于复杂的 DI 功能
2. 轻量级，不影响性能
3. API 简单，易于使用和维护
4. 支持装饰器，符合 TypeScript 最佳实践

**安装**：
```bash
pnpm add tsyringe reflect-metadata
```

---

## 二、日志库

### 候选方案

#### 1. Winston
- **优点**：
  - 功能强大，支持多种传输
  - 社区成熟，文档完善
  - 支持日志轮转、格式化等
- **缺点**：
  - 配置复杂
  - 包体积较大
  - 性能一般
- **适用场景**：需要复杂日志功能的企业级应用

#### 2. Pino
- **优点**：
  - 性能极佳（最快的 Node.js 日志库）
  - 结构化日志，JSON 格式
  - 轻量级
  - 支持子 logger
- **缺点**：
  - 功能相对简单
  - 需要插件支持某些功能
- **适用场景**：性能敏感的应用

#### 3. 自研日志系统
- **优点**：
  - 完全可控
  - 无外部依赖
  - 可定制化
- **缺点**：
  - 开发成本高
  - 需要维护
  - 可能缺少高级特性
- **适用场景**：特殊需求

### 推荐选择

**选择：Pino**

**理由**：
1. 性能优秀，适合高频日志场景
2. 结构化日志，便于日志分析和监控
3. 轻量级，不影响应用性能
4. 支持子 logger，便于上下文传递

**安装**：
```bash
pnpm add pino pino-pretty
```

---

## 三、缓存方案

### 候选方案

#### 1. node-cache
- **优点**：
  - 简单易用
  - 纯内存缓存
  - 无外部依赖
- **缺点**：
  - 单进程，无法共享
  - 不支持持久化
  - 功能简单
- **适用场景**：单机应用，简单缓存需求

#### 2. ioredis
- **优点**：
  - 支持 Redis 集群
  - 性能优秀
  - 功能完整
- **缺点**：
  - 需要 Redis 服务
  - 增加部署复杂度
  - 网络延迟
- **适用场景**：分布式应用，需要共享缓存

#### 3. 自研缓存
- **优点**：
  - 完全可控
  - 无外部依赖
- **缺点**：
  - 开发成本高
  - 需要维护
- **适用场景**：特殊需求

### 推荐选择

**选择：node-cache（默认）+ ioredis（可选）**

**理由**：
1. 默认使用 node-cache，简单高效，满足大部分场景
2. 支持扩展为 Redis，满足分布式需求
3. 通过接口抽象，可以灵活切换

**安装**：
```bash
pnpm add node-cache
pnpm add -D ioredis @types/ioredis  # 可选
```

---

## 四、HTTP 框架

### 候选方案

#### 1. Express
- **优点**：
  - 生态成熟，中间件丰富
  - 文档完善，社区活跃
  - 易于上手
- **缺点**：
  - 性能一般
  - 代码较老，设计模式传统
- **适用场景**：传统 Web 应用

#### 2. Fastify
- **优点**：
  - 性能极佳（比 Express 快 2-3 倍）
  - 现代设计，支持 TypeScript
  - 内置 JSON Schema 验证
  - 插件系统完善
- **缺点**：
  - 社区相对较小
  - 中间件生态不如 Express
- **适用场景**：性能敏感的应用

#### 3. Koa
- **优点**：
  - 轻量级
  - 基于 async/await
  - 中间件模型优雅
- **缺点**：
  - 需要自己实现很多功能
  - 生态不如 Express
- **适用场景**：需要灵活控制的应用

### 推荐选择

**选择：Fastify**

**理由**：
1. 性能优秀，适合高频请求场景
2. 内置 JSON Schema 验证，与 Zod 配合良好
3. 插件系统完善，符合插件化架构
4. TypeScript 支持好

**安装**：
```bash
pnpm add fastify @fastify/cors
```

---

## 五、测试框架

### 候选方案

#### 1. Jest
- **优点**：
  - 功能完整，生态成熟
  - 内置 mock、覆盖率等
  - 文档完善
- **缺点**：
  - 配置复杂
  - 性能一般
  - 包体积较大
- **适用场景**：大型项目

#### 2. Vitest
- **优点**：
  - 性能优秀（基于 Vite）
  - 与 Vite 配置兼容
  - API 与 Jest 兼容
  - 支持 ESM
- **缺点**：
  - 相对较新，生态不如 Jest
- **适用场景**：现代 TypeScript 项目

#### 3. Mocha + Chai
- **优点**：
  - 灵活，可自由组合工具
  - 轻量级
- **缺点**：
  - 需要额外配置
  - 功能分散
- **适用场景**：需要高度定制的项目

### 推荐选择

**选择：Vitest**

**理由**：
1. 性能优秀，测试执行快
2. 原生支持 ESM，符合项目配置
3. API 与 Jest 兼容，易于迁移
4. 配置简单，开箱即用

**安装**：
```bash
pnpm add -D vitest @vitest/ui c8
```

---

## 六、代码质量工具

### ESLint
- **选择**：@typescript-eslint/eslint-plugin
- **理由**：TypeScript 官方推荐，规则完善

### Prettier
- **选择**：prettier
- **理由**：代码格式化标准工具

### Git Hooks
- **选择**：husky + lint-staged
- **理由**：提交前自动检查，保证代码质量

**安装**：
```bash
pnpm add -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier husky lint-staged
```

---

## 七、其他工具

### 开发工具
- **tsx**: TypeScript 执行器（已安装）
- **nodemon**: 自动重启（可选）
- **concurrently**: 并行执行命令（可选）

### 构建工具
- **TypeScript Compiler**: 使用 tsc（已配置）

---

## 八、最终技术栈

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 运行时 | Node.js | >=18.0.0 | 运行环境 |
| 语言 | TypeScript | 5.3+ | 开发语言 |
| DI 框架 | TSyringe | latest | 依赖注入 |
| 日志库 | Pino | latest | 日志系统 |
| 缓存 | node-cache | latest | 内存缓存 |
| HTTP 框架 | Fastify | latest | HTTP 传输 |
| 测试框架 | Vitest | latest | 单元测试 |
| 代码质量 | ESLint + Prettier | latest | 代码规范 |
| Git Hooks | Husky | latest | 提交检查 |

---

## 九、依赖安装命令

```bash
# 生产依赖
pnpm add tsyringe reflect-metadata pino pino-pretty node-cache fastify @fastify/cors

# 开发依赖
pnpm add -D vitest @vitest/ui c8 eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier husky lint-staged
```

---

## 十、下一步

1. 确认技术选型
2. 安装依赖
3. 配置开发环境
4. 开始核心框架开发

