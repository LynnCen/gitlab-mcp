# 性能测试文档

## 概述

性能测试用于验证系统在各种负载下的表现，包括响应时间、并发能力和资源使用情况。

## 测试类型

### 1. 工具响应时间测试

测试每个工具的响应时间，包括：
- **P50（中位数）**：50% 的请求在此时间内完成
- **P95**：95% 的请求在此时间内完成
- **P99**：99% 的请求在此时间内完成
- **平均值**：所有请求的平均响应时间
- **最小值/最大值**：最快和最慢的请求时间

### 2. 压力测试

测试系统在高并发情况下的表现：
- **并发数**：默认 100 个并发请求
- **成功率**：验证系统在压力下的稳定性
- **平均响应时间**：并发情况下的响应时间

### 3. 内存泄漏测试

验证系统不会出现内存泄漏：
- 执行大量操作后检查内存使用情况
- 验证内存增长在合理范围内

### 4. 缓存性能测试

测试缓存对性能的提升：
- **缓存命中率**：验证缓存是否正常工作
- **性能提升**：对比使用缓存前后的响应时间
- **TTL 策略**：验证缓存过期机制

## 运行性能测试

### 运行所有性能测试

```bash
pnpm test:v2 -- tests-v2/performance
```

### 运行特定测试

```bash
# 工具性能测试
pnpm test:v2 -- tests-v2/performance/tool-performance.test.ts

# 缓存性能测试
pnpm test:v2 -- tests-v2/performance/cache-performance.test.ts
```

### 启用内存泄漏测试

内存泄漏测试需要启用 Node.js 的垃圾回收器：

```bash
node --expose-gc node_modules/.bin/vitest -- tests-v2/performance/tool-performance.test.ts
```

## 性能基准

### 目标指标

- **响应时间**：
  - P50: < 500ms
  - P95: < 2000ms
  - P99: < 5000ms

- **并发能力**：
  - 100 并发成功率: > 80%
  - 平均响应时间: < 3000ms

- **缓存性能**：
  - 缓存命中后速度提升: > 2x
  - 缓存命中率: > 90%

- **内存使用**：
  - 100 次操作后内存增长: < 50MB

## 环境变量

性能测试需要以下环境变量：

```bash
export GITLAB_HOST=https://gitlab.com
export GITLAB_TOKEN=your-token
export TEST_PROJECT_PATH=owner/repo
export TEST_MR_IID=123
export TEST_FILE_PATH=README.md
```

## 注意事项

1. **网络依赖**：性能测试需要实际的 GitLab API 访问，确保网络连接稳定
2. **API 限制**：注意 GitLab API 的速率限制，避免测试过于频繁
3. **测试数据**：使用测试项目，避免影响生产数据
4. **资源消耗**：性能测试会消耗较多资源，建议在专用测试环境运行

