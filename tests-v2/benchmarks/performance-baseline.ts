/**
 * 性能基准测试脚本
 * 
 * 用于收集重构前的性能基准数据，包括：
 * - 工具响应时间（P50、P95、P99）
 * - 内存使用情况
 * - 并发能力
 */

import { GitLabMcpServer } from '../../src/server/mcp-server/index.js';
import { GitLabConfig } from '../../src/config/types.js';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

config();

interface PerformanceMetrics {
  toolName: string;
  iterations: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  average: number;
  errors: number;
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface BenchmarkResult {
  timestamp: string;
  version: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
  };
  tools: PerformanceMetrics[];
  memory: {
    startup: MemoryMetrics;
    idle: MemoryMetrics;
    peak: MemoryMetrics;
  };
  concurrency: {
    level: number;
    successRate: number;
    averageResponseTime: number;
  }[];
}

// 测试配置
const TEST_CONFIG: GitLabConfig = {
  host: process.env.GITLAB_HOST || 'https://gitlab.com',
  token: process.env.GITLAB_TOKEN || '',
  timeout: 30000,
  retries: 3,
};

const TEST_PROJECT_PATH = process.env.TEST_PROJECT_PATH || 'gdesign/meta';
const TEST_MR_IID = parseInt(process.env.TEST_MR_IID || '10821', 10);
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || 'README.md';

// 性能测试工具函数
function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

async function measureToolPerformance(
  server: any,
  toolName: string,
  params: any,
  iterations: number = 100
): Promise<PerformanceMetrics> {
  const times: number[] = [];
  let errors = 0;

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      await server.callTool(toolName, params);
      const duration = Date.now() - start;
      times.push(duration);
    } catch (error) {
      errors++;
      console.warn(`工具 ${toolName} 第 ${i + 1} 次调用失败:`, error);
    }
    
    // 避免触发速率限制
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (times.length === 0) {
    throw new Error(`工具 ${toolName} 所有调用都失败了`);
  }

  return {
    toolName,
    iterations: times.length,
    p50: calculatePercentile(times, 50),
    p95: calculatePercentile(times, 95),
    p99: calculatePercentile(times, 99),
    min: Math.min(...times),
    max: Math.max(...times),
    average: times.reduce((a, b) => a + b, 0) / times.length,
    errors,
  };
}

function getMemoryUsage(): MemoryMetrics {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
  };
}

async function testConcurrency(
  server: any,
  toolName: string,
  params: any,
  concurrency: number
): Promise<{ successRate: number; averageResponseTime: number }> {
  const promises: Promise<any>[] = [];
  const startTime = Date.now();

  for (let i = 0; i < concurrency; i++) {
    promises.push(
      server.callTool(toolName, params).catch(() => null)
    );
  }

  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;
  const successCount = results.filter(r => r !== null).length;
  const successRate = (successCount / concurrency) * 100;
  const averageResponseTime = duration / concurrency;

  return { successRate, averageResponseTime };
}

