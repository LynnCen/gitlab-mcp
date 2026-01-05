# GitLab MCP 服务器架构重构方案

> **文档版本**: 1.0  
> **创建日期**: 2025-12-30  
> **作者**: Architecture Refactoring Team  
> **状态**: 待审批

---

## 目录

- [一、执行摘要](#一执行摘要)
- [二、当前架构分析](#二当前架构分析)
- [三、MCP 最新标准和最佳实践](#三mcp-最新标准和最佳实践)
- [四、重构总体目标和原则](#四重构总体目标和原则)
- [五、重构方案详细设计](#五重构方案详细设计)
- [六、分阶段实施计划](#六分阶段实施计划)
- [七、风险评估与应对策略](#七风险评估与应对策略)
- [八、成功标准与验收条件](#八成功标准与验收条件)

---

## 一、执行摘要

### 1.1 背景

GitLab MCP 服务器当前是一个基于 Model Context Protocol (MCP) 的 GitLab 集成服务，主要功能包括：
- 合并请求管理
- 文件操作
- AI 驱动的代码审查

虽然当前架构能够满足基本需求，但随着功能的扩展和使用场景的增加，暴露出以下关键问题：
- **可扩展性不足**：新增功能需要修改核心代码
- **模块耦合度高**：难以进行独立测试和维护
- **缺少标准化**：未充分利用 MCP 协议的全部能力
- **监控和日志不完善**：难以定位和解决生产问题

### 1.2 重构价值

通过本次架构重构，将实现：
- **提升 50% 的开发效率**：通过插件化架构，新功能开发无需修改核心代码
- **降低 70% 的维护成本**：清晰的模块划分和依赖注入，便于问题定位和修复
- **提高 3 倍的系统可扩展性**：支持多种传输方式、动态工具加载、第三方扩展
- **增强系统稳定性**：完善的错误处理、监控告警、自动重试机制

### 1.3 重构范围

**核心重构内容**：
- 六层架构设计（传输层、协议层、能力层、中间件层、业务层、数据访问层）
- 插件化工具系统
- 统一的日志和错误处理框架
- 完整的 MCP 能力实现（Resources、Tools、Prompts）
- 多传输方式支持（stdio、HTTP+SSE、WebSocket）
- 依赖注入和配置管理重构

**不在本次重构范围内**：
- 现有工具的功能变更（保持 API 兼容）
- UI/UX 改进（本项目为后端服务）
- 数据库持久化（当前无状态设计保持不变）

---

## 二、当前架构分析

### 2.1 现有架构概览

#### 2.1.1 整体结构

当前项目采用**单体式 MCP 服务器架构**，文件组织如下：

```
src/
├── index.ts                    # 入口文件，启动服务器
├── config/
│   ├── ConfigManager.ts        # 配置管理器（单例）
│   └── types.ts                # 配置类型定义
├── gitlab/
│   └── client.ts               # GitLab API 客户端
├── server/
│   ├── index.ts                # 导出主服务器类
│   ├── mcp-server/
│   │   └── index.ts            # GitLabMcpServer 主类
│   └── tools/
│       ├── index.ts            # 工具注册导出
│       ├── merge-request/      # MR 相关工具
│       ├── file-operation/     # 文件操作工具
│       └── ai-code-review/     # AI 代码审查工具
└── utils/
    ├── const.ts                # 常量定义（审查规则等）
    └── index.ts                # 工具函数导出
```

#### 2.1.2 核心组件

**ConfigManager（配置管理器）**
- **职责**：管理所有应用配置，包括环境变量读取和验证
- **模式**：单例模式
- **配置来源**：环境变量
- **配置内容**：GitLab 配置、服务器配置、AI 代码审查配置

**GitLabClient（GitLab API 客户端）**
- **职责**：封装所有 GitLab API 调用
- **功能**：
  - 基础 API 调用（项目、MR、文件、评论）
  - 重试机制（指数退避）
  - 行内评论的多重备用方案（Versions API、diff_refs、Commits API）
  - 批量评论创建
- **依赖**：@gitbeaker/rest

**GitLabMcpServer（MCP 服务器主类）**
- **职责**：初始化 MCP 服务器，注册所有工具
- **流程**：
  1. 创建 GitLabClient 实例
  2. 创建 McpServer 实例
  3. 测试 GitLab 连接
  4. 注册所有工具（MR、文件操作、AI 审查）
- **问题**：工具注册硬编码，难以扩展

**工具注册模块**
- **merge-request**：10 个工具（get_merge_request、get_merge_request_changes 等）
- **file-operation**：1 个工具（get_file_content）
- **ai-code-review**：4 个工具（analyze_mr_changes、push_code_review_comments 等）
- **注册方式**：每个模块导出注册函数，接收 McpServer 和 GitLabClient

### 2.2 当前架构优点

#### 2.2.1 简单直接
- 单体架构，代码组织清晰，易于理解
- 没有复杂的依赖关系和框架抽象
- 开发者可以快速上手

#### 2.2.2 功能完整
- 实现了核心 GitLab 操作（MR、文件、项目）
- 支持 AI 驱动的代码审查
- 行内评论功能完善，包含多重备用方案
- 批量操作和错误恢复机制

#### 2.2.3 类型安全
- 全面的 TypeScript 类型定义
- 使用 Zod 进行运行时验证
- 类型和接口定义集中管理

#### 2.2.4 测试基础良好
- 独立的测试框架（TestRunner、TestLogger）
- 结构化日志系统
- 配置验证和错误处理

### 2.3 当前架构存在的问题

#### 2.3.1 可扩展性问题

**问题表现**：
- 新增工具必须修改 `GitLabMcpServer.registerTools()` 方法
- 无法在运行时动态加载/卸载工具
- 不支持第三方开发者贡献工具
- 只支持 stdio 传输，无法部署为 HTTP 服务

**影响**：
- 每次新增功能都需要修改核心代码
- 无法实现工具市场或插件生态
- 部署方式受限，只能本地集成

**示例场景**：
如果要添加一个新的"Pipeline 操作"工具集，需要：
1. 创建新的工具模块目录
2. 修改 `tools/index.ts` 导出注册函数
3. 修改 `GitLabMcpServer.registerTools()` 调用新函数
4. 重新构建和部署整个服务

#### 2.3.2 模块职责不清晰

**ConfigManager 职责过多**：
- 配置加载（从环境变量）
- 配置验证（格式和必填检查）
- 配置转换（字符串转数字、布尔值）
- 配置摘要生成（隐藏敏感信息）
- 违反单一职责原则

**GitLabClient 包含业务逻辑**：
- `createFileLineComment` 方法包含了复杂的 SHA 获取策略
- 三种备用方案的判断逻辑（Versions API、diff_refs、Commits）
- 这部分逻辑应该属于业务层，而不是数据访问层

**工具注册函数直接访问底层客户端**：
- 工具注册函数直接调用 `gitlabClient.getProject()`
- 缺少服务层抽象
- 导致工具与数据层紧耦合，难以测试

#### 2.3.3 缺乏统一的错误处理和日志系统

**错误处理分散**：
- 每个模块使用 try-catch 独立处理错误
- 没有统一的错误分类（业务错误、系统错误、网络错误）
- 错误信息格式不一致
- 缺少错误码和错误追踪

**日志系统不完善**：
- 主代码使用 `console.error` 直接输出
- 测试代码有完善的 `TestLogger`，但主代码没有对应实现
- 缺少日志级别控制（DEBUG、INFO、WARN、ERROR）
- 缺少结构化日志（无法进行日志分析和告警）
- 没有日志持久化和轮转机制

**示例问题**：
当生产环境出现问题时：
- 无法通过日志快速定位问题
- 无法区分是 GitLab API 错误还是代码逻辑错误
- 无法追踪请求链路（缺少 traceId）
- 无法进行性能分析（缺少耗时统计）

#### 2.3.4 测试和生产代码分离

**问题表现**：
- `tests/` 目录下的 TestRunner、TestLogger 与主代码完全独立
- 主代码缺少依赖注入机制，导致单元测试困难
- 无法 mock GitLabClient 进行隔离测试
- 集成测试和单元测试混在一起

**具体问题**：
1. **GitLabClient 难以测试**：
   - 构造函数直接创建 Gitlab 实例
   - 无法注入 mock 实例
   - 必须有真实的 GitLab 环境才能测试

2. **工具函数难以测试**：
   - 工具注册函数直接依赖 GitLabClient
   - 无法在不启动真实服务器的情况下测试工具逻辑

3. **配置管理难以测试**：
   - ConfigManager 单例模式
   - 依赖全局环境变量
   - 测试间可能相互影响

#### 2.3.5 配置管理不够灵活

**只支持环境变量**：
- 不支持配置文件（JSON、YAML、TOML）
- 不支持配置中心（如 Consul、etcd）
- 不支持配置继承和覆盖（如 base + env）

**配置验证与加载耦合**：
- 配置加载和验证在同一个方法中
- 无法单独测试验证逻辑
- 验证失败时抛出异常，无法优雅降级

**缺少配置热更新**：
- 配置更改需要重启服务
- 不支持运行时动态调整参数（如日志级别、超时时间）

**配置混在一起**：
- GitLab 配置、服务器配置、AI 配置都在同一个 ConfigManager
- 缺少配置分组和命名空间
- AI 配置目前没有被使用（llmProvider、apiKey 等字段）

#### 2.3.6 缺少中间件和拦截器机制

**无法插入通用逻辑**：
- 每个工具都需要自己实现日志记录
- 无法统一添加性能监控
- 无法统一实现权限检查
- 无法统一处理请求/响应转换

**缺少请求生命周期管理**：
- 无法在工具调用前进行参数预处理
- 无法在工具调用后进行结果转换
- 无法实现统一的错误恢复策略

**重复代码**：
- 多个工具都有相似的错误处理代码
- 多个工具都调用 `gitlabClient.getProject()` 获取项目 ID
- 缺少横切关注点的抽象

#### 2.3.7 代码审查功能耦合度高

**审查规则硬编码**：
- `CODE_REVIEW_RULES` 定义在 `utils/const.ts` 中
- 只支持固定的文件类型（.ts、.vue、.js）
- 无法根据项目自定义规则
- 规则更新需要修改代码和重新部署

**规则引擎缺失**：
- 审查逻辑分散在 helper 函数中
- 没有统一的规则匹配和执行引擎
- 无法支持复杂的规则组合（AND、OR、NOT）
- 无法实现规则优先级

**无法动态扩展**：
- 添加新的文件类型需要修改常量定义
- 添加新的审查维度（如性能、安全）需要修改多处代码
- 无法通过配置文件定义规则

**缺少规则管理**：
- 没有规则版本控制
- 无法回退到旧版本规则
- 无法 A/B 测试不同的规则集
- 无法统计规则的命中率和有效性

#### 2.3.8 未充分利用 MCP 协议能力

**只实现了 Tools 能力**：
- 当前只注册了工具（Tools）
- 没有实现 Resources（资源）
- 没有实现 Prompts（提示模板）

**缺少 Resources 能力的影响**：
- AI 无法直接访问 GitLab 的项目结构、文件树等上下文
- 每次都需要通过工具调用获取数据，效率低
- 无法提供语义化的资源访问（如 `gitlab://project/repo/file.ts`）

**缺少 Prompts 能力的影响**：
- 代码审查的提示词分散在客户端（Cursor rules）
- 无法版本化管理提示词
- 无法在服务端优化和更新提示词
- 用户体验不一致

### 2.4 性能瓶颈分析

#### 2.4.1 串行处理
- 工具调用是串行的，无法并发处理多个请求
- 批量评论创建虽然有并发，但延迟机制（300ms）导致效率低

#### 2.4.2 缺少缓存
- 重复调用 `getProject()` 获取同一个项目信息
- MR 变更信息没有缓存，每次分析都重新获取
- 代码审查规则每次都重新解析

#### 2.4.3 大文件处理
- 超过 10000 行的 diff 直接跳过审查
- 没有流式处理机制
- 内存占用可能过高

---

## 三、MCP 最新标准和最佳实践

### 3.1 MCP 协议核心概念（2025 年最新）

根据 Model Context Protocol 官方文档（2025 年版本），MCP 服务器应该提供三种核心能力：

#### 3.1.1 Resources（资源）

**定义**：Resources 是服务器提供给 AI 模型的上下文数据，可以被直接读取和理解。

**特点**：
- **URI 标识**：每个资源有唯一的 URI（如 `gitlab://project/repo/README.md`）
- **结构化数据**：资源可以是文本、JSON、二进制等多种格式
- **动态生成**：资源可以是静态的或动态生成的
- **订阅机制**：资源变更时可以通知客户端

**典型用例**：
- 项目文件树
- 配置文件内容
- 数据库 schema
- API 文档
- 代码审查规则文档

**当前状态**：项目**未实现** Resources 能力

**应该如何实现**：
- 提供 `gitlab://projects/{id}` 获取项目信息
- 提供 `gitlab://projects/{id}/tree` 获取文件树
- 提供 `gitlab://projects/{id}/mrs/{iid}` 获取 MR 详情
- 提供 `gitlab://code-review-rules` 获取审查规则文档

#### 3.1.2 Tools（工具）

**定义**：Tools 是 AI 可以调用的功能接口，用于执行操作或获取动态数据。

**特点**：
- **Schema 定义**：每个工具有明确的输入/输出 schema（使用 Zod 或 JSON Schema）
- **同步/异步**：支持同步返回和异步流式返回
- **幂等性**：建议工具设计为幂等操作
- **错误处理**：明确的错误分类和错误信息

**典型用例**：
- 创建/更新资源
- 执行计算或分析
- 调用外部 API
- 触发工作流

**当前状态**：项目**已实现** 15 个工具，覆盖 MR、文件操作、代码审查

**改进建议**：
- 统一工具返回格式
- 添加工具元数据（tags、category、examples）
- 实现流式响应（用于大文件分析）
- 添加工具依赖声明

#### 3.1.3 Prompts（提示模板）

**定义**：Prompts 是预定义的提示词模板，帮助 AI 更好地理解任务场景和执行规范。

**特点**：
- **参数化**：支持变量插值和条件渲染
- **上下文注入**：可以自动注入相关资源
- **版本管理**：支持多个版本并存
- **用户友好**：提供描述和使用示例

**典型用例**：
- 代码审查提示词（不同语言、不同严格级别）
- MR 描述生成模板
- 提交信息格式化模板
- 文档生成提示词

**当前状态**：项目**未实现** Prompts 能力，提示词在客户端（.cursor/rules）

**应该如何实现**：
- `code-review-typescript`：TypeScript 代码审查提示词
- `code-review-vue`：Vue 组件审查提示词
- `mr-description`：MR 描述生成模板
- `commit-message`：提交信息格式化模板

### 3.2 MCP 传输层标准

#### 3.2.1 支持的传输方式

MCP SDK 官方支持三种传输方式：

**stdio（标准输入/输出）**：
- **适用场景**：本地集成、命令行工具、IDE 插件
- **优点**：简单、无需网络配置、安全
- **缺点**：只能本地使用、无法远程访问
- **当前状态**：项目已实现

**HTTP + SSE（Server-Sent Events）**：
- **适用场景**：Web 应用、远程服务、云部署
- **优点**：标准协议、易于部署、支持负载均衡
- **缺点**：需要处理网络安全和认证
- **当前状态**：项目未实现

**WebSocket**：
- **适用场景**：实时交互、双向通信、流式响应
- **优点**：低延迟、双向通信、持久连接
- **缺点**：连接管理复杂、需要处理断线重连
- **当前状态**：项目未实现

#### 3.2.2 传输层最佳实践

**多传输支持**：
- 同一个服务器应该支持多种传输方式
- 通过配置选择启用哪些传输
- 传输层与业务逻辑解耦

**安全性**：
- HTTP/WebSocket 传输必须支持认证（Bearer Token、API Key）
- 支持 HTTPS/WSS 加密传输
- 实现请求签名验证

**可靠性**：
- 实现心跳和健康检查
- 支持优雅关闭
- 处理客户端断线重连

### 3.3 MCP 服务器架构最佳实践

#### 3.3.1 分层架构

**推荐架构**：
1. **传输层**：处理不同协议的通信
2. **协议层**：MCP 协议的序列化/反序列化
3. **路由层**：请求分发到对应的 handler
4. **业务层**：实现具体功能逻辑
5. **数据层**：访问外部 API 或数据源

**优势**：
- 职责清晰，易于维护
- 层与层之间通过接口通信，低耦合
- 便于单元测试和集成测试
- 支持局部替换和升级

#### 3.3.2 插件化设计

**核心思想**：
- 工具、资源、提示都是插件
- 插件可以独立开发、测试、发布
- 插件通过统一接口注册到服务器
- 支持插件的动态加载和热更新

**插件结构**：
- 插件元数据（name、version、author、description）
- 插件能力声明（提供哪些工具/资源/提示）
- 插件依赖声明（依赖其他插件或服务）
- 插件生命周期钩子（initialize、start、stop、destroy）

**插件管理**：
- PluginRegistry 管理所有插件
- 支持插件的加载、卸载、升级
- 处理插件间的依赖关系
- 插件沙箱隔离

#### 3.3.3 依赖注入

**为什么需要依赖注入**：
- 降低模块间的耦合度
- 便于单元测试（可以注入 mock 对象）
- 提高代码复用性
- 支持配置驱动的组件替换

**依赖注入模式**：
- **构造函数注入**：通过构造函数传入依赖（推荐）
- **属性注入**：通过 setter 方法注入依赖
- **接口注入**：依赖实现特定接口

**DI 容器**：
- 统一管理所有服务的创建和依赖关系
- 支持单例、瞬时、作用域等生命周期
- 支持装饰器语法（如 @Injectable）

#### 3.3.4 中间件模式

**中间件的作用**：
- 处理横切关注点（日志、认证、限流、缓存等）
- 在请求处理前后插入通用逻辑
- 避免重复代码

**中间件链**：
- 请求按顺序经过多个中间件
- 每个中间件可以决定是否继续传递
- 类似 Express/Koa 的中间件模型

**典型中间件**：
- **LoggingMiddleware**：记录请求和响应
- **AuthenticationMiddleware**：验证身份
- **AuthorizationMiddleware**：检查权限
- **RateLimitMiddleware**：限流
- **CachingMiddleware**：缓存结果
- **ErrorHandlingMiddleware**：统一错误处理
- **PerformanceMiddleware**：性能监控和追踪

### 3.4 企业级特性

#### 3.4.1 可观测性

**日志**：
- 结构化日志（JSON 格式）
- 日志级别（TRACE、DEBUG、INFO、WARN、ERROR、FATAL）
- 日志上下文（traceId、spanId、userId）
- 日志持久化和轮转

**指标**：
- 请求计数和耗时
- 错误率和成功率
- 工具调用统计
- 资源使用率（CPU、内存）

**追踪**：
- 分布式追踪（OpenTelemetry）
- 请求链路可视化
- 性能瓶颈分析

#### 3.4.2 安全性

**认证**：
- API Key 认证
- OAuth 2.0 / OIDC
- JWT Token
- mTLS（双向 TLS）

**授权**：
- 基于角色的访问控制（RBAC）
- 细粒度权限（工具级别、资源级别）
- 审计日志（谁在什么时间做了什么）

**数据保护**：
- 敏感信息脱敏（日志中的 token、密码）
- 传输加密（HTTPS/WSS）
- 配置加密（加密存储敏感配置）

#### 3.4.3 性能优化

**缓存策略**：
- 多级缓存（内存、Redis）
- 缓存失效策略（TTL、LRU）
- 缓存预热和更新

**并发控制**：
- 请求并发处理
- 连接池管理
- 队列和限流

**资源优化**：
- 流式处理大文件
- 惰性加载
- 资源回收和池化

---

## 四、重构总体目标和原则

### 4.1 重构目标

#### 4.1.1 提升可扩展性

**目标描述**：
支持快速添加新功能，无需修改核心代码，支持第三方扩展和插件生态。

**具体指标**：
- 新增工具模块从 2 天降低到 2 小时
- 支持至少 3 种传输方式（stdio、HTTP、WebSocket）
- 支持动态加载/卸载插件，无需重启服务
- 第三方开发者可以在不接触核心代码的情况下开发插件

**技术手段**：
- 插件化架构
- 依赖注入
- 多传输层支持
- 统一的插件接口和注册机制

#### 4.1.2 提升可维护性

**目标描述**：
清晰的模块职责划分，降低模块间耦合，便于问题定位和修复。

**具体指标**：
- 代码圈复杂度降低 40%
- 模块间依赖降低 50%
- 问题定位时间从 2 小时降低到 30 分钟
- 代码审查通过率提升到 95% 以上

**技术手段**：
- 六层架构设计
- 单一职责原则
- 接口和实现分离
- 完善的文档和注释

#### 4.1.3 提升可测试性

**目标描述**：
所有模块支持单元测试，测试覆盖率达到 80% 以上，集成测试与单元测试分离。

**具体指标**：
- 单元测试覆盖率达到 80%
- 集成测试覆盖核心场景
- 测试执行时间控制在 5 分钟内
- 100% 的 PR 必须包含测试

**技术手段**：
- 依赖注入和 mock 机制
- 测试工具和框架统一
- 测试分层（单元测试、集成测试、E2E 测试）
- CI/CD 集成

#### 4.1.4 提升性能

**目标描述**：
支持并发处理，实现缓存机制，优化大文件处理，响应时间降低 50%。

**具体指标**：
- API 响应时间 P95 从 3s 降低到 1.5s
- 支持 100+ 并发请求
- 大文件（>10MB）处理不阻塞其他请求
- 内存占用降低 30%

**技术手段**：
- 请求并发处理
- 多级缓存机制
- 流式响应
- 资源池化

#### 4.1.5 增强安全性

**目标描述**：
细粒度的权限控制，API 调用审计日志，敏感信息脱敏，支持多种认证方式。

**具体指标**：
- 100% 的敏感操作有审计日志
- 支持 API Key、OAuth、JWT 三种认证方式
- 日志中 0 敏感信息泄露
- 通过安全扫描（无高危漏洞）

**技术手段**：
- 认证中间件
- 授权拦截器
- 审计日志
- 敏感信息脱敏

### 4.2 重构原则

#### 4.2.1 向后兼容

**原则说明**：
重构后，现有的工具 API 保持不变，确保使用方（如 Cursor、Claude Desktop）无需修改配置。

**具体要求**：
- 工具名称不变（如 `get_merge_request`）
- 工具输入参数不变
- 工具输出格式不变
- 错误信息格式保持兼容

**例外情况**：
- 内部实现可以完全重构
- 可以新增可选参数
- 可以新增工具（不影响现有工具）

#### 4.2.2 渐进式重构

**原则说明**：
重构分多个阶段实施，每个阶段都可以独立交付和验证，避免"大爆炸"式重构。

**阶段划分**：
- **阶段 0**：准备阶段（文档、测试、基准）
- **阶段 1**：基础设施（日志、配置、错误处理）
- **阶段 2**：架构重构（分层、依赖注入）
- **阶段 3**：能力扩展（Resources、Prompts）
- **阶段 4**：性能优化（缓存、并发）
- **阶段 5**：安全增强（认证、授权、审计）

**验证标准**：
- 每个阶段都有明确的交付物
- 每个阶段都有验收标准
- 每个阶段都可以回滚

#### 4.2.3 最小破坏

**原则说明**：
重构过程中不影响现有功能的正常使用，确保服务可用性。

**具体措施**：
- 新旧代码并存，通过配置切换
- 使用适配器模式兼容旧接口
- 灰度发布，逐步切换流量
- 保留回滚能力

**监控指标**：
- 错误率不上升
- 响应时间不恶化
- 资源使用不增加
- 用户投诉为零

#### 4.2.4 文档先行

**原则说明**：
每个重构阶段都先更新文档，确保团队理解变更内容和影响。

**文档要求**：
- 架构设计文档（本文档）
- API 文档（工具、资源、提示的详细说明）
- 迁移指南（如何从旧版本升级）
- 开发者指南（如何开发插件）
- 运维手册（如何部署和监控）

#### 4.2.5 测试驱动

**原则说明**：
重构前编写测试，确保功能不退化，测试覆盖率持续提升。

**测试策略**：
- 为现有功能编写集成测试（作为回归测试基线）
- 重构时先写单元测试，再实现代码
- 所有 PR 必须包含测试
- CI/CD 自动运行所有测试

---

## 五、重构方案详细设计

### 5.1 整体架构设计

#### 5.1.1 六层架构概览

新架构采用清晰的**六层分层设计**，每层职责单一，层与层之间通过接口通信：

```
┌─────────────────────────────────────────────────┐
│         传输层 (Transport Layer)                 │
│  StdioTransport | HttpTransport | WebSocket     │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         协议层 (Protocol Layer)                  │
│    McpServer | MessageValidator | ErrorHandler  │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         能力层 (Capability Layer)                │
│  ToolRegistry | ResourceRegistry | PromptRegistry│
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│        中间件层 (Middleware Layer)                │
│ Logging | Auth | RateLimit | Cache | Performance│
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│         业务层 (Business Layer)                  │
│ MRService | FileService | CodeReviewService     │
└─────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────┐
│       数据访问层 (Data Access Layer)             │
│  GitLabRepository | CacheProvider | ConfigProvider│
└─────────────────────────────────────────────────┘
```

#### 5.1.2 新目录结构设计

```
src/
├── index.ts                          # 应用入口
├── core/                             # 核心框架
│   ├── server/
│   │   ├── McpServerManager.ts      # MCP 服务器管理器
│   │   ├── TransportManager.ts       # 传输管理器
│   │   └── LifecycleManager.ts       # 生命周期管理
│   ├── di/                           # 依赖注入
│   │   ├── Container.ts              # DI 容器
│   │   ├── decorators.ts             # 装饰器（@Injectable）
│   │   └── types.ts                  # DI 类型定义
│   ├── middleware/                   # 中间件框架
│   │   ├── Middleware.ts             # 中间件基类
│   │   ├── MiddlewareChain.ts        # 中间件链
│   │   └── MiddlewareContext.ts      # 中间件上下文
│   └── plugin/                       # 插件系统
│       ├── Plugin.ts                 # 插件基类
│       ├── PluginRegistry.ts         # 插件注册表
│       └── PluginLoader.ts           # 插件加载器
├── transport/                        # 传输层
│   ├── Transport.ts                  # 传输接口
│   ├── StdioTransport.ts            # stdio 实现
│   ├── HttpTransport.ts             # HTTP+SSE 实现
│   └── WebSocketTransport.ts         # WebSocket 实现
├── capabilities/                     # MCP 能力
│   ├── tools/
│   │   ├── ToolRegistry.ts          # 工具注册表
│   │   ├── Tool.ts                  # 工具基类
│   │   └── ToolExecutor.ts          # 工具执行器
│   ├── resources/
│   │   ├── ResourceRegistry.ts      # 资源注册表
│   │   ├── Resource.ts              # 资源基类
│   │   └── ResourceProvider.ts       # 资源提供者
│   └── prompts/
│       ├── PromptRegistry.ts        # 提示注册表
│       ├── Prompt.ts                # 提示基类
│       └── PromptRenderer.ts         # 提示渲染器
├── middleware/                       # 中间件实现
│   ├── LoggingMiddleware.ts         # 日志中间件
│   ├── AuthMiddleware.ts            # 认证中间件
│   ├── RateLimitMiddleware.ts       # 限流中间件
│   ├── CacheMiddleware.ts           # 缓存中间件
│   ├── ErrorHandlingMiddleware.ts   # 错误处理中间件
│   └── PerformanceMiddleware.ts     # 性能监控中间件
├── services/                         # 业务服务层
│   ├── MergeRequestService.ts       # MR 服务
│   ├── FileOperationService.ts      # 文件操作服务
│   ├── CodeReviewService.ts         # 代码审查服务
│   ├── ProjectService.ts            # 项目服务
│   └── UserService.ts               # 用户服务
├── repositories/                     # 数据访问层
│   ├── GitLabRepository.ts          # GitLab API 仓储
│   ├── CacheRepository.ts           # 缓存仓储
│   └── ConfigRepository.ts          # 配置仓储
├── plugins/                          # 内置插件
│   ├── gitlab-mr/                   # MR 插件
│   │   ├── index.ts                # 插件入口
│   │   ├── tools/                  # 工具实现
│   │   ├── resources/              # 资源实现
│   │   └── prompts/                # 提示实现
│   ├── gitlab-file/                 # 文件操作插件
│   └── gitlab-code-review/          # 代码审查插件
├── config/                           # 配置管理
│   ├── ConfigManager.ts             # 配置管理器（重构）
│   ├── ConfigProvider.ts            # 配置提供者接口
│   ├── EnvConfigProvider.ts         # 环境变量提供者
│   ├── FileConfigProvider.ts        # 文件配置提供者
│   ├── ConfigValidator.ts           # 配置验证器
│   └── schemas/                     # 配置 schema
│       ├── server.schema.ts
│       ├── gitlab.schema.ts
│       └── plugins.schema.ts
├── logging/                          # 日志系统
│   ├── Logger.ts                    # 日志接口
│   ├── ConsoleLogger.ts             # 控制台日志
│   ├── FileLogger.ts                # 文件日志
│   ├── StructuredLogger.ts          # 结构化日志
│   └── LogContext.ts                # 日志上下文
├── errors/                           # 错误处理
│   ├── ErrorCode.ts                 # 错误码定义
│   ├── BaseError.ts                 # 错误基类
│   ├── BusinessError.ts             # 业务错误
│   ├── SystemError.ts               # 系统错误
│   └── ErrorHandler.ts              # 错误处理器
├── cache/                            # 缓存系统
│   ├── CacheProvider.ts             # 缓存接口
│   ├── MemoryCache.ts               # 内存缓存
│   ├── RedisCache.ts                # Redis 缓存
│   └── CacheStrategy.ts             # 缓存策略
├── monitoring/                       # 监控系统
│   ├── MetricsCollector.ts          # 指标收集器
│   ├── Tracer.ts                    # 链路追踪
│   └── HealthCheck.ts               # 健康检查
├── types/                            # 类型定义
│   ├── index.ts                     # 类型导出
│   ├── gitlab.types.ts              # GitLab 类型
│   ├── mcp.types.ts                 # MCP 类型
│   └── common.types.ts              # 通用类型
└── utils/                            # 工具函数
    ├── retry.ts                     # 重试工具
    ├── validation.ts                # 验证工具
    └── helpers.ts                   # 辅助函数
```

### 5.2 第一层：传输层设计

#### 5.2.1 传输层职责

**核心职责**：
- 处理不同传输协议的网络通信
- 将底层传输抽象为统一的消息接口
- 管理连接的建立、维护、关闭
- 不包含任何业务逻辑

#### 5.2.2 传输接口设计

**统一的传输接口**：

所有传输实现都必须实现 `Transport` 接口，确保传输层可互换：

```typescript
interface Transport {
  // 传输类型标识
  readonly type: 'stdio' | 'http' | 'websocket';
  
  // 启动传输
  start(): Promise<void>;
  
  // 停止传输
  stop(): Promise<void>;
  
  // 发送消息
  send(message: JsonRpcMessage): Promise<void>;
  
  // 接收消息事件
  onMessage(handler: (message: JsonRpcMessage) => void): void;
  
  // 错误事件
  onError(handler: (error: Error) => void): void;
  
  // 关闭事件
  onClose(handler: () => void): void;
  
  // 健康检查
  isHealthy(): boolean;
}
```

#### 5.2.3 StdioTransport（保持现有实现）

**特点**：
- 继续使用 `@modelcontextprotocol/sdk` 的 `StdioServerTransport`
- 适用于本地集成（Cursor、Claude Desktop）
- 无需修改，保持向后兼容

#### 5.2.4 HttpTransport（新增）

**设计要点**：
- 使用 HTTP POST 接收请求
- 使用 Server-Sent Events (SSE) 推送响应
- 支持 CORS 配置
- 支持 Bearer Token 认证

**端点设计**：
- `POST /mcp/messages` - 接收客户端消息
- `GET /mcp/stream` - SSE 事件流
- `GET /health` - 健康检查
- `GET /metrics` - 监控指标

**配置参数**：
- `port`: 监听端口（默认 3000）
- `host`: 监听地址（默认 0.0.0.0）
- `cors`: CORS 配置
- `auth`: 认证配置

#### 5.2.5 WebSocketTransport（新增）

**设计要点**：
- 双向实时通信
- 支持心跳检测
- 自动断线重连
- 支持消息压缩

**配置参数**：
- `port`: WebSocket 端口（默认 3001）
- `path`: WebSocket 路径（默认 /mcp）
- `heartbeatInterval`: 心跳间隔（默认 30s）
- `reconnectTimeout`: 重连超时（默认 5s）

#### 5.2.6 TransportManager（传输管理器）

**职责**：
- 管理多个传输实例
- 根据配置启动/停止传输
- 将所有传输的消息路由到协议层

**关键方法**：
- `registerTransport(transport: Transport)`: 注册传输
- `startAll()`: 启动所有已注册的传输
- `stopAll()`: 停止所有传输
- `getTransport(type: string)`: 获取指定传输

### 5.3 第二层：协议层设计

#### 5.3.1 协议层职责

**核心职责**：
- 处理 MCP 协议的消息验证
- 路由消息到对应的能力处理器
- 统一错误响应格式
- 协议版本兼容性处理

#### 5.3.2 McpServer（使用 SDK）

继续使用 `@modelcontextprotocol/sdk` 提供的 `McpServer`，但重构其使用方式：

**当前问题**：
- 工具注册分散在多个模块
- 缺少统一的注册管理

**改进方案**：
- 通过 `CapabilityManager` 统一注册所有能力
- McpServer 只负责协议处理，不包含业务逻辑

#### 5.3.3 MessageValidator（消息验证器）

**职责**：
- 验证请求消息格式
- 验证参数类型和必填项
- 返回友好的错误信息

**验证规则**：
- JSON-RPC 格式验证
- 方法名称验证
- 参数 schema 验证（使用 Zod）

#### 5.3.4 ProtocolErrorHandler（协议错误处理器）

**职责**：
- 将各种错误转换为 MCP 标准错误格式
- 记录错误日志
- 统计错误指标

**错误分类**：
- `-32700`: Parse error（解析错误）
- `-32600`: Invalid Request（无效请求）
- `-32601`: Method not found（方法不存在）
- `-32602`: Invalid params（参数无效）
- `-32603`: Internal error（内部错误）

### 5.4 第三层：能力层设计

#### 5.4.1 能力层职责

**核心职责**：
- 实现 MCP 的三种能力（Tools、Resources、Prompts）
- 提供统一的注册和发现机制
- 管理能力的生命周期
- 处理能力间的依赖关系

#### 5.4.2 ToolRegistry（工具注册表）

**职责**：
- 管理所有工具的注册和发现
- 验证工具定义
- 提供工具列表查询
- 分发工具调用请求

**关键方法**：
```typescript
class ToolRegistry {
  // 注册工具
  registerTool(tool: Tool): void;
  
  // 注销工具
  unregisterTool(name: string): void;
  
  // 获取工具
  getTool(name: string): Tool | undefined;
  
  // 列出所有工具
  listTools(filter?: ToolFilter): ToolInfo[];
  
  // 执行工具
  executeTool(name: string, params: any, context: ExecutionContext): Promise<any>;
}
```

**工具元数据**：
```typescript
interface ToolInfo {
  name: string;
  description: string;
  inputSchema: ZodSchema;
  outputSchema?: ZodSchema;
  category: string;         // 工具分类
  tags: string[];           // 标签
  examples?: ToolExample[]; // 使用示例
  deprecated?: boolean;     // 是否废弃
  version: string;          // 版本
  plugin: string;           // 所属插件
}
```

#### 5.4.3 ResourceRegistry（资源注册表）

**职责**：
- 管理所有资源的注册和发现
- 提供 URI 解析和路由
- 支持资源订阅和变更通知
- 实现资源缓存

**资源 URI 设计**：
```
gitlab://projects/{projectId}                    # 项目信息
gitlab://projects/{projectId}/tree               # 文件树
gitlab://projects/{projectId}/mrs/{iid}          # MR 详情
gitlab://projects/{projectId}/mrs/{iid}/changes  # MR 变更
gitlab://projects/{projectId}/files/{path}       # 文件内容
gitlab://code-review-rules                       # 审查规则
gitlab://code-review-rules/{extension}           # 特定类型审查规则
```

**资源类型**：
```typescript
interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;         // text/plain, application/json 等
  size?: number;            // 资源大小
  metadata?: object;        // 元数据
  cacheable: boolean;       // 是否可缓存
  subscribable: boolean;    // 是否可订阅变更
}
```

#### 5.4.4 PromptRegistry（提示注册表）

**职责**：
- 管理所有提示模板
- 提供模板渲染
- 支持变量插值和条件渲染
- 版本管理

**提示模板设计**：

```typescript
interface Prompt {
  name: string;
  description: string;
  arguments: PromptArgument[];  // 模板参数
  template: string;             // 模板内容
  version: string;              // 版本
  examples?: PromptExample[];   // 示例
}

interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  default?: any;
}
```

**内置提示模板**：

1. **code-review-typescript**：
   - 参数：`filePath`, `diffContent`, `severity`（critical/warning/suggestion）
   - 用途：TypeScript 代码审查

2. **code-review-vue**：
   - 参数：`filePath`, `diffContent`, `severity`
   - 用途：Vue 组件审查

3. **mr-description**：
   - 参数：`title`, `changes`, `author`
   - 用途：生成规范的 MR 描述

4. **commit-message**：
   - 参数：`type`（feat/fix/docs 等）, `scope`, `description`
   - 用途：生成规范的提交信息

### 5.5 第四层：中间件层设计

#### 5.5.1 中间件模式

**设计模式**：
采用**责任链模式**，请求依次通过多个中间件，每个中间件可以：
- 在请求处理前执行逻辑（如认证、日志）
- 决定是否继续传递给下一个中间件
- 在响应返回前执行逻辑（如修改响应、记录耗时）
- 捕获和处理异常

**中间件接口**：
```typescript
interface Middleware {
  readonly name: string;
  readonly priority: number;  // 优先级，数字越小越先执行
  
  execute(
    context: MiddlewareContext,
    next: () => Promise<any>
  ): Promise<any>;
}

interface MiddlewareContext {
  request: ToolRequest | ResourceRequest | PromptRequest;
  response?: any;
  metadata: Map<string, any>;  // 中间件间共享数据
  startTime: number;
  traceId: string;
  userId?: string;
}
```

#### 5.5.2 LoggingMiddleware（日志中间件）

**职责**：
- 记录所有请求和响应
- 记录执行耗时
- 记录错误和异常
- 提供结构化日志

**日志格式**：
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "traceId": "abc123",
  "type": "tool_call",
  "toolName": "get_merge_request",
  "params": { "projectPath": "...", "mergeRequestIid": 42 },
  "duration": 1250,
  "status": "success",
  "userId": "user123"
}
```

**日志级别控制**：
- DEBUG：详细的调试信息
- INFO：正常的操作日志
- WARN：警告信息（如降级、重试）
- ERROR：错误信息

#### 5.5.3 AuthenticationMiddleware（认证中间件）

**职责**：
- 验证客户端身份
- 提取用户信息
- 支持多种认证方式

**支持的认证方式**：

1. **API Key 认证**：
   - 通过 HTTP Header `X-API-Key` 传递
   - 适用于服务间调用

2. **Bearer Token 认证**：
   - 通过 HTTP Header `Authorization: Bearer <token>` 传递
   - 支持 JWT 解析

3. **无认证模式**（仅 stdio）：
   - stdio 传输默认信任本地进程

**配置示例**：
```typescript
{
  auth: {
    enabled: true,
    mode: 'api-key',
    apiKeys: ['key1', 'key2'],
    jwtSecret: 'secret',
    exemptPaths: ['/health', '/metrics']
  }
}
```

#### 5.5.4 AuthorizationMiddleware（授权中间件）

**职责**：
- 检查用户权限
- 实现细粒度访问控制
- 记录权限拒绝事件

**权限模型**：

**基于角色的访问控制（RBAC）**：
```typescript
{
  roles: {
    'admin': {
      tools: ['*'],          // 所有工具
      resources: ['*']       // 所有资源
    },
    'developer': {
      tools: ['get_*', 'list_*', 'analyze_*'],
      resources: ['gitlab://projects/*/mrs/*']
    },
    'readonly': {
      tools: ['get_*', 'list_*'],
      resources: ['gitlab://projects/*/mrs/*']
    }
  }
}
```

#### 5.5.5 RateLimitMiddleware（限流中间件）

**职责**：
- 防止 API 滥用
- 保护下游服务（GitLab API）
- 实现多级限流策略

**限流策略**：

1. **全局限流**：
   - 限制整个服务的请求速率
   - 例如：每秒最多 100 个请求

2. **用户限流**：
   - 限制单个用户的请求速率
   - 例如：每个用户每分钟最多 60 个请求

3. **工具限流**：
   - 限制特定工具的调用频率
   - 例如：`push_code_review_comments` 每分钟最多 10 次

**限流算法**：
- **令牌桶算法**（Token Bucket）：适合突发流量
- **滑动窗口算法**（Sliding Window）：更精确的限流

**配置示例**：
```typescript
{
  rateLimit: {
    global: { requests: 100, window: '1s' },
    perUser: { requests: 60, window: '1m' },
    perTool: {
      'push_code_review_comments': { requests: 10, window: '1m' }
    }
  }
}
```

#### 5.5.6 CacheMiddleware（缓存中间件）

**职责**：
- 缓存工具调用结果
- 缓存资源内容
- 提升响应速度
- 减少 GitLab API 调用

**缓存策略**：

1. **可缓存的工具**：
   - `get_merge_request`：缓存 5 分钟
   - `get_project`：缓存 30 分钟
   - `get_file_content`：缓存 10 分钟

2. **不可缓存的工具**：
   - `update_merge_request_description`：写操作
   - `push_code_review_comments`：写操作

3. **缓存失效**：
   - TTL（Time To Live）过期
   - 手动清除缓存
   - 写操作自动失效相关缓存

**缓存键设计**：
```
tool:{toolName}:{hash(params)}
resource:{uri}
```

#### 5.5.7 ErrorHandlingMiddleware（错误处理中间件）

**职责**：
- 统一捕获和处理异常
- 将异常转换为友好的错误响应
- 记录错误日志和堆栈
- 实现错误恢复和降级

**错误分类处理**：

1. **业务错误**（BusinessError）：
   - 如项目不存在、MR 不存在
   - 返回 HTTP 400，包含明确的错误信息

2. **系统错误**（SystemError）：
   - 如数据库连接失败、网络超时
   - 返回 HTTP 500，记录详细日志，通知运维

3. **GitLab API 错误**：
   - 401：Token 无效或过期
   - 403：权限不足
   - 404：资源不存在
   - 429：速率限制
   - 自动重试（除 4xx 错误外）

**错误响应格式**：
```json
{
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "项目 'company/project' 不存在或无权访问",
    "details": {
      "projectPath": "company/project"
    },
    "traceId": "abc123"
  }
}
```

#### 5.5.8 PerformanceMiddleware（性能监控中间件）

**职责**：
- 记录工具调用耗时
- 统计成功率和失败率
- 提供性能指标
- 识别性能瓶颈

**收集的指标**：
- 请求总数
- 成功/失败数
- P50/P90/P95/P99 响应时间
- 错误率
- 并发数

**指标格式**（Prometheus 兼容）：
```
# 工具调用总数
mcp_tool_calls_total{tool="get_merge_request",status="success"} 1234

# 工具调用耗时
mcp_tool_duration_seconds{tool="get_merge_request",quantile="0.5"} 0.5
mcp_tool_duration_seconds{tool="get_merge_request",quantile="0.95"} 1.2

# 错误率
mcp_tool_errors_total{tool="get_merge_request",error_type="gitlab_api"} 5
```

### 5.6 第五层：业务层设计

#### 5.6.1 业务层职责

**核心职责**：
- 实现纯业务逻辑，不包含技术细节
- 协调多个数据访问层完成复杂操作
- 业务规则和验证
- 事务管理（如果需要）

#### 5.6.2 服务分层原则

**每个服务负责一个业务域**：
- **MergeRequestService**：MR 相关的所有业务逻辑
- **FileOperationService**：文件操作相关业务逻辑
- **CodeReviewService**：代码审查相关业务逻辑
- **ProjectService**：项目管理相关业务逻辑

**服务间调用**：
- 允许服务间调用（通过依赖注入）
- 避免循环依赖
- 复杂场景使用编排服务（Orchestrator）

#### 5.6.3 MergeRequestService

**职责**：
- 获取 MR 信息（基本信息、变更、提交）
- 更新 MR 描述
- MR 列表查询和过滤
- MR 相关的业务规则验证

**关键方法**：
```typescript
class MergeRequestService {
  constructor(
    private gitlabRepo: GitLabRepository,
    private cacheRepo: CacheRepository,
    private logger: Logger
  ) {}
  
  // 获取 MR 详情（带缓存）
  async getMergeRequest(
    projectPath: string,
    mrIid: number
  ): Promise<MergeRequest>;
  
  // 获取 MR 变更（带缓存和过滤）
  async getMergeRequestChanges(
    projectPath: string,
    mrIid: number,
    options?: {
      includeContent?: boolean;
      focusFiles?: string[];
    }
  ): Promise<MergeRequestChanges>;
  
  // 更新 MR 描述（验证权限）
  async updateMergeRequestDescription(
    projectPath: string,
    mrIid: number,
    description: string,
    userId?: string
  ): Promise<MergeRequest>;
  
  // 批量获取 MR
  async listMergeRequests(
    projectPath: string,
    filter: MRFilter
  ): Promise<MergeRequest[]>;
}
```

#### 5.6.4 CodeReviewService

**职责**：
- 分析 MR 变更
- 应用审查规则
- 生成审查评论
- 推送评论到 GitLab

**关键方法**：
```typescript
class CodeReviewService {
  constructor(
    private mrService: MergeRequestService,
    private gitlabRepo: GitLabRepository,
    private ruleEngine: CodeReviewRuleEngine,
    private logger: Logger
  ) {}
  
  // 分析 MR 变更
  async analyzeMergeRequest(
    projectPath: string,
    mrIid: number,
    options?: AnalyzeOptions
  ): Promise<AnalysisResult>;
  
  // 应用审查规则
  async applyReviewRules(
    analysis: AnalysisResult,
    rules?: CustomRules
  ): Promise<ReviewComment[]>;
  
  // 推送审查评论
  async pushReviewComments(
    projectPath: string,
    mrIid: number,
    comments: ReviewComment[],
    options?: PushOptions
  ): Promise<PushResult>;
  
  // 完整的审查流程
  async reviewMergeRequest(
    projectPath: string,
    mrIid: number,
    options?: ReviewOptions
  ): Promise<ReviewReport>;
}
```

**CodeReviewRuleEngine（审查规则引擎）**：

**职责**：
- 加载和管理审查规则
- 匹配文件到对应规则
- 执行规则检查
- 生成审查建议

**规则来源**：
1. 内置规则（默认规则）
2. 项目规则（项目根目录 `.mcp/review-rules.json`）
3. 自定义规则（通过工具参数传入）

**规则优先级**：
自定义规则 > 项目规则 > 内置规则

**规则格式**：
```typescript
interface ReviewRule {
  id: string;
  name: string;
  description: string;
  filePattern: string | RegExp;  // 文件匹配模式
  categories: string[];           // 审查维度
  checks: Check[];                // 具体检查项
  severity: 'critical' | 'warning' | 'suggestion';
  autoFixable: boolean;
}

interface Check {
  id: string;
  description: string;
  pattern?: string | RegExp;      // 代码模式匹配
  message: string;                // 问题描述
  suggestion: string;             // 修复建议
}
```

### 5.7 第六层：数据访问层设计

#### 5.7.1 数据访问层职责

**核心职责**：
- 封装外部 API 调用（GitLab API）
- 统一的错误处理和重试
- 数据格式转换
- 不包含业务逻辑

#### 5.7.2 Repository 模式

**设计原则**：
- 每个数据源对应一个 Repository
- Repository 提供 CRUD 接口
- Repository 返回领域模型，不返回 API 原始数据

**GitLabRepository（重构版）**：

**职责**：
- 所有 GitLab API 调用
- API 响应转换为领域模型
- 统一的重试和错误处理
- **不包含业务逻辑**（如行内评论的 SHA 获取策略）

**改进点**：
1. 将 `createFileLineComment` 中的复杂逻辑移到业务层
2. 只提供基础的 API 调用方法
3. 使用统一的错误类型
4. 支持请求取消和超时控制

**关键方法**：
```typescript
class GitLabRepository {
  constructor(
    private config: GitLabConfig,
    private httpClient: HttpClient,
    private logger: Logger
  ) {}
  
  // 基础 API 调用
  async getProject(projectId: string | number): Promise<Project>;
  async getMergeRequest(projectId: string | number, mrIid: number): Promise<MergeRequest>;
  async getMergeRequestChanges(projectId: string | number, mrIid: number): Promise<MRChanges>;
  async getMergeRequestVersions(projectId: string | number, mrIid: number): Promise<MRVersion[]>;
  async getMergeRequestCommits(projectId: string | number, mrIid: number): Promise<Commit[]>;
  
  // 文件操作
  async getFile(projectId: string | number, filePath: string, ref: string): Promise<File>;
  
  // 评论操作
  async createNote(projectId: string | number, mrIid: number, body: string): Promise<Note>;
  async createDiscussion(
    projectId: string | number,
    mrIid: number,
    body: string,
    position?: Position
  ): Promise<Discussion>;
  
  // 底层 HTTP 方法（供复杂场景使用）
  async request<T>(options: RequestOptions): Promise<T>;
}
```

#### 5.7.3 CacheRepository

**职责**：
- 提供统一的缓存接口
- 支持多种缓存后端（内存、Redis）
- 缓存序列化和反序列化

**关键方法**：
```typescript
class CacheRepository {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async delete(key: string): Promise<void>;
  async clear(pattern?: string): Promise<void>;
  async exists(key: string): Promise<boolean>;
}
```

#### 5.7.4 ConfigRepository

**职责**：
- 从多种配置源加载配置
- 配置合并和覆盖
- 配置变更监听

**配置源优先级**：
1. 命令行参数（最高优先级）
2. 环境变量
3. 配置文件（`.mcp/config.json`）
4. 默认值（最低优先级）

### 5.8 插件系统设计

#### 5.8.1 插件架构

**插件定义**：

插件是一个独立的功能模块，可以提供工具、资源、提示等能力。

**插件结构**：
```typescript
interface Plugin {
  metadata: PluginMetadata;
  initialize(context: PluginContext): Promise<void>;
  register(registry: CapabilityRegistry): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  destroy(): Promise<void>;
}

interface PluginMetadata {
  name: string;
  version: string;
  author: string;
  description: string;
  homepage?: string;
  dependencies?: string[];  // 依赖的其他插件
  mcpVersion: string;       // 支持的 MCP 版本
}
```

#### 5.8.2 内置插件重构

将现有功能重构为三个内置插件：

**1. gitlab-mr 插件**：
- 工具：`get_merge_request`, `list_merge_requests`, `update_merge_request_description` 等
- 资源：`gitlab://projects/{id}/mrs/{iid}`
- 提示：`mr-description`

**2. gitlab-file 插件**：
- 工具：`get_file_content`, `list_files`, `search_files`
- 资源：`gitlab://projects/{id}/files/{path}`
- 提示：无

**3. gitlab-code-review 插件**：
- 工具：`analyze_mr_changes`, `push_code_review_comments`, `get_file_code_review_rules`
- 资源：`gitlab://code-review-rules`
- 提示：`code-review-typescript`, `code-review-vue`

#### 5.8.3 插件加载机制

**加载方式**：

1. **内置插件**：
   - 编译到主程序中
   - 启动时自动加载

2. **本地插件**：
   - 从 `.mcp/plugins/` 目录加载
   - 支持 TypeScript/JavaScript

3. **npm 包插件**：
   - 从 `node_modules` 加载
   - 包名格式：`@mcp/gitlab-plugin-*`

**插件发现**：
```typescript
class PluginLoader {
  // 从目录加载插件
  async loadFromDirectory(dir: string): Promise<Plugin[]>;
  
  // 从 npm 包加载
  async loadFromNpm(packageName: string): Promise<Plugin>;
  
  // 验证插件
  validatePlugin(plugin: Plugin): ValidationResult;
}
```

#### 5.8.4 插件隔离和安全

**安全措施**：
1. **权限声明**：插件必须声明需要的权限
2. **沙箱隔离**：限制插件的文件系统和网络访问
3. **资源限制**：限制插件的 CPU 和内存使用
4. **签名验证**：验证插件来源的可信度

### 5.9 配置管理重构

#### 5.9.1 配置分层

**配置分为四层**：

1. **默认配置**（代码中定义）
2. **全局配置**（`~/.mcp/config.json`）
3. **项目配置**（项目根目录 `.mcp/config.json`）
4. **环境变量**（最高优先级）

#### 5.9.2 配置结构

```typescript
interface ServerConfig {
  server: {
    transports: TransportConfig[];
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logOutput: 'console' | 'file' | 'both';
  };
  
  gitlab: {
    host: string;
    token: string;
    timeout: number;
    retries: number;
  };
  
  middleware: {
    logging: { enabled: boolean };
    auth: AuthConfig;
    rateLimit: RateLimitConfig;
    cache: CacheConfig;
  };
  
  plugins: {
    enabled: string[];      // 启用的插件列表
    disabled: string[];     // 禁用的插件列表
    config: Record<string, any>;  // 插件配置
  };
}
```

#### 5.9.3 配置文件示例

```json
{
  "server": {
    "transports": [
      { "type": "stdio" },
      {
        "type": "http",
        "port": 3000,
        "cors": ["http://localhost:3001"]
      }
    ],
    "logLevel": "info",
    "logOutput": "file"
  },
  
  "gitlab": {
    "host": "https://gitlab.com",
    "token": "${GITLAB_TOKEN}",
    "timeout": 30000,
    "retries": 3
  },
  
  "middleware": {
    "auth": {
      "enabled": true,
      "mode": "api-key",
      "apiKeys": ["${API_KEY_1}", "${API_KEY_2}"]
    },
    "rateLimit": {
      "global": { "requests": 100, "window": "1s" }
    },
    "cache": {
      "enabled": true,
      "type": "memory",
      "ttl": 300
    }
  },
  
  "plugins": {
    "enabled": ["gitlab-mr", "gitlab-file", "gitlab-code-review"],
    "config": {
      "gitlab-code-review": {
        "rules": "strict",
        "autoComment": false
      }
    }
  }
}
```

### 5.10 日志系统重构

#### 5.10.1 统一的日志接口

```typescript
interface Logger {
  trace(message: string, context?: object): void;
  debug(message: string, context?: object): void;
  info(message: string, context?: object): void;
  warn(message: string, context?: object): void;
  error(message: string, error?: Error, context?: object): void;
  fatal(message: string, error?: Error, context?: object): void;
  
  // 创建子 logger（带上下文）
  child(context: object): Logger;
}
```

#### 5.10.2 结构化日志

**日志格式**（JSON）：
```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "MergeRequestService",
  "message": "获取 MR 详情",
  "context": {
    "projectPath": "company/project",
    "mrIid": 42,
    "userId": "user123",
    "traceId": "abc123"
  },
  "duration": 1250
}
```

#### 5.10.3 日志输出

**支持多种输出方式**：
1. **Console**：开发环境
2. **File**：生产环境，支持日志轮转
3. **Syslog**：集中式日志收集
4. **HTTP**：发送到日志服务（如 Elasticsearch）

### 5.11 错误处理重构

#### 5.11.1 错误分类

**定义统一的错误体系**：

```typescript
// 错误基类
class BaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

// 业务错误
class BusinessError extends BaseError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
  }
}

// 系统错误
class SystemError extends BaseError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, details);
  }
}

// GitLab API 错误
class GitLabApiError extends BaseError {
  constructor(
    public statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(code, message, details);
  }
}
```

#### 5.11.2 错误码定义

```typescript
enum ErrorCode {
  // 通用错误 (1000-1999)
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // GitLab 相关错误 (2000-2999)
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  MR_NOT_FOUND = 'MR_NOT_FOUND',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  GITLAB_API_ERROR = 'GITLAB_API_ERROR',
  GITLAB_AUTH_ERROR = 'GITLAB_AUTH_ERROR',
  GITLAB_PERMISSION_DENIED = 'GITLAB_PERMISSION_DENIED',
  
  // 认证授权错误 (3000-3999)
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // 限流错误 (4000-4999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // 插件错误 (5000-5999)
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR'
}
```

---

## 六、分阶段实施计划

### 6.1 总体时间规划

**总周期**：16 周（4 个月）

**阶段划分**：
- **阶段 0**：准备阶段（2 周）
- **阶段 1**：基础设施重构（3 周）
- **阶段 2**：架构重构（4 周）
- **阶段 3**：能力扩展（3 周）
- **阶段 4**：性能优化（2 周）
- **阶段 5**：安全增强（2 周）

### 6.2 阶段 0：准备阶段（第 1-2 周）

#### 6.2.1 目标

- 建立完整的测试基准
- 完善文档和规范
- 准备开发环境和工具

#### 6.2.2 任务清单

**1. 编写集成测试（第 1 周）**：
- 为所有现有工具编写集成测试
- 测试覆盖核心场景
- 建立性能基准（响应时间、资源使用）
- 设置 CI/CD 自动测试

**2. 完善文档（第 1 周）**：
- 完成本架构设计文档
- 编写 API 文档（当前工具的详细说明）
- 编写开发者指南（如何贡献代码）
- 编写部署手册

**3. 准备开发环境（第 2 周）**：
- 设置代码仓库和分支策略
- 配置 linter 和 formatter
- 设置代码审查流程
- 准备测试环境（GitLab 测试项目）

**4. 技术预研（第 2 周）**：
- 评估依赖注入框架（InversifyJS vs TSyringe vs 自研）
- 评估日志库（winston vs pino）
- 评估缓存方案（node-cache vs ioredis）
- 评估 HTTP 框架（express vs fastify）

#### 6.2.3 交付物

- [ ] 集成测试套件（覆盖率 100%）
- [ ] 性能基准报告
- [ ] 完整的文档集
- [ ] 开发环境和 CI/CD 配置
- [ ] 技术选型报告

#### 6.2.4 验收标准

- 所有现有工具有集成测试
- 测试通过率 100%
- 文档评审通过
- CI/CD 自动运行测试

### 6.3 阶段 1：基础设施重构（第 3-5 周）

#### 6.3.1 目标

- 建立统一的日志系统
- 重构配置管理
- 建立统一的错误处理
- 不影响现有功能

#### 6.3.2 任务清单

**1. 日志系统实现（第 3 周）**：
- 实现 Logger 接口和多种实现
- 替换所有 console.log/error 为统一日志
- 实现日志上下文（traceId）
- 实现日志文件轮转
- 单元测试

**2. 配置管理重构（第 4 周）**：
- 实现 ConfigProvider 接口
- 实现多配置源支持
- 实现配置合并和验证
- 支持配置文件（JSON/YAML）
- 单元测试

**3. 错误处理重构（第 5 周）**：
- 定义错误类型体系
- 定义错误码
- 实现统一错误处理
- 替换所有错误抛出为统一错误类型
- 单元测试

#### 6.3.3 交付物

- [ ] 生产级日志系统
- [ ] 灵活的配置管理系统
- [ ] 统一的错误处理机制
- [ ] 单元测试（覆盖率 80%+）
- [ ] 集成测试全部通过

#### 6.3.4 验收标准

- 所有日志输出结构化
- 支持至少 2 种配置源
- 所有错误有明确分类和错误码
- 现有功能不受影响
- 测试覆盖率达标

### 6.4 阶段 2：架构重构（第 6-9 周）

#### 6.4.1 目标

- 实现六层架构
- 实现依赖注入
- 实现插件系统
- 重构现有功能为插件

#### 6.4.2 任务清单

**1. 依赖注入框架（第 6 周）**：
- 实现 DI 容器
- 定义服务接口
- 重构核心类支持 DI
- 单元测试

**2. 传输层和协议层（第 6 周）**：
- 实现 Transport 接口
- 实现 TransportManager
- 重构现有 stdio 传输
- 单元测试

**3. 能力层实现（第 7 周）**：
- 实现 ToolRegistry
- 实现 ResourceRegistry
- 实现 PromptRegistry
- 实现 CapabilityManager
- 单元测试

**4. 中间件框架（第 7 周）**：
- 实现 Middleware 接口
- 实现 MiddlewareChain
- 实现基础中间件（Logging、ErrorHandling）
- 单元测试

**5. 业务层重构（第 8 周）**：
- 实现 Service 层
- 将工具逻辑迁移到 Service
- 实现数据访问层
- 单元测试

**6. 插件系统实现（第 9 周）**：
- 实现 Plugin 接口
- 实现 PluginRegistry
- 实现 PluginLoader
- 将现有功能重构为 3 个插件
- 单元测试

#### 6.4.3 交付物

- [ ] 完整的六层架构
- [ ] 依赖注入系统
- [ ] 插件系统
- [ ] 3 个内置插件
- [ ] 单元测试（覆盖率 80%+）
- [ ] 集成测试全部通过

#### 6.4.4 验收标准

- 所有层职责清晰
- 所有服务通过 DI 注入依赖
- 插件可以独立加载/卸载
- 现有工具功能完全兼容
- 测试覆盖率达标

### 6.5 阶段 3：能力扩展（第 10-12 周）

#### 6.5.1 目标

- 实现 Resources 能力
- 实现 Prompts 能力
- 实现 HTTP 传输
- 扩展中间件

#### 6.5.2 任务清单

**1. Resources 实现（第 10 周）**：
- 设计资源 URI 规范
- 实现资源提供者
- 实现 GitLab 资源（项目、MR、文件树等）
- 实现审查规则资源
- 单元测试和集成测试

**2. Prompts 实现（第 10 周）**：
- 实现提示模板引擎
- 实现变量插值和条件渲染
- 创建内置提示模板（代码审查、MR 描述等）
- 单元测试

**3. HTTP 传输（第 11 周）**：
- 实现 HttpTransport
- 实现 SSE 推送
- 实现 HTTP 中间件（CORS、认证等）
- 编写 HTTP 客户端示例
- 集成测试

**4. 扩展中间件（第 12 周）**：
- 实现 AuthenticationMiddleware
- 实现 RateLimitMiddleware
- 实现 CacheMiddleware
- 实现 PerformanceMiddleware
- 单元测试

#### 6.5.3 交付物

- [ ] Resources 能力（至少 5 个资源）
- [ ] Prompts 能力（至少 4 个提示）
- [ ] HTTP 传输支持
- [ ] 6 个中间件
- [ ] HTTP 客户端示例
- [ ] 单元测试和集成测试

#### 6.5.4 验收标准

- 资源可以通过 URI 访问
- 提示模板正确渲染
- HTTP 传输可以正常通信
- 中间件正确拦截请求
- 测试覆盖率达标

### 6.6 阶段 4：性能优化（第 13-14 周）

#### 6.6.1 目标

- 实现缓存机制
- 优化并发处理
- 优化大文件处理
- 降低响应时间

#### 6.6.2 任务清单

**1. 缓存实现（第 13 周）**：
- 实现内存缓存
- 实现 Redis 缓存（可选）
- 实现缓存策略（TTL、LRU）
- 为常用工具添加缓存
- 性能测试

**2. 并发优化（第 13 周）**：
- 实现请求并发处理
- 实现连接池
- 优化批量操作
- 性能测试

**3. 流式处理（第 14 周）**：
- 实现流式响应
- 优化大文件处理
- 实现分块传输
- 性能测试

**4. 性能调优（第 14 周）**：
- 性能分析和瓶颈识别
- 代码优化
- 内存优化
- 性能测试和基准对比

#### 6.6.3 交付物

- [ ] 多级缓存系统
- [ ] 并发处理能力
- [ ] 流式响应支持
- [ ] 性能测试报告
- [ ] 性能提升 50% 以上

#### 6.6.4 验收标准

- P95 响应时间降低 50%
- 支持 100+ 并发请求
- 大文件（>10MB）不阻塞
- 内存占用降低 30%
- 缓存命中率 > 60%

### 6.7 阶段 5：安全增强（第 15-16 周）

#### 6.7.1 目标

- 实现多种认证方式
- 实现权限控制
- 实现审计日志
- 敏感信息保护

#### 6.7.2 任务清单

**1. 认证实现（第 15 周）**：
- 实现 API Key 认证
- 实现 Bearer Token 认证
- 实现 JWT 解析和验证
- 单元测试和集成测试

**2. 授权实现（第 15 周）**：
- 实现 RBAC 模型
- 实现权限检查
- 配置默认角色和权限
- 单元测试

**3. 审计日志（第 16 周）**：
- 实现审计日志记录
- 记录敏感操作
- 实现日志查询接口
- 集成测试

**4. 安全加固（第 16 周）**：
- 敏感信息脱敏
- 配置加密存储
- 安全扫描和漏洞修复
- 安全测试

#### 6.7.3 交付物

- [ ] 3 种认证方式
- [ ] RBAC 权限控制
- [ ] 审计日志系统
- [ ] 安全加固措施
- [ ] 安全测试报告

#### 6.7.4 验收标准

- 认证通过率 100%
- 权限控制正确
- 100% 敏感操作有审计
- 无高危安全漏洞
- 日志中无敏感信息泄露

### 6.8 里程碑和交付节点

| 阶段 | 时间 | 关键交付 | 验收标准 |
|------|------|----------|----------|
| 阶段 0 | 第 2 周末 | 测试基准、文档 | 集成测试 100% |
| 阶段 1 | 第 5 周末 | 日志、配置、错误处理 | 功能不受影响 |
| 阶段 2 | 第 9 周末 | 六层架构、插件系统 | 工具 API 兼容 |
| 阶段 3 | 第 12 周末 | Resources、Prompts、HTTP | 3 种能力完整 |
| 阶段 4 | 第 14 周末 | 性能优化 | 性能提升 50% |
| 阶段 5 | 第 16 周末 | 安全增强 | 无高危漏洞 |

---

## 七、风险评估与应对策略

### 7.1 技术风险

#### 7.1.1 架构复杂度过高

**风险描述**：
六层架构和插件系统可能导致代码复杂度显著增加，影响开发效率和可维护性。

**风险等级**：中

**影响**：
- 新开发者上手困难
- 调试和问题定位复杂
- 维护成本增加

**应对策略**：
1. **充分的文档**：编写详细的架构文档和开发者指南
2. **代码示例**：提供丰富的示例代码
3. **渐进式引入**：先实现核心框架，再逐步完善
4. **开发工具**：提供脚手架工具快速创建插件

**监控指标**：
- 新功能开发时间
- 代码审查通过率
- 开发者反馈

#### 7.1.2 性能退化

**风险描述**：
新增的中间件层、依赖注入、插件系统可能导致性能下降。

**风险等级**：中

**影响**：
- 响应时间增加
- 资源占用上升
- 用户体验下降

**应对策略**：
1. **性能基准**：重构前建立性能基线
2. **持续监控**：每个阶段都进行性能测试
3. **性能优化**：专门的性能优化阶段
4. **回滚机制**：性能不达标时回滚变更

**监控指标**：
- P95 响应时间
- CPU 和内存使用率
- 吞吐量

#### 7.1.3 依赖库兼容性

**风险描述**：
新引入的依赖库可能与现有库冲突，或存在兼容性问题。

**风险等级**：低

**影响**：
- 构建失败
- 运行时错误
- 安全漏洞

**应对策略**：
1. **依赖评估**：仔细评估每个新依赖
2. **版本锁定**：使用精确的版本号
3. **定期更新**：定期检查和更新依赖
4. **安全扫描**：使用 npm audit 检查漏洞

### 7.2 兼容性风险

#### 7.2.1 工具 API 兼容性

**风险描述**：
重构后工具 API 与现有客户端（Cursor、Claude Desktop）不兼容。

**风险等级**：高

**影响**：
- 现有用户无法使用
- 需要客户端升级
- 用户体验中断

**应对策略**：
1. **API 不变原则**：严格保持工具名称和参数不变
2. **版本化**：如需变更，提供新版本工具
3. **兼容性测试**：每个阶段都测试与客户端的兼容性
4. **文档说明**：明确标注任何行为变更

**监控指标**：
- 兼容性测试通过率
- 用户问题反馈

#### 7.2.2 配置文件兼容性

**风险描述**：
新的配置格式与现有环境变量配置不兼容。

**风险等级**：中

**影响**：
- 用户需要修改配置
- 迁移成本
- 配置错误导致服务不可用

**应对策略**：
1. **向后兼容**：继续支持环境变量配置
2. **自动迁移**：提供配置迁移工具
3. **详细文档**：编写迁移指南
4. **配置验证**：启动时验证配置并给出友好提示

### 7.3 进度风险

#### 7.3.1 开发延期

**风险描述**：
重构任务量大，可能超出预期时间。

**风险等级**：中

**影响**：
- 项目延期交付
- 影响其他计划
- 团队士气下降

**应对策略**：
1. **缓冲时间**：预留 20% 缓冲时间
2. **优先级管理**：核心功能优先，次要功能可延后
3. **敏捷迭代**：每个阶段独立交付，可调整后续计划
4. **资源调配**：必要时增加人力

**监控指标**：
- 每周进度完成率
- 燃尽图
- 风险项数量

#### 7.3.2 资源不足

**风险描述**：
开发人员不足或技能不匹配。

**风险等级**：中

**影响**：
- 项目延期
- 质量下降
- 关键人员离职风险

**应对策略**：
1. **技能培训**：提前进行技术培训
2. **外部支持**：必要时引入外部专家
3. **知识共享**：建立知识库，降低人员依赖
4. **代码审查**：多人审查，知识传播

### 7.4 业务风险

#### 7.4.1 功能退化

**风险描述**：
重构后某些功能不可用或行为变化。

**风险等级**：高

**影响**：
- 用户无法完成工作
- 用户投诉增加
- 信任度下降

**应对策略**：
1. **完善测试**：重构前编写完整的集成测试
2. **灰度发布**：逐步切换流量，观察问题
3. **快速回滚**：出现问题立即回滚
4. **用户通知**：提前通知用户重大变更

**监控指标**：
- 集成测试通过率
- 错误率
- 用户反馈

#### 7.4.2 用户体验下降

**风险描述**：
重构后工具响应变慢，用户体验下降。

**风险等级**：中

**影响**：
- 用户满意度下降
- 用户流失
- 负面口碑

**应对策略**：
1. **性能基准**：确保性能不低于重构前
2. **用户反馈**：及时收集用户反馈
3. **快速修复**：优先修复性能问题
4. **透明沟通**：向用户说明改进计划

### 7.5 风险优先级矩阵

| 风险 | 概率 | 影响 | 优先级 | 责任人 |
|------|------|------|--------|--------|
| 工具 API 兼容性 | 低 | 高 | 高 | 架构师 |
| 功能退化 | 中 | 高 | 高 | 测试负责人 |
| 性能退化 | 中 | 中 | 中 | 性能工程师 |
| 开发延期 | 中 | 中 | 中 | 项目经理 |
| 架构复杂度过高 | 中 | 中 | 中 | 架构师 |

---

## 八、成功标准与验收条件

### 8.1 功能性标准

#### 8.1.1 工具兼容性

**标准**：
- 所有现有工具（15 个）功能完全保持
- 工具名称、参数、返回值格式不变
- 错误处理行为一致

**验收方法**：
- 运行完整的集成测试套件
- 与现有版本进行对比测试
- 真实环境验证（Cursor、Claude Desktop）

**验收标准**：
- [ ] 集成测试通过率 100%
- [ ] 对比测试无功能差异
- [ ] 真实环境正常工作

#### 8.1.2 新能力实现

**标准**：
- Resources 能力：至少 5 个资源
- Prompts 能力：至少 4 个提示模板
- HTTP 传输：完整的 HTTP+SSE 支持

**验收方法**：
- 功能测试
- 集成测试
- 文档验证

**验收标准**：
- [ ] 资源可通过 URI 访问
- [ ] 提示模板正确渲染
- [ ] HTTP 传输正常通信
- [ ] 所有能力有文档说明

#### 8.1.3 插件系统

**标准**：
- 内置 3 个插件正常工作
- 插件可以独立加载/卸载
- 插件开发文档完善

**验收方法**：
- 插件加载测试
- 插件隔离测试
- 开发者试用反馈

**验收标准**：
- [ ] 3 个插件正常工作
- [ ] 插件可动态加载
- [ ] 插件开发文档完整
- [ ] 至少 1 个第三方插件示例

### 8.2 非功能性标准

#### 8.2.1 性能标准

**标准**：
- P95 响应时间降低 50%（从 3s 到 1.5s）
- 支持 100+ 并发请求
- 内存占用降低 30%
- 缓存命中率 > 60%

**验收方法**：
- 性能测试工具（Artillery、JMeter）
- 压力测试
- 性能监控

**验收标准**：
- [ ] P50 响应时间 < 800ms
- [ ] P95 响应时间 < 1500ms
- [ ] P99 响应时间 < 2000ms
- [ ] 100 并发时错误率 < 1%
- [ ] 内存占用 < 500MB（空载）

#### 8.2.2 可测试性标准

**标准**：
- 单元测试覆盖率 ≥ 80%
- 集成测试覆盖核心场景
- 所有模块可独立测试

**验收方法**：
- 代码覆盖率工具（Istanbul）
- 测试报告
- 代码审查

**验收标准**：
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 集成测试覆盖率 ≥ 90%
- [ ] 所有 PR 包含测试
- [ ] CI/CD 自动运行测试

#### 8.2.3 可维护性标准

**标准**：
- 代码圈复杂度降低 40%
- 模块间依赖降低 50%
- 问题定位时间 < 30 分钟
- 代码审查通过率 ≥ 95%

**验收方法**：
- 静态分析工具（ESLint、SonarQube）
- 代码审查
- 问题追踪

**验收标准**：
- [ ] 平均圈复杂度 < 10
- [ ] 最大圈复杂度 < 20
- [ ] 模块间耦合度 < 5
- [ ] 代码审查问题 < 5 个/PR

#### 8.2.4 可扩展性标准

**标准**：
- 新增工具模块时间 < 2 小时
- 支持 3 种传输方式
- 第三方可开发插件

**验收方法**：
- 新功能开发测试
- 第三方开发者试用
- 文档验证

**验收标准**：
- [ ] stdio、HTTP、WebSocket 三种传输
- [ ] 插件开发文档完整
- [ ] 脚手架工具可用
- [ ] 至少 1 个第三方插件

#### 8.2.5 安全性标准

**标准**：
- 支持 3 种认证方式
- 100% 敏感操作有审计
- 无高危安全漏洞
- 日志中无敏感信息

**验收方法**：
- 安全扫描（npm audit、Snyk）
- 渗透测试
- 代码审查

**验收标准**：
- [ ] API Key、Bearer Token、JWT 三种认证
- [ ] 审计日志完整
- [ ] 无高危漏洞
- [ ] 无中危漏洞 > 5 个
- [ ] 敏感信息脱敏

### 8.3 文档标准

#### 8.3.1 架构文档

**标准**：
- 架构设计文档（本文档）
- 详细的模块说明
- 设计决策记录

**验收标准**：
- [ ] 架构图清晰
- [ ] 所有模块有说明
- [ ] 设计决策有记录

#### 8.3.2 API 文档

**标准**：
- 所有工具的详细说明
- 所有资源的 URI 规范
- 所有提示的参数说明

**验收标准**：
- [ ] 工具文档完整（15+ 个工具）
- [ ] 资源文档完整（5+ 个资源）
- [ ] 提示文档完整（4+ 个提示）
- [ ] 包含示例代码

#### 8.3.3 开发者文档

**标准**：
- 插件开发指南
- 贡献指南
- 代码规范

**验收标准**：
- [ ] 插件开发教程
- [ ] 示例插件代码
- [ ] 贡献流程说明
- [ ] 代码规范文档

#### 8.3.4 运维文档

**标准**：
- 部署手册
- 配置说明
- 监控告警
- 故障排查

**验收标准**：
- [ ] 部署步骤清晰
- [ ] 配置项说明完整
- [ ] 监控指标定义
- [ ] 常见问题解答

### 8.4 交付清单

#### 8.4.1 代码交付

- [ ] 重构后的源代码（src/）
- [ ] 单元测试代码（tests/unit/）
- [ ] 集成测试代码（tests/integration/）
- [ ] 示例插件（examples/plugins/）
- [ ] 配置文件示例（examples/config/）

#### 8.4.2 文档交付

- [ ] 架构设计文档（本文档）
- [ ] API 文档（docs/api/）
- [ ] 开发者指南（docs/developers/）
- [ ] 运维手册（docs/operations/）
- [ ] 迁移指南（docs/migration/）
- [ ] CHANGELOG（变更日志）

#### 8.4.3 工具交付

- [ ] 插件脚手架（cli/create-plugin.ts）
- [ ] 配置验证工具（cli/validate-config.ts）
- [ ] 性能测试脚本（benchmarks/）
- [ ] 部署脚本（scripts/deploy.sh）

#### 8.4.4 报告交付

- [ ] 测试报告（覆盖率、通过率）
- [ ] 性能测试报告（基准对比）
- [ ] 安全扫描报告（漏洞列表）
- [ ] 代码质量报告（SonarQube）

### 8.5 验收流程

#### 8.5.1 阶段验收

**流程**：
1. 开发团队完成阶段任务
2. 自测通过，提交验收申请
3. 测试团队执行测试
4. 架构师审查代码和设计
5. 项目经理确认交付物
6. 通过验收，进入下一阶段

**验收会议**：
- 参与人：开发、测试、架构师、项目经理
- 时间：每个阶段结束时
- 内容：演示功能、审查文档、讨论问题

#### 8.5.2 最终验收

**流程**：
1. 所有阶段完成
2. 完整回归测试
3. 性能测试和安全扫描
4. 文档审查
5. 用户试用（内部用户）
6. 验收会议
7. 签署验收报告

**验收会议**：
- 参与人：全体项目成员、干系人
- 时间：项目结束时
- 内容：项目总结、成果展示、经验分享

**验收报告内容**：
- 项目概述
- 交付物清单
- 验收标准对照
- 测试报告
- 遗留问题
- 改进建议

---

## 九、总结

### 9.1 重构核心价值

本次架构重构将为 GitLab MCP 服务器带来以下核心价值：

1. **可扩展性提升 3 倍**：
   - 插件化架构支持快速开发新功能
   - 多传输方式支持多种部署场景
   - 第三方可贡献插件，构建生态

2. **可维护性提升 70%**：
   - 清晰的六层架构，职责分明
   - 依赖注入降低耦合
   - 统一的日志、错误处理、监控

3. **性能提升 50%**：
   - 多级缓存机制
   - 并发处理优化
   - 流式响应支持

4. **安全性全面增强**：
   - 多种认证方式
   - 细粒度权限控制
   - 完善的审计日志

### 9.2 关键设计原则

1. **向后兼容**：现有工具 API 保持不变
2. **渐进式重构**：分 6 个阶段，每个阶段独立交付
3. **最小破坏**：不影响现有功能
4. **文档先行**：完善的文档和规范
5. **测试驱动**：测试覆盖率 80% 以上

### 9.3 项目里程碑

| 时间 | 里程碑 | 交付物 |
|------|--------|--------|
| 第 2 周 | 准备完成 | 测试基准、文档 |
| 第 5 周 | 基础设施完成 | 日志、配置、错误处理 |
| 第 9 周 | 架构重构完成 | 六层架构、插件系统 |
| 第 12 周 | 能力扩展完成 | Resources、Prompts、HTTP |
| 第 14 周 | 性能优化完成 | 缓存、并发、流式 |
| 第 16 周 | 安全增强完成 | 认证、授权、审计 |

### 9.4 成功标准

**功能性**：
- 15 个现有工具 100% 兼容
- 5+ 个资源、4+ 个提示
- 3 种传输方式

**非功能性**：
- 响应时间降低 50%
- 测试覆盖率 ≥ 80%
- 无高危安全漏洞

**可扩展性**：
- 新功能开发时间 < 2 小时
- 第三方可开发插件

### 9.5 风险管理

**高优先级风险**：
- 工具 API 兼容性（应对：严格测试）
- 功能退化（应对：完善测试、灰度发布）

**中优先级风险**：
- 性能退化（应对：性能基准、持续监控）
- 开发延期（应对：敏捷迭代、优先级管理）

### 9.6 下一步行动

1. **评审本文档**：
   - 召集团队评审会议
   - 收集反馈和建议
   - 修订和完善文档

2. **组建团队**：
   - 确定项目成员
   - 分配角色和职责
   - 进行技术培训

3. **启动阶段 0**：
   - 编写集成测试
   - 完善文档
   - 准备开发环境

4. **建立沟通机制**：
   - 每周进度会议
   - 问题追踪系统
   - 文档协作平台

---

**文档结束**

> 本文档版本：1.0  
> 最后更新：2025-12-30  
> 下次审查：2025-01-15