#!/usr/bin/env tsx

import { GitLabClient } from '../../src/gitlab/client.js';
import TestConfig from '../config/test-config.js';
import TestLogger from '../utils/test-logger.js';
import { config } from "dotenv";

config();

interface QuickTestResult {
    connectionTest: boolean;
    basicApiTest: boolean;
    mrChangesTest: boolean;
    errors: string[];
}

async function runQuickTest(): Promise<QuickTestResult> {
    const logger = TestLogger.getInstance();
    const result: QuickTestResult = {
        connectionTest: false,
        basicApiTest: false,
        mrChangesTest: false,
        errors: []
    };

    try {
        logger.info('🚀 Starting quick GitLab MCP test...');
        
        // 加载配置
        const config = TestConfig.getInstance();
        logger.info(`Testing: ${config.getConnectionString()}`);
        
        // 创建客户端
        const client = new GitLabClient({
            host: config.gitlab.host,
            token: config.gitlab.token
        });
        
        // 测试1: 连接测试
        logger.info('1️⃣ Testing connection...');
        try {
            const connectionResult = await client.testConnection();
            if (connectionResult.success) {
                logger.success(`✅ Connection successful - User: ${connectionResult.user?.name || 'Unknown'}`);
                result.connectionTest = true;
            } else {
                throw new Error(connectionResult.error || 'Unknown connection error');
            }
        } catch (error) {
            const err = error as Error;
            logger.error(`❌ Connection failed: ${err.message}`);
            result.errors.push(`Connection: ${err.message}`);
        }
        
        // 测试2: 基本API测试
        logger.info('2️⃣ Testing basic API...');
        try {
            const project = await client.getProject(config.gitlab.projectPath);
            logger.success(`✅ Project access successful - ${project.name} (ID: ${project.id})`);
            result.basicApiTest = true;
        } catch (error) {
            const err = error as Error;
            logger.error(`❌ Project access failed: ${err.message}`);
            result.errors.push(`Project API: ${err.message}`);
        }
        
        // 测试3: MR Changes API测试
        logger.info('3️⃣ Testing MR changes API...');
        try {
            const changes = await client.getMergeRequestChanges(
                config.gitlab.projectPath,
                config.gitlab.mergeRequestIid
            );
            
            if (changes && Array.isArray(changes.changes)) {
                logger.success(`✅ MR changes retrieved - ${changes.changes.length} file changes found`);
                result.mrChangesTest = true;
            } else {
                throw new Error('Invalid changes response structure');
            }
        } catch (error) {
            const err = error as Error;
            logger.error(`❌ MR changes test failed: ${err.message}`);
            result.errors.push(`MR Changes: ${err.message}`);
        }
        
        return result;
        
    } catch (error) {
        const err = error as Error;
        logger.error(`💥 Quick test execution failed: ${err.message}`);
        result.errors.push(`Execution: ${err.message}`);
        return result;
    }
}

async function main(): Promise<void> {
    const logger = TestLogger.getInstance();
    
    try {
        const startTime = Date.now();
        const result = await runQuickTest();
        const duration = Date.now() - startTime;
        
        // 统计结果
        const totalTests = 3;
        const passedTests = [result.connectionTest, result.basicApiTest, result.mrChangesTest]
            .filter(Boolean).length;
        
        logger.info('\n📊 Quick Test Summary:');
        logger.info(`   Duration: ${duration}ms`);
        logger.info(`   Tests Passed: ${passedTests}/${totalTests}`);
        logger.info(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (result.errors.length > 0) {
            logger.error('\n❌ Errors encountered:');
            result.errors.forEach((error, index) => {
                logger.error(`   ${index + 1}. ${error}`);
            });
        }
        
        if (passedTests === totalTests) {
            logger.success('\n🎉 All quick tests passed! GitLab MCP is working correctly.');
            process.exit(0);
        } else {
            logger.error(`\n❌ ${totalTests - passedTests} test(s) failed. Please check your configuration.`);
            process.exit(1);
        }
        
    } catch (error) {
        const err = error as Error;
        logger.error('💥 Quick test execution failed:', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
}

// 命令行帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
GitLab MCP Quick Test

A fast test to verify GitLab MCP functionality (<5 seconds).

Usage: tsx quick.test.ts [options]

Options:
  --help, -h     Show this help message

Environment Variables (in tests/config/.env):
  GITLAB_HOST           GitLab instance URL
  GITLAB_TOKEN          GitLab access token  
  PROJECT_PATH          Project path (owner/repo)
  MERGE_REQUEST_IID     Merge request internal ID

Example:
  tsx tests/integration/quick.test.ts
`);
    process.exit(0);
}

// 运行主函数
main().catch((error: Error) => {
    console.error('Failed to run quick test:', error);
    process.exit(1);
}); 