async function runBenchmark(): Promise<void> {
  console.log('🚀 开始性能基准测试...\n');

  // 初始化服务器
  const server = new GitLabMcpServer(TEST_CONFIG);
  await server.initialize();
  const mcpServer = server.getServer();

  const result: BenchmarkResult = {
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    tools: [],
    memory: {
      startup: getMemoryUsage(),
      idle: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
      peak: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
    },
    concurrency: [],
  };

  // 测试工具性能
  const tools = [
    {
      name: 'get_merge_request',
      params: { projectPath: TEST_PROJECT_PATH, mergeRequestIid: TEST_MR_IID },
      iterations: 50, // 减少迭代次数以加快测试
    },
    {
      name: 'get_merge_request_changes',
      params: { projectPath: TEST_PROJECT_PATH, mergeRequestIid: TEST_MR_IID, includeContent: false },
      iterations: 30,
    },
    {
      name: 'list_merge_requests',
      params: { projectPath: TEST_PROJECT_PATH, state: 'opened', perPage: 10 },
      iterations: 50,
    },
    {
      name: 'get_file_content',
      params: { projectPath: TEST_PROJECT_PATH, filePath: TEST_FILE_PATH, ref: 'main' },
      iterations: 50,
    },
    {
      name: 'get_file_code_review_rules',
      params: { filePath: 'src/index.ts', fileExtension: '.ts' },
      iterations: 100, // 本地工具，可以多测试几次
    },
  ];

  console.log('📊 测试工具性能...');
  for (const tool of tools) {
    console.log(`  测试 ${tool.name}...`);
    try {
      const metrics = await measureToolPerformance(
        mcpServer,
        tool.name,
        tool.params,
        tool.iterations
      );
      result.tools.push(metrics);
      console.log(`    ✅ P50: ${metrics.p50}ms, P95: ${metrics.p95}ms, P99: ${metrics.p99}ms`);
    } catch (error) {
      console.error(`    ❌ ${tool.name} 测试失败:`, error);
    }
  }

  // 测试内存使用
  console.log('\n💾 测试内存使用...');
  await new Promise(resolve => setTimeout(resolve, 2000)); // 等待 2 秒
  result.memory.idle = getMemoryUsage();

  // 执行一些操作后测试峰值
  for (let i = 0; i < 10; i++) {
    await mcpServer.callTool('get_merge_request', {
      projectPath: TEST_PROJECT_PATH,
      mergeRequestIid: TEST_MR_IID,
    });
  }
  result.memory.peak = getMemoryUsage();

  // 测试并发能力
  console.log('\n⚡ 测试并发能力...');
  const concurrencyLevels = [10, 20, 50];
  for (const level of concurrencyLevels) {
    console.log(`  测试 ${level} 并发...`);
    const metrics = await testConcurrency(
      mcpServer,
      'get_merge_request',
      { projectPath: TEST_PROJECT_PATH, mergeRequestIid: TEST_MR_IID },
      level
    );
    result.concurrency.push({
      level,
      ...metrics,
    });
    console.log(`    成功率: ${metrics.successRate.toFixed(2)}%, 平均响应: ${metrics.averageResponseTime.toFixed(2)}ms`);
  }

  // 保存结果
  const outputPath = resolve(process.cwd(), 'docs/benchmarks/baseline-data.json');
  writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n✅ 性能基准数据已保存到: ${outputPath}`);

  // 生成 Markdown 报告
  generateMarkdownReport(result);
}

function generateMarkdownReport(result: BenchmarkResult): void {
  let markdown = `# 性能基准数据\n\n`;
  markdown += `> **测试时间**: ${result.timestamp}  \n`;
  markdown += `> **版本**: ${result.version}  \n`;
  markdown += `> **环境**: Node.js ${result.environment.nodeVersion}, ${result.environment.platform} ${result.environment.arch}\n\n`;
  
  markdown += `## 工具响应时间\n\n`;
  markdown += `| 工具名称 | 测试次数 | P50 (ms) | P95 (ms) | P99 (ms) | 平均 (ms) | 错误数 |\n`;
  markdown += `|---------|---------|----------|----------|----------|-----------|--------|\n`;
  
  for (const tool of result.tools) {
    markdown += `| ${tool.toolName} | ${tool.iterations} | ${tool.p50} | ${tool.p95} | ${tool.p99} | ${tool.average.toFixed(2)} | ${tool.errors} |\n`;
  }

  markdown += `\n## 内存使用\n\n`;
  markdown += `| 状态 | 堆使用 (MB) | 堆总计 (MB) | RSS (MB) |\n`;
  markdown += `|------|------------|------------|----------|\n`;
  markdown += `| 启动时 | ${(result.memory.startup.heapUsed / 1024 / 1024).toFixed(2)} | ${(result.memory.startup.heapTotal / 1024 / 1024).toFixed(2)} | ${(result.memory.startup.rss / 1024 / 1024).toFixed(2)} |\n`;
  markdown += `| 空闲时 | ${(result.memory.idle.heapUsed / 1024 / 1024).toFixed(2)} | ${(result.memory.idle.heapTotal / 1024 / 1024).toFixed(2)} | ${(result.memory.idle.rss / 1024 / 1024).toFixed(2)} |\n`;
  markdown += `| 峰值 | ${(result.memory.peak.heapUsed / 1024 / 1024).toFixed(2)} | ${(result.memory.peak.heapTotal / 1024 / 1024).toFixed(2)} | ${(result.memory.peak.rss / 1024 / 1024).toFixed(2)} |\n`;

  markdown += `\n## 并发能力\n\n`;
  markdown += `| 并发数 | 成功率 (%) | 平均响应时间 (ms) |\n`;
  markdown += `|--------|-----------|------------------|\n`;
  for (const concurrency of result.concurrency) {
    markdown += `| ${concurrency.level} | ${concurrency.successRate.toFixed(2)} | ${concurrency.averageResponseTime.toFixed(2)} |\n`;
  }

  const reportPath = resolve(process.cwd(), 'docs/benchmarks/baseline.md');
  writeFileSync(reportPath, markdown);
  console.log(`📄 Markdown 报告已保存到: ${reportPath}`);
}

// 运行基准测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark().catch(console.error);
}

