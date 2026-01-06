# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-06

### 🎉 重大更新：完全重构

v2.0.0 是一次完全重构，采用全新的六层架构设计，提供更好的可扩展性、性能和安全性。

### Added

#### 架构
- ✨ 六层架构实现（传输层、协议层、能力层、中间件层、业务层、数据访问层）
- ✨ 插件化系统：模块化的插件架构，支持动态加载
- ✨ 完整的 MCP 能力：Tools、Resources、Prompts 三种核心能力
- ✨ 多传输方式支持：stdio、HTTP+SSE、WebSocket

#### 工具 (Tools)
- ✨ 8 个工具：MR 管理（4个）、文件操作（1个）、代码审查（3个）
- ✨ 统一的工具接口和 Schema 验证
- ✨ 工具元数据支持（category、tags、examples）

#### 资源 (Resources)
- ✨ 5 个资源：项目、MR、MR变更、文件、代码审查规则
- ✨ URI 标准化访问：`gitlab://projects/{id}/...`
- ✨ 流式资源支持：大文件流式传输

#### 提示 (Prompts)
- ✨ 3 个提示模板：MR描述生成、TypeScript审查、Vue审查
- ✨ 参数化模板和条件渲染

#### 基础设施
- ✨ 依赖注入（TSyringe）
- ✨ 统一日志系统（Pino）
- ✨ 统一错误处理
- ✨ 配置管理（环境变量）
- ✨ 缓存系统（node-cache）

#### 中间件
- ✨ 日志中间件
- ✨ 错误处理中间件
- ✨ 认证中间件
- ✨ 限流中间件
- ✨ 缓存中间件
- ✨ 性能监控中间件
- ✨ 安全中间件（日志脱敏、错误脱敏）

#### 安全
- ✨ 路径验证工具（防止路径遍历攻击）
- ✨ 日志脱敏（Token、密码等敏感信息）
- ✨ 错误信息脱敏
- ✨ 安全审计文档

#### 性能
- ✨ 缓存优化（MR、文件、项目信息）
- ✨ 流式处理（大文件分块传输）
- ✨ 性能测试框架

#### 测试
- ✨ 单元测试（27+ 个测试文件）
- ✨ 集成测试
- ✨ E2E 测试
- ✨ 性能测试（响应时间、压力测试、内存泄漏）

#### 文档
- ✨ API 参考文档
- ✨ 迁移指南（v1.x 到 v2.0）
- ✨ 安全审计文档
- ✨ 性能测试文档

### Changed

- 🔄 完全重构：不兼容 v1.x API
- 🔄 配置方式：从配置文件改为环境变量
- 🔄 目录结构：新的 `src-v2/` 目录结构
- 🔄 工具调用方式：新的工具注册和执行机制

### Breaking Changes

- ❌ **不兼容 v1.x**：需要完全迁移
- ❌ API 变更：所有工具调用方式变更
- ❌ 配置变更：配置文件格式变更

### Migration

请参考 [迁移指南](./docs/migration-guide.md) 了解如何从 v1.x 迁移到 v2.0。

---

## [Unreleased]

---

## [1.1.0] - 2024-XX-XX

### Added
- AI 驱动的代码审查功能
- 行内评论支持
- 变更分析功能
- 审查规则引擎

### Changed
- 优化了行内评论的 SHA 获取策略
- 改进了错误处理

---

## [1.0.0] - 2024-XX-XX

### Added
- 基础 MCP 服务器实现
- 合并请求管理工具
- 文件操作工具
- stdio 传输支持

