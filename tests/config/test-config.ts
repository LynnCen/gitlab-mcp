import { config } from 'dotenv';
import { resolve } from 'path';

// 加载环境变量
config({ path: resolve(process.cwd(), 'tests/config/.env') });

interface GitLabConfig {
    host: string;
    token: string;
    projectPath: string;
    mergeRequestIid: number;
}

interface TestConfigOptions {
    includeContent?: boolean;
    logLevel?: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN';
}

class TestConfig {
    private static instance: TestConfig;
    
    public readonly gitlab: GitLabConfig;
    public readonly options: TestConfigOptions;

    private constructor() {
        this.gitlab = this.validateGitLabConfig();
        this.options = {
            includeContent: process.env.INCLUDE_CONTENT === 'true',
            logLevel: (process.env.LOG_LEVEL as any) || 'INFO'
        };
    }

    public static getInstance(): TestConfig {
        if (!TestConfig.instance) {
            TestConfig.instance = new TestConfig();
        }
        return TestConfig.instance;
    }

    private validateGitLabConfig(): GitLabConfig {
        const requiredEnvVars = ['GITLAB_HOST', 'GITLAB_TOKEN', 'PROJECT_PATH', 'MERGE_REQUEST_IID'];
        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }

        const mergeRequestIid = parseInt(process.env.MERGE_REQUEST_IID!, 10);
        if (isNaN(mergeRequestIid)) {
            throw new Error('MERGE_REQUEST_IID must be a valid number');
        }

        return {
            host: process.env.GITLAB_HOST!,
            token: process.env.GITLAB_TOKEN!,
            projectPath: process.env.PROJECT_PATH!,
            mergeRequestIid
        };
    }

    public getConnectionString(): string {
        return `${this.gitlab.host} (Project: ${this.gitlab.projectPath})`;
    }

    public static createConfig(overrides: Partial<GitLabConfig> = {}): GitLabConfig {
        const instance = TestConfig.getInstance();
        return { ...instance.gitlab, ...overrides };
    }
}

export type { GitLabConfig, TestConfigOptions };
export { TestConfig };
export default TestConfig; 