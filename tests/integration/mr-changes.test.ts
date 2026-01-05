#!/usr/bin/env tsx

import { GitLabClient } from '../../src/gitlab/client.js';
import TestConfig from '../config/test-config.js';
import TestRunner from '../utils/test-runner.js';
import TestLogger from '../utils/test-logger.js';
import { config } from "dotenv";

config();

interface MergeRequestChange {
    old_path: string;
    new_path: string;
    a_mode: string;
    b_mode: string;
    new_file: boolean;
    renamed_file: boolean;
    deleted_file: boolean;
    diff: string;
}

interface MergeRequestChangesResponse {
    changes: MergeRequestChange[];
    [key: string]: any;
}

async function main(): Promise<void> {
    const logger = TestLogger.getInstance();
    const runner = new TestRunner();
    
    try {
        // 加载配置
        const config = TestConfig.getInstance();
        logger.info('🔧 Loading test configuration...');
        logger.info(`Connected to: ${config.getConnectionString()}`);
        logger.info(`Testing MR #${config.gitlab.mergeRequestIid} in ${config.gitlab.projectPath}`);
        
        // 创建GitLab客户端
        const client = new GitLabClient({
            host: config.gitlab.host,
            token: config.gitlab.token
        });
        
        // 创建测试套件
        const suite = runner.createTestSuite(
            'GitLab MR Changes Integration Tests',
            'Comprehensive testing of GitLab merge request changes functionality'
        );
        
        // 添加测试用例
        suite.addTest('Get MR Changes - Basic Test', async () => {
            logger.info(`📋 Testing getMergeRequestChanges for MR #${config.gitlab.mergeRequestIid}`);
            
            const changes = await client.getMergeRequestChanges(
                config.gitlab.projectPath,
                config.gitlab.mergeRequestIid
            );

            const result = {
                changes: changes.changes.map((change: any) => ({
                  old_path: change.old_path,
                  new_path: change.new_path,
                  new_file: change.new_file,
                  deleted_file: change.deleted_file,
                  renamed_file: change.renamed_file,
                  diff: change.diff 
                })),
                summary: {
                  total_files: changes.changes.length,
                  additions: changes.changes.filter((c: any) => c.new_file).length,
                  deletions: changes.changes.filter((c: any) => c.deleted_file).length,
                  modifications: changes.changes.filter((c: any) => !c.new_file && !c.deleted_file && !c.renamed_file).length,
                  renames: changes.changes.filter((c: any) => c.renamed_file).length
                }
              };

              console.log(`result-----------${JSON.stringify(result)}`);
            
            // 验证结果结构
            if (!result || typeof result !== 'object') {
                throw new Error('Result should be an object');
            }
            
            if (!Array.isArray(result.changes)) {
                throw new Error('Result.changes should be an array');
            }
            
            logger.success(`✅ Found ${result.changes.length} file changes`);
          
            return result as MergeRequestChangesResponse;
        });
        
        // suite.addTest('Validate Change Objects', async () => {
        //     const result = await client.getMergeRequestChanges(
        //         config.gitlab.projectPath,
        //         config.gitlab.mergeRequestIid
        //     ) as MergeRequestChangesResponse;
            
        //     if (result.changes.length === 0) {
        //         logger.warn('⚠️  No changes found in this MR');
        //         return { validated: true, count: 0 };
        //     }
            
        //     // 验证每个变更对象的结构
        //     for (let i = 0; i < Math.min(result.changes.length, 3); i++) {
        //         const change = result.changes[i];
                
        //         const requiredFields = ['old_path', 'new_path', 'new_file', 'renamed_file', 'deleted_file'];
        //         for (const field of requiredFields) {
        //             if (!(field in change)) {
        //                 throw new Error(`Change object missing required field: ${field}`);
        //             }
        //         }
                
        //         logger.info(`📄 Change ${i + 1}: ${change.old_path} -> ${change.new_path}`);
        //         logger.info(`   New: ${change.new_file}, Renamed: ${change.renamed_file}, Deleted: ${change.deleted_file}`);
        //     }
            
        //     return { validated: true, count: result.changes.length };
        // });
        
        // suite.addTest('Test With Content Inclusion', async () => {
        //     logger.info('🔍 Testing with content inclusion enabled...');
            
        //     const result = await client.getMergeRequestChanges(
        //         config.gitlab.projectPath,
        //         config.gitlab.mergeRequestIid
        //     ) as MergeRequestChangesResponse;
            
        //     if (result.changes.length > 0) {
        //         const firstChange = result.changes[0];
        //         if (firstChange.diff) {
        //             logger.success(`✅ Content included - diff size: ${firstChange.diff.length} characters`);
        //         } else {
        //             logger.warn('⚠️  Content requested but no diff found');
        //         }
        //     }
            
        //     return result;
        // });
        
        // suite.addTest('Error Handling - Invalid Project', async () => {
        //     logger.info('🚫 Testing error handling with invalid project...');
            
        //     try {
        //         await client.getMergeRequestChanges(
        //             'invalid/project',
        //             config.gitlab.mergeRequestIid
        //         );
        //         throw new Error('Should have thrown an error for invalid project');
        //     } catch (error) {
        //         const err = error as Error;
        //         if (err.message === 'Should have thrown an error for invalid project') {
        //             throw err;
        //         }
        //         logger.success(`✅ Correctly handled error: ${err.message}`);
        //         return { errorHandled: true, errorMessage: err.message };
        //     }
        // });
        
        // 运行测试套件
        const stats = await runner.runSuite(suite.build());
        
        // 输出详细结果
        logger.info('\n📊 Detailed Test Results:');
        logger.info(`   Success Rate: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
        logger.info(`   Total Duration: ${stats.duration}ms`);
        logger.info(`   Log File: ${logger.getLogFile()}`);
        
        // 退出状态
        if (stats.failed > 0) {
            logger.error('❌ Some tests failed');
            process.exit(1);
        } else {
            logger.success('🎉 All tests passed successfully!');
            process.exit(0);
        }
        
    } catch (error) {
        const err = error as Error;
        logger.error('💥 Test execution failed:', {
            error: err.message,
            stack: err.stack
        });
        process.exit(1);
    }
}

// 支持命令行帮助
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
GitLab MR Changes Integration Test

Usage: tsx mr-changes.test.ts [options]

Options:
  --help, -h     Show this help message

Environment Variables (in tests/config/.env):
  GITLAB_HOST           GitLab instance URL
  GITLAB_TOKEN          GitLab access token
  PROJECT_PATH          Project path (owner/repo)
  MERGE_REQUEST_IID     Merge request internal ID
  INCLUDE_CONTENT       Include file content in changes (true/false)
  LOG_LEVEL            Log level (INFO/SUCCESS/ERROR/WARN)

Example:
  tsx tests/integration/mr-changes.test.ts
`);
    process.exit(0);
}

// 运行主函数
main().catch((error: Error) => {
    console.error('Failed to run tests:', error);
    process.exit(1);
}); 