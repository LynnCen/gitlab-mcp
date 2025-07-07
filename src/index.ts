#!/usr/bin/env node

import 'dotenv/config';
import { ExpressServer } from './server/ExpressServer.js';

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    console.log('='.repeat(50));
    console.log('🚀 启动 GitLab MCP 服务器');
    console.log('='.repeat(50));

    // 创建并启动服务器
    const server = new ExpressServer();
    await server.start();

    // 优雅关闭处理
    const shutdown = async () => {
      console.log('\n正在关闭服务器...');
      await server.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    console.error('\n💡 常见问题排查:');
    console.error('   1. 检查环境变量 GITLAB_HOST 和 GITLAB_TOKEN 是否正确设置');
    console.error('   2. 确认 GitLab 服务器网络连接正常');
    console.error('   3. 验证 GitLab 访问令牌权限（需要 api, read_user, read_repository）');
    console.error('   4. 检查端口是否被占用');
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 运行主函数
main(); 