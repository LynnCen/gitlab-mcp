# GitLab MCP 服务器重构开发计划

> **项目类型**: 个人项目  
> **开发方式**: 完全重构（大爆炸式）  
> **总周期**: 12 周  
> **创建日期**: 2025-12-30

---

## 目录

- [一、项目概述](#一项目概述)
- [二、开发策略](#二开发策略)
- [三、阶段规划](#三阶段规划)
- [四、详细任务清单](#四详细任务清单)
- [五、里程碑和检查点](#五里程碑和检查点)
- [六、风险控制](#六风险控制)
- [七、开发环境准备](#七开发环境准备)

---

## 一、项目概述

### 1.1 项目目标

基于 `architecture.md` 中的架构设计，完全重构 GitLab MCP 服务器，实现：

- ✅ 六层架构（传输层、协议层、能力层、中间件层、业务层、数据访问层）
- ✅ 插件化系统（支持动态加载）
- ✅ 完整的 MCP 能力（Tools、Resources、Prompts）
- ✅ 多传输方式（stdio、HTTP+SSE、WebSocket）
- ✅ 统一的日志、错误处理、配置管理
- ✅ 性能优化（缓存、并发、流式处理）
- ✅ 安全增强（认证、授权、审计）

### 1.2 开发原则

**完全重构原则**：
- 在 `src-v2/` 目录下全新开发，不修改旧代码
- 保持工具 API 完全兼容（工具名称、参数、返回值）
- 开发完成后一次性替换，删除旧代码
- 不需要新旧代码共存和过渡期

**个人开发原则**：
- 每个阶段独立完成，可随时暂停和恢复
- 优先实现核心功能，次要功能可延后
- 文档和代码同步更新
- 每个阶段完成后提交代码和文档

### 1.3 时间规划

| 阶段 | 时间 | 主要工作 | 交付物 |
|------|------|----------|--------|
| 阶段 0 | 第 1-2 周 | 准备和设计 | 测试基准、详细设计 |
| 阶段 1 | 第 3-6 周 | 核心框架开发 | DI、传输层、能力层、中间件 |
| 阶段 2 | 第 7-10 周 | 业务功能实现 | 所有工具、Resources、Prompts |
| 阶段 3 | 第 11-12 周 | 测试和上线 | 测试报告、文档、发布 |

---

## 二、开发策略

### 2.1 代码组织

```
项目根目录/
├── src/                    # 旧代码（保持不动，作为参考）
├── src-v2/                 # 新架构代码（完全独立开发）
│   ├── core/              # 核心框架
│   ├── transport/          # 传输层
│   ├── capabilities/       # 能力层
│   ├── middleware/         # 中间件
│   ├── services/           # 业务层
│   ├── repositories/       # 数据访问层
│   ├── plugins/            # 插件
│   ├── config/             # 配置管理
│   ├── logging/            # 日志系统
│   ├── errors/             # 错误处理
│   └── index.ts           # 新入口
├── tests-v2/              # 新测试代码
├── docs/                   # 文档
└── package.json           # 共享依赖
```

### 2.2 开发流程

**每个阶段的流程**：
1. **设计**：详细设计该阶段的模块和接口
2. **实现**：编写代码，边写边测试
3. **测试**：编写单元测试和集成测试
4. **文档**：更新相关文档
5. **提交**：Git commit，打 tag

**代码提交规范**：
```
feat: 添加新功能
fix: 修复bug
refactor: 重构代码
docs: 更新文档
test: 添加测试
chore: 构建/工具变更
```

### 2.3 测试策略

**测试金字塔**：
- **单元测试**：每个模块独立测试，覆盖率 80%+
- **集成测试**：模块间协作测试，覆盖核心流程
- **E2E 测试**：完整场景测试，确保工具 API 兼容

**测试工具**：
- 单元测试：Vitest 或 Jest
- 集成测试：自定义测试框架（参考现有 tests/）
- 覆盖率：c8 或 Istanbul

### 2.4 文档策略

**同步更新**：
- 代码变更时同步更新 API 文档
- 每个阶段完成后更新开发日志
- 重要设计决策记录在 docs/decisions/ 目录

**文档类型**：
- 架构文档：architecture.md（已完成）
- 开发计划：development-plan.md（本文档）
- API 文档：docs/api/（每个工具详细说明）
- 开发者指南：docs/developers/（插件开发等）

---

## 三、阶段规划

### 阶段 0：准备和设计（第 1-2 周）

**目标**：建立测试基准，完善设计，准备开发环境

**主要工作**：
1. 为旧代码编写完整集成测试（作为功能基准）
2. 建立性能基准（响应时间、资源使用）
3. 详细设计核心框架接口
4. 技术选型（DI 框架、日志库等）
5. 准备开发环境

**验收标准**：
- [ ] 所有现有工具有集成测试
- [ ] 性能基准数据记录
- [ ] 核心接口设计文档完成
- [ ] 技术选型确定
- [ ] 开发环境就绪

### 阶段 1：核心框架开发（第 3-6 周）

**目标**：实现六层架构的核心框架

**主要工作**：
1. 依赖注入框架
2. 传输层（stdio、HTTP、WebSocket）
3. 能力层（ToolRegistry、ResourceRegistry、PromptRegistry）
4. 中间件框架
5. 日志系统
6. 错误处理系统
7. 配置管理系统

**验收标准**：
- [ ] DI 容器可用
- [ ] 3 种传输方式可用
- [ ] 能力注册表可用
- [ ] 中间件框架可用
- [ ] 日志系统可用
- [ ] 错误处理可用
- [ ] 配置管理可用
- [ ] 单元测试覆盖率 80%+

### 阶段 2：业务功能实现（第 7-10 周）

**目标**：实现所有业务功能，迁移所有工具

**主要工作**：
1. 数据访问层（GitLabRepository、CacheRepository）
2. 业务服务层（MergeRequestService、CodeReviewService 等）
3. 3 个内置插件（gitlab-mr、gitlab-file、gitlab-code-review）
4. Resources 能力实现
5. Prompts 能力实现
6. 所有工具迁移到新架构

**验收标准**：
- [ ] 所有 15 个工具可用
- [ ] 5+ 个 Resources 可用
- [ ] 4+ 个 Prompts 可用
- [ ] 工具 API 与旧版本完全兼容
- [ ] 集成测试全部通过

### 阶段 3：测试和上线（第 11-12 周）

**目标**：完整测试，性能优化，安全加固，上线准备

**主要工作**：
1. 完整回归测试
2. 性能测试和优化
3. 安全扫描和加固
4. 文档完善
5. 发布准备

**验收标准**：
- [ ] 所有测试通过
- [ ] 性能达到目标（P95 < 1.5s）
- [ ] 无高危安全漏洞
- [ ] 文档完整
- [ ] 可以发布

---

## 四、详细任务清单

### 阶段 0：准备和设计（第 1-2 周）

#### Week 1: 测试基准和设计

**Day 1-2: 集成测试编写**
- [ ] 为 `get_merge_request` 编写集成测试
- [ ] 为 `get_merge_request_changes` 编写集成测试
- [ ] 为 `list_merge_requests` 编写集成测试
- [ ] 为 `update_merge_request_description` 编写集成测试
- [ ] 为 `get_file_content` 编写集成测试
- [ ] 为 `analyze_mr_changes` 编写集成测试
- [ ] 为 `push_code_review_comments` 编写集成测试
- [ ] 为其他工具编写集成测试
- [ ] 所有测试通过，建立测试基准

**Day 3-4: 性能基准**
- [ ] 测试每个工具的响应时间（P50、P95、P99）
- [ ] 测试内存使用情况
- [ ] 测试并发能力
- [ ] 记录基准数据到 `docs/benchmarks/baseline.md`

**Day 5: 技术选型**
- [ ] 评估 DI 框架（InversifyJS vs TSyringe vs 自研）
- [ ] 评估日志库（winston vs pino）
- [ ] 评估缓存方案（node-cache vs ioredis）
- [ ] 评估 HTTP 框架（express vs fastify）
- [ ] 确定技术选型，记录到 `docs/decisions/tech-stack.md`

#### Week 2: 详细设计和环境准备

**Day 1-2: 核心接口设计**
- [ ] 设计 DI 容器接口
- [ ] 设计 Transport 接口
- [ ] 设计 ToolRegistry 接口
- [ ] 设计 ResourceRegistry 接口
- [ ] 设计 PromptRegistry 接口
- [ ] 设计 Middleware 接口
- [ ] 设计 Logger 接口
- [ ] 设计 Error 类型体系
- [ ] 记录到 `docs/design/interfaces.md`

**Day 3: 目录结构设计**
- [ ] 设计 `src-v2/` 目录结构
- [ ] 创建目录结构（空文件）
- [ ] 更新 `development-plan.md` 中的目录结构

**Day 4: 开发环境准备**
- [ ] 安装开发依赖（测试框架、linter、formatter）
- [ ] 配置 TypeScript（tsconfig.json）
- [ ] 配置 ESLint 和 Prettier
- [ ] 配置 Git hooks（pre-commit）
- [ ] 创建 `.env.example` 文件

**Day 5: 文档和计划**
- [ ] 创建 `docs/api/` 目录结构
- [ ] 创建 `docs/developers/` 目录结构
- [ ] 创建 `CHANGELOG.md`
- [ ] 更新 `README.md`（添加重构说明）
- [ ] 提交阶段 0 代码，打 tag `v2.0.0-alpha.0`

### 阶段 1：核心框架开发（第 3-6 周）

#### Week 3: 依赖注入和基础设施

**Day 1-2: DI 容器实现**
- [ ] 实现 `core/di/Container.ts`
- [ ] 实现装饰器 `@Injectable`
- [ ] 实现服务注册和解析
- [ ] 实现生命周期管理（singleton、transient）
- [ ] 编写单元测试
- [ ] 测试覆盖率 90%+

**Day 3: 日志系统实现**
- [ ] 实现 `logging/Logger.ts` 接口
- [ ] 实现 `logging/ConsoleLogger.ts`
- [ ] 实现 `logging/FileLogger.ts`
- [ ] 实现 `logging/StructuredLogger.ts`
- [ ] 实现日志上下文（traceId）
- [ ] 编写单元测试

**Day 4: 错误处理系统**
- [ ] 实现 `errors/BaseError.ts`
- [ ] 实现 `errors/BusinessError.ts`
- [ ] 实现 `errors/SystemError.ts`
- [ ] 实现 `errors/GitLabApiError.ts`
- [ ] 定义错误码 `errors/ErrorCode.ts`
- [ ] 实现 `errors/ErrorHandler.ts`
- [ ] 编写单元测试

**Day 5: 配置管理系统**
- [ ] 实现 `config/ConfigProvider.ts` 接口
- [ ] 实现 `config/EnvConfigProvider.ts`
- [ ] 实现 `config/FileConfigProvider.ts`
- [ ] 实现 `config/ConfigManager.ts`（重构版）
- [ ] 实现配置合并和验证
- [ ] 编写单元测试

#### Week 4: 传输层和协议层

**Day 1-2: Transport 接口和 StdioTransport**
- [ ] 实现 `transport/Transport.ts` 接口
- [ ] 实现 `transport/StdioTransport.ts`
- [ ] 实现 `transport/TransportManager.ts`
- [ ] 编写单元测试
- [ ] 编写集成测试（与 MCP SDK 集成）

**Day 3: HttpTransport**
- [ ] 实现 `transport/HttpTransport.ts`
- [ ] 实现 HTTP POST 接收请求
- [ ] 实现 SSE 推送响应
- [ ] 实现 CORS 支持
- [ ] 编写单元测试
- [ ] 编写集成测试

**Day 4: WebSocketTransport**
- [ ] 实现 `transport/WebSocketTransport.ts`
- [ ] 实现双向通信
- [ ] 实现心跳检测
- [ ] 实现断线重连
- [ ] 编写单元测试
- [ ] 编写集成测试

**Day 5: 协议层**
- [ ] 实现 `core/protocol/MessageValidator.ts`
- [ ] 实现 `core/protocol/ProtocolErrorHandler.ts`
- [ ] 集成 MCP SDK
- [ ] 编写单元测试

#### Week 5: 能力层

**Day 1-2: ToolRegistry**
- [ ] 实现 `capabilities/tools/Tool.ts` 接口
- [ ] 实现 `capabilities/tools/ToolRegistry.ts`
- [ ] 实现工具注册、注销、查询
- [ ] 实现工具执行器 `ToolExecutor.ts`
- [ ] 编写单元测试

**Day 3: ResourceRegistry**
- [ ] 实现 `capabilities/resources/Resource.ts` 接口
- [ ] 实现 `capabilities/resources/ResourceRegistry.ts`
- [ ] 实现 URI 解析和路由
- [ ] 实现资源提供者 `ResourceProvider.ts`
- [ ] 编写单元测试

**Day 4: PromptRegistry**
- [ ] 实现 `capabilities/prompts/Prompt.ts` 接口
- [ ] 实现 `capabilities/prompts/PromptRegistry.ts`
- [ ] 实现模板渲染器 `PromptRenderer.ts`
- [ ] 实现变量插值和条件渲染
- [ ] 编写单元测试

**Day 5: CapabilityManager**
- [ ] 实现 `capabilities/CapabilityManager.ts`
- [ ] 统一管理三种能力
- [ ] 集成到 MCP Server
- [ ] 编写集成测试

#### Week 6: 中间件框架

**Day 1: 中间件基础框架**
- [ ] 实现 `middleware/Middleware.ts` 接口
- [ ] 实现 `middleware/MiddlewareChain.ts`
- [ ] 实现 `middleware/MiddlewareContext.ts`
- [ ] 实现责任链模式
- [ ] 编写单元测试

**Day 2: 基础中间件**
- [ ] 实现 `middleware/LoggingMiddleware.ts`
- [ ] 实现 `middleware/ErrorHandlingMiddleware.ts`
- [ ] 集成到工具执行流程
- [ ] 编写单元测试

**Day 3: 认证和授权中间件**
- [ ] 实现 `middleware/AuthenticationMiddleware.ts`
- [ ] 实现 `middleware/AuthorizationMiddleware.ts`
- [ ] 支持 API Key、Bearer Token
- [ ] 编写单元测试

**Day 4: 限流和缓存中间件**
- [ ] 实现 `middleware/RateLimitMiddleware.ts`
- [ ] 实现 `middleware/CacheMiddleware.ts`
- [ ] 实现令牌桶算法
- [ ] 编写单元测试

**Day 5: 性能监控中间件**
- [ ] 实现 `middleware/PerformanceMiddleware.ts`
- [ ] 实现指标收集
- [ ] 集成到中间件链
- [ ] 编写单元测试
- [ ] 提交阶段 1 代码，打 tag `v2.0.0-alpha.1`

### 阶段 2：业务功能实现（第 7-10 周）

#### Week 7: 数据访问层

**Day 1-2: GitLabRepository**
- [ ] 实现 `repositories/GitLabRepository.ts`
- [ ] 实现基础 API 方法（getProject、getMergeRequest 等）
- [ ] 实现统一的重试机制
- [ ] 实现错误转换
- [ ] 编写单元测试（mock GitLab API）

**Day 3: CacheRepository**
- [ ] 实现 `repositories/CacheRepository.ts` 接口
- [ ] 实现 `repositories/MemoryCache.ts`
- [ ] 实现 TTL 和 LRU 策略
- [ ] 编写单元测试

**Day 4: ConfigRepository**
- [ ] 实现 `repositories/ConfigRepository.ts`
- [ ] 实现配置加载和合并
- [ ] 编写单元测试

**Day 5: 集成测试**
- [ ] 编写数据访问层集成测试
- [ ] 测试与真实 GitLab API 的交互
- [ ] 测试错误处理和重试

#### Week 8: 业务服务层

**Day 1-2: MergeRequestService**
- [ ] 实现 `services/MergeRequestService.ts`
- [ ] 实现获取 MR 详情（带缓存）
- [ ] 实现获取 MR 变更
- [ ] 实现更新 MR 描述
- [ ] 实现列表查询
- [ ] 编写单元测试

**Day 3: FileOperationService**
- [ ] 实现 `services/FileOperationService.ts`
- [ ] 实现获取文件内容
- [ ] 实现文件搜索（可选）
- [ ] 编写单元测试

**Day 4: CodeReviewService**
- [ ] 实现 `services/CodeReviewService.ts`
- [ ] 实现 `services/CodeReviewRuleEngine.ts`
- [ ] 实现规则加载和匹配
- [ ] 实现变更分析
- [ ] 实现评论生成
- [ ] 编写单元测试

**Day 5: 其他服务**
- [ ] 实现 `services/ProjectService.ts`
- [ ] 实现 `services/UserService.ts`（可选）
- [ ] 编写单元测试
- [ ] 服务层集成测试

#### Week 9: 插件系统实现

**Day 1: 插件框架**
- [ ] 实现 `core/plugin/Plugin.ts` 接口
- [ ] 实现 `core/plugin/PluginRegistry.ts`
- [ ] 实现 `core/plugin/PluginLoader.ts`
- [ ] 实现插件生命周期管理
- [ ] 编写单元测试

**Day 2-3: gitlab-mr 插件**
- [ ] 创建 `plugins/gitlab-mr/` 目录
- [ ] 实现插件元数据
- [ ] 迁移 MR 相关工具（10 个）
- [ ] 实现 MR 资源
- [ ] 实现 mr-description 提示
- [ ] 编写单元测试

**Day 4: gitlab-file 插件**
- [ ] 创建 `plugins/gitlab-file/` 目录
- [ ] 实现插件元数据
- [ ] 迁移文件操作工具
- [ ] 实现文件资源
- [ ] 编写单元测试

**Day 5: gitlab-code-review 插件**
- [ ] 创建 `plugins/gitlab-code-review/` 目录
- [ ] 实现插件元数据
- [ ] 迁移代码审查工具（4 个）
- [ ] 实现审查规则资源
- [ ] 实现代码审查提示（TypeScript、Vue）
- [ ] 编写单元测试

#### Week 10: Resources 和 Prompts 实现

**Day 1-2: Resources 实现**
- [ ] 实现 `gitlab://projects/{id}` 资源
- [ ] 实现 `gitlab://projects/{id}/tree` 资源
- [ ] 实现 `gitlab://projects/{id}/mrs/{iid}` 资源
- [ ] 实现 `gitlab://projects/{id}/mrs/{iid}/changes` 资源
- [ ] 实现 `gitlab://projects/{id}/files/{path}` 资源
- [ ] 实现 `gitlab://code-review-rules` 资源
- [ ] 编写单元测试和集成测试

**Day 3: Prompts 实现**
- [ ] 实现 `code-review-typescript` 提示
- [ ] 实现 `code-review-vue` 提示
- [ ] 实现 `mr-description` 提示
- [ ] 实现 `commit-message` 提示
- [ ] 测试模板渲染
- [ ] 编写单元测试

**Day 4-5: 完整集成测试**
- [ ] 测试所有工具（15 个）
- [ ] 测试所有资源（5+ 个）
- [ ] 测试所有提示（4+ 个）
- [ ] 对比测试（新旧版本输出一致性）
- [ ] 修复发现的问题
- [ ] 提交阶段 2 代码，打 tag `v2.0.0-beta.0`

### 阶段 3：测试和上线（第 11-12 周）

#### Week 11: 完整测试和性能优化

**Day 1-2: 回归测试**
- [ ] 运行所有单元测试
- [ ] 运行所有集成测试
- [ ] 运行 E2E 测试
- [ ] 修复所有发现的 bug
- [ ] 测试覆盖率报告（目标 80%+）

**Day 3: 性能测试**
- [ ] 测试每个工具的响应时间
- [ ] 对比性能基准（确保不低于旧版本）
- [ ] 压力测试（100+ 并发）
- [ ] 内存泄漏测试
- [ ] 性能优化（如有必要）

**Day 4: 缓存优化**
- [ ] 为常用工具添加缓存
- [ ] 测试缓存命中率
- [ ] 优化缓存策略
- [ ] 性能测试

**Day 5: 流式处理优化**
- [ ] 实现流式响应（大文件）
- [ ] 测试流式处理性能
- [ ] 优化内存使用
- [ ] 性能测试

#### Week 12: 安全加固和发布准备

**Day 1: 安全扫描**
- [ ] 运行 `npm audit` 检查依赖漏洞
- [ ] 运行 Snyk 扫描（如可用）
- [ ] 修复高危和中危漏洞
- [ ] 代码安全审查

**Day 2: 安全加固**
- [ ] 实现敏感信息脱敏（日志）
- [ ] 实现配置加密（可选）
- [ ] 完善认证和授权
- [ ] 审计日志完善

**Day 3: 文档完善**
- [ ] 更新 API 文档（所有工具、资源、提示）
- [ ] 编写迁移指南（从 v1.x 到 v2.0）
- [ ] 编写开发者指南（插件开发）
- [ ] 更新 README.md
- [ ] 更新 CHANGELOG.md

**Day 4: 发布准备**
- [ ] 代码审查（自检）
- [ ] 构建生产版本
- [ ] 测试生产构建
- [ ] 准备发布说明
- [ ] 打 tag `v2.0.0-rc.0`

**Day 5: 最终验证和发布**
- [ ] 在测试环境完整验证
- [ ] 性能最终验证
- [ ] 安全最终验证
- [ ] 文档最终检查
- [ ] 打 tag `v2.0.0`
- [ ] 发布到 npm（如需要）
- [ ] 更新 GitHub release

---

## 五、里程碑和检查点

### 5.1 关键里程碑

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|----------|
| **M0: 准备完成** | 第 2 周末 | 测试基准、设计文档 | 所有工具有测试，设计完成 |
| **M1: 核心框架完成** | 第 6 周末 | DI、传输层、能力层、中间件 | 框架可用，单元测试 80%+ |
| **M2: 功能完成** | 第 10 周末 | 所有工具、资源、提示 | 功能完整，API 兼容 |
| **M3: 发布就绪** | 第 12 周末 | 测试报告、文档、发布包 | 所有测试通过，可发布 |

### 5.2 每周检查点

**每周五进行进度检查**：

1. **完成情况**：
   - 本周计划任务完成率
   - 未完成任务的原因
   - 下周计划调整

2. **代码质量**：
   - 单元测试覆盖率
   - 代码审查（自检）
   - 技术债务

3. **文档更新**：
   - API 文档是否同步
   - 开发日志是否更新
   - 设计决策是否记录

4. **问题跟踪**：
   - 发现的问题和风险
   - 解决方案
   - 需要帮助的地方

### 5.3 阶段验收

**每个阶段结束时的验收流程**：

1. **自测**：
   - 运行所有测试
   - 检查验收标准清单
   - 代码审查（自检）

2. **文档检查**：
   - 相关文档是否更新
   - API 文档是否完整
   - 设计决策是否记录

3. **提交和标记**：
   - Git commit 所有代码
   - 打 tag（alpha/beta/rc）
   - 更新开发日志

4. **休息和准备**：
   - 休息 1-2 天
   - 回顾和总结
   - 准备下一阶段

---

## 六、风险控制

### 6.1 技术风险

#### 6.1.1 架构复杂度过高

**风险**：六层架构可能过于复杂，影响开发效率

**应对**：
- 先实现核心功能，再逐步完善
- 每个模块独立开发，降低耦合
- 充分的文档和注释
- 如果发现过于复杂，及时简化

**检查点**：每周检查代码复杂度，如果圈复杂度 > 15，考虑重构

#### 6.1.2 性能不达标

**风险**：新架构可能比旧版本慢

**应对**：
- 建立性能基准（阶段 0）
- 每个阶段都进行性能测试
- 性能优化阶段专门处理
- 如果性能不达标，优先优化关键路径

**检查点**：阶段 2 结束时进行性能对比，确保不低于基准

#### 6.1.3 API 不兼容

**风险**：工具 API 与旧版本不一致，导致客户端无法使用

**应对**：
- 严格保持工具名称、参数、返回值一致
- 编写对比测试确保一致性
- 每个工具迁移后立即测试
- 使用类型系统确保兼容性

**检查点**：阶段 2 结束时，所有工具通过对比测试

### 6.2 进度风险

#### 6.2.1 开发延期

**风险**：12 周可能不够，项目延期

**应对**：
- 每个阶段预留 20% 缓冲时间
- 优先实现核心功能，次要功能可延后
- 如果延期，调整后续计划
- 个人项目可以灵活调整时间

**检查点**：每周检查进度，如果连续 2 周延期，调整计划

#### 6.2.2 功能范围蔓延

**风险**：开发过程中添加新功能，导致范围扩大

**应对**：
- 严格遵循架构设计
- 新功能记录到 backlog，后续迭代
- 核心功能优先，nice-to-have 延后
- 如果必须添加，评估影响后决定

**检查点**：每个阶段开始时，明确该阶段的功能范围

### 6.3 质量风险

#### 6.3.1 测试不充分

**风险**：测试覆盖率不足，上线后出现问题

**应对**：
- 每个模块开发时同步编写测试
- 单元测试覆盖率目标 80%+
- 集成测试覆盖核心流程
- E2E 测试确保 API 兼容

**检查点**：每个阶段结束时，检查测试覆盖率

#### 6.3.2 文档不完善

**风险**：文档缺失或不准确，影响后续维护

**应对**：
- 代码变更时同步更新文档
- 每个阶段完成后更新文档
- API 文档必须完整
- 重要设计决策必须记录

**检查点**：阶段验收时，检查文档完整性

### 6.4 个人项目特殊考虑

#### 6.4.1 时间管理

**挑战**：个人项目，时间可能不连续

**应对**：
- 每个阶段独立，可暂停和恢复
- 每个任务尽量在 1-2 天内完成
- 使用 Git 分支管理，随时可以切换
- 记录开发日志，便于恢复上下文

#### 6.4.2 技术债务

**挑战**：个人开发，可能为了速度牺牲质量

**应对**：
- 每周留出时间处理技术债务
- 代码审查（自检）时识别技术债务
- 重要模块必须写测试
- 非关键功能可以延后优化

#### 6.4.3 知识盲区

**挑战**：某些技术不熟悉，需要学习时间

**应对**：
- 技术选型时选择成熟方案
- 遇到问题及时查阅文档
- 复杂模块可以先做原型验证
- 如果某个技术太难，考虑替代方案

---

## 七、开发环境准备

### 7.1 开发工具

**必需工具**：
- Node.js >= 18.0.0
- pnpm（推荐）或 npm
- Git
- VS Code（推荐）或任意 IDE
- TypeScript 5.3+

**推荐插件**（VS Code）：
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- GitLens
- Test Explorer（测试工具）

### 7.2 项目配置

**目录结构**：
```
gitlab-mcp/
├── src/              # 旧代码（保持不动）
├── src-v2/           # 新代码（完全重构）
├── tests-v2/         # 新测试
├── docs/             # 文档
│   ├── api/          # API 文档
│   ├── developers/   # 开发者指南
│   ├── decisions/    # 设计决策
│   └── benchmarks/   # 性能基准
├── .env.example      # 环境变量示例
├── tsconfig.json     # TypeScript 配置
├── package.json      # 依赖管理
└── README.md         # 项目说明
```

**Git 分支策略**：
```
main              # 主分支（稳定版本）
├── v1.x          # 旧版本维护分支
└── v2.0-dev       # 重构开发分支
    ├── stage-0   # 阶段 0 分支
    ├── stage-1   # 阶段 1 分支
    ├── stage-2    # 阶段 2 分支
    └── stage-3    # 阶段 3 分支
```

**提交规范**：
```
feat: 添加新功能
fix: 修复bug
refactor: 重构代码
docs: 更新文档
test: 添加测试
chore: 构建/工具变更
perf: 性能优化
style: 代码格式（不影响功能）
```

### 7.3 开发依赖

**测试框架**：
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",        // 或 jest
    "@vitest/ui": "^1.0.0",
    "c8": "^8.0.0"            // 覆盖率工具
  }
}
```

**代码质量**：
```json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",        // Git hooks
    "lint-staged": "^13.0.0"  // 提交前检查
  }
}
```

**开发工具**：
```json
{
  "devDependencies": {
    "tsx": "^4.0.0",         // TypeScript 执行
    "nodemon": "^3.0.0",     // 自动重启
    "concurrently": "^8.0.0" // 并行执行命令
  }
}
```

### 7.4 环境变量

**`.env.example`**：
```bash
# GitLab 配置
GITLAB_HOST=https://gitlab.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxxx

# 服务器配置
SERVER_PORT=3000
SERVER_HOST=0.0.0.0
LOG_LEVEL=info
LOG_OUTPUT=console

# 中间件配置
AUTH_ENABLED=false
AUTH_MODE=api-key
API_KEY=your-api-key

RATE_LIMIT_ENABLED=true
RATE_LIMIT_GLOBAL_REQUESTS=100
RATE_LIMIT_GLOBAL_WINDOW=1s

CACHE_ENABLED=true
CACHE_TYPE=memory
CACHE_TTL=300

# 插件配置
PLUGINS_ENABLED=gitlab-mr,gitlab-file,gitlab-code-review
```

### 7.5 开发脚本

**`package.json` scripts**：
```json
{
  "scripts": {
    "dev": "tsx watch src-v2/index.ts",
    "build": "tsc -p tsconfig.json",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "tsx tests-v2/e2e/index.ts",
    "lint": "eslint src-v2/**/*.ts",
    "lint:fix": "eslint src-v2/**/*.ts --fix",
    "format": "prettier --write src-v2/**/*.ts",
    "type-check": "tsc --noEmit"
  }
}
```

### 7.6 Git Hooks

**`.husky/pre-commit`**：
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 类型检查
npm run type-check

# Lint
npm run lint

# 测试（快速）
npm run test -- --run
```

**`.husky/commit-msg`**：
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 检查提交信息格式
npx commitlint --edit "$1"
```

---

## 八、开发日志模板

### 8.1 每周开发日志

**模板**：
```markdown
# 开发日志 - Week X (YYYY-MM-DD ~ YYYY-MM-DD)

## 本周完成

### 已完成任务
- [x] 任务 1
- [x] 任务 2

### 代码提交
- commit hash: 描述
- commit hash: 描述

### 测试情况
- 单元测试：X 个，通过率 Y%
- 集成测试：X 个，通过率 Y%
- 覆盖率：Z%

## 遇到的问题

### 技术问题
1. 问题描述
   - 原因分析
   - 解决方案
   - 经验总结

### 进度问题
- 延期任务及原因
- 调整计划

## 下周计划

### 计划任务
- [ ] 任务 1
- [ ] 任务 2

### 预期目标
- 完成 X 模块
- 测试覆盖率达到 Y%

## 技术债务
- 待优化项 1
- 待优化项 2
```

### 8.2 阶段总结

**模板**：
```markdown
# 阶段 X 总结

## 阶段概述
- 时间：YYYY-MM-DD ~ YYYY-MM-DD
- 目标：XXX
- 状态：✅ 完成 / ⚠️ 部分完成 / ❌ 未完成

## 完成情况
- 计划任务：X 个
- 完成任务：Y 个
- 完成率：Z%

## 交付物
- [x] 交付物 1
- [x] 交付物 2

## 技术亮点
- 亮点 1
- 亮点 2

## 经验教训
- 教训 1
- 教训 2

## 下一阶段准备
- 准备项 1
- 准备项 2
```

---

## 九、快速参考

### 9.1 常用命令

```bash
# 开发
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建
pnpm test                   # 运行测试
pnpm test:coverage          # 测试覆盖率
pnpm lint                   # 代码检查
pnpm format                 # 代码格式化

# Git
git checkout -b stage-X     # 创建阶段分支
git tag v2.0.0-alpha.X     # 打 tag
git push origin --tags      # 推送 tag

# 发布
npm version patch           # 更新版本号
npm publish                 # 发布到 npm（如需要）
```

### 9.2 关键文件

- `architecture.md` - 架构设计文档
- `development-plan.md` - 本文档（开发计划）
- `docs/api/` - API 文档
- `docs/decisions/` - 设计决策记录
- `CHANGELOG.md` - 变更日志

### 9.3 重要检查清单

**每个阶段开始前**：
- [ ] 阅读架构文档相关章节
- [ ] 理解该阶段的目标和任务
- [ ] 准备开发环境
- [ ] 创建阶段分支

**每个任务完成后**：
- [ ] 编写/更新测试
- [ ] 更新相关文档
- [ ] 代码自检（lint、format）
- [ ] Git commit

**每个阶段结束时**：
- [ ] 运行所有测试
- [ ] 检查验收标准
- [ ] 更新文档
- [ ] 提交代码并打 tag
- [ ] 写阶段总结

---

## 十、附录

### 10.1 参考资源

**MCP 协议**：
- [Model Context Protocol 官方文档](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

**技术栈**：
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Zod 验证库](https://zod.dev/)
- [GitLab API 文档](https://docs.gitlab.com/ee/api/)

**最佳实践**：
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Plugin Architecture](https://martinfowler.com/articles/pluginArchitecture.html)

### 10.2 联系方式

**项目信息**：
- GitHub: [项目地址]
- 作者: [你的名字]
- 邮箱: [你的邮箱]

**问题反馈**：
- GitHub Issues
- 开发日志中记录

---

**文档版本**: 1.0  
**最后更新**: 2025-12-30  
**下次审查**: 每个阶段结束时