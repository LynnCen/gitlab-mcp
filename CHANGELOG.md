# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 计划中 (v2.0.0)

#### 架构重构
- [ ] 六层架构实现（传输层、协议层、能力层、中间件层、业务层、数据访问层）
- [ ] 插件化系统
- [ ] 完整的 MCP 能力（Tools、Resources、Prompts）
- [ ] 多传输方式支持（stdio、HTTP+SSE、WebSocket）
- [ ] 统一的日志、错误处理、配置管理
- [ ] 性能优化（缓存、并发、流式处理）
- [ ] 安全增强（认证、授权、审计）

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

