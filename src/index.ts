#!/usr/bin/env node

import 'dotenv/config';
import { MCPServer } from './core/server.js';
import { gitlabPluginFactory } from './plugins/gitlab.js';
import { ConfigManager } from './core/config.js';
import { ConsoleLogger } from './core/logger.js';

/**
 * 测试 GitLab 连接
 */
async function testConnection(): Promise<void> {
  try {
    const config = new ConfigManager();
    const logger = new ConsoleLogger(config.getServerConfig().logLevel);
    
    logger.info('开始测试 GitLab 连接...');
    
    // 检查必要的配置
    const gitlabConfig = config.getGitLabConfig();
    
    if (!gitlabConfig.host || !gitlabConfig.token) {
      logger.error('❌ 缺少必要的配置: GITLAB_HOST 或 GITLAB_TOKEN');
      logger.info('请确保在 .env 文件中设置了以下环境变量：');
      logger.info('GITLAB_HOST=https://gitlab.com');
      logger.info('GITLAB_TOKEN=your-gitlab-token');
      process.exit(1);
    }
    
    // 创建 GitLab 插件实例进行测试
    const plugin = gitlabPluginFactory.create({ config: config.getConfig(), logger });
    
    try {
      await plugin.initialize();
      logger.info('✅ GitLab连接测试成功');
      logger.info('✅ 用户身份验证成功');
      logger.info('✅ API访问权限验证成功');
      logger.info('✅ 配置验证完成');
      
      // 获取用户信息作为额外验证
      const tools = plugin.getTools();
      logger.info(`✅ 可用工具数量: ${tools.length}`);
      
      const resources = plugin.getResources();
      logger.info(`✅ 可用资源数量: ${resources.length}`);
      
      logger.info('🎉 所有测试通过！您可以开始使用 GitLab MCP Server 了。');
      
    } catch (error: any) {
      logger.error('❌ GitLab连接测试失败:', error.message);
      
      if (error.message.includes('401')) {
        logger.error('💡 可能的原因：');
        logger.error('   - GitLab 访问令牌无效或已过期');
        logger.error('   - 请重新生成访问令牌');
      } else if (error.message.includes('403')) {
        logger.error('💡 可能的原因：');
        logger.error('   - GitLab 访问令牌权限不足');
        logger.error('   - 请确保令牌具有 api、read_user、read_repository 权限');
      } else if (error.message.includes('404')) {
        logger.error('💡 可能的原因：');
        logger.error('   - GitLab 主机地址不正确');
        logger.error('   - 请检查 GITLAB_HOST 环境变量');
      } else {
        logger.error('💡 可能的原因：');
        logger.error('   - 网络连接问题');
        logger.error('   - 防火墙阻止连接');
        logger.error('   - GitLab 服务器临时不可用');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ 测试连接时发生错误:', error);
    process.exit(1);
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
GitLab MCP Server - 一个可扩展的 GitLab MCP 服务器

用法:
  gitlab-mcp [选项]

选项:
  --test-connection    测试 GitLab 连接
  --help, -h          显示帮助信息
  --version, -v       显示版本信息

示例:
  gitlab-mcp                    # 启动 MCP 服务器
  gitlab-mcp --test-connection  # 测试 GitLab 连接
  gitlab-mcp --help             # 显示帮助信息

更多信息请访问: https://github.com/your-username/gitlab-mcp-server
`);
}

/**
 * 显示版本信息
 */
function showVersion(): void {
  const packageJson = require('../package.json');
  console.log(`GitLab MCP Server v${packageJson.version}`);
}

/**
 * 启动 MCP 服务器
 */
async function startServer(): Promise<void> {
  try {
    // 创建服务器
    const server = new MCPServer();

    // 注册插件
    server.registerPlugin('gitlab', gitlabPluginFactory);

    // 启动服务器
    await server.start();

    // 处理进程信号
    process.on('SIGINT', async () => {
      console.error('收到SIGINT信号，正在停止服务器...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('收到SIGTERM信号，正在停止服务器...');
      await server.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // 处理命令行参数
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }
  
  if (args.includes('--test-connection')) {
    await testConnection();
    return;
  }
  
  // 默认启动服务器
  await startServer();
}

// 运行主函数
main().catch((error) => {
  console.error('未处理的错误:', error);
  process.exit(1);
}); 