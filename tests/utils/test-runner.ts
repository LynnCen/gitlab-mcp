import TestLogger from './test-logger.js';

interface TestResult<T = any> {
    success: boolean;
    data?: T;
    error?: Error;
    duration: number;
    timestamp: string;
}

interface TestSuite {
    name: string;
    description?: string;
    tests: TestCase[];
}

interface TestCase {
    name: string;
    description?: string;
    test: () => Promise<any> | any;
    timeout?: number;
    skip?: boolean;
}

interface TestStats {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
}

class TestRunner {
    private logger: TestLogger;
    private defaultTimeout: number = 10000; // 10 seconds

    constructor() {
        this.logger = TestLogger.getInstance();
    }

    public async runTest<T = any>(
        testName: string, 
        testFn: () => Promise<T> | T, 
        timeout: number = this.defaultTimeout
    ): Promise<TestResult<T>> {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        
        this.logger.info(`Running test: ${testName}`);
        
        try {
            // 设置超时
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Test timeout after ${timeout}ms`)), timeout);
            });
            
            // 运行测试
            const result = await Promise.race([
                Promise.resolve(testFn()),
                timeoutPromise
            ]);
            
            const duration = Date.now() - startTime;
            this.logger.success(`✓ ${testName} (${duration}ms)`);
            
            return {
                success: true,
                data: result,
                duration,
                timestamp
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            const testError = error instanceof Error ? error : new Error(String(error));
            
            this.logger.error(`✗ ${testName} (${duration}ms)`, {
                error: testError.message,
                stack: testError.stack
            });
            
            return {
                success: false,
                error: testError,
                duration,
                timestamp
            };
        }
    }

    public async runSuite(suite: TestSuite): Promise<TestStats> {
        const startTime = Date.now();
        const stats: TestStats = {
            total: suite.tests.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };

        this.logger.info(`\n📋 Running test suite: ${suite.name}`);
        if (suite.description) {
            this.logger.info(`   ${suite.description}`);
        }

        for (const testCase of suite.tests) {
            if (testCase.skip) {
                this.logger.warn(`⏭ Skipping: ${testCase.name}`);
                stats.skipped++;
                continue;
            }

            const result = await this.runTest(
                testCase.name,
                testCase.test,
                testCase.timeout
            );

            if (result.success) {
                stats.passed++;
            } else {
                stats.failed++;
            }
        }

        stats.duration = Date.now() - startTime;
        this.printSuiteResults(suite.name, stats);
        
        return stats;
    }

    public async runMultipleSuites(suites: TestSuite[]): Promise<TestStats> {
        const overallStartTime = Date.now();
        const overallStats: TestStats = {
            total: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };

        for (const suite of suites) {
            const suiteStats = await this.runSuite(suite);
            overallStats.total += suiteStats.total;
            overallStats.passed += suiteStats.passed;
            overallStats.failed += suiteStats.failed;
            overallStats.skipped += suiteStats.skipped;
        }

        overallStats.duration = Date.now() - overallStartTime;
        this.printOverallResults(overallStats);
        
        return overallStats;
    }

    private printSuiteResults(suiteName: string, stats: TestStats): void {
        this.logger.info(`\n📊 Suite "${suiteName}" Results:`);
        this.logger.info(`   Total: ${stats.total}`);
        this.logger.success(`   Passed: ${stats.passed}`);
        if (stats.failed > 0) {
            this.logger.error(`   Failed: ${stats.failed}`);
        }
        if (stats.skipped > 0) {
            this.logger.warn(`   Skipped: ${stats.skipped}`);
        }
        this.logger.info(`   Duration: ${stats.duration}ms`);
    }

    private printOverallResults(stats: TestStats): void {
        this.logger.info(`\n🎯 Overall Test Results:`);
        this.logger.info(`   Total Suites: ${stats.total}`);
        this.logger.success(`   Passed: ${stats.passed}`);
        
        if (stats.failed > 0) {
            this.logger.error(`   Failed: ${stats.failed}`);
        } else {
            this.logger.success(`   All tests passed! 🎉`);
        }
        
        if (stats.skipped > 0) {
            this.logger.warn(`   Skipped: ${stats.skipped}`);
        }
        
        this.logger.info(`   Total Duration: ${stats.duration}ms`);
        
        // 显示日志统计
        const logSummary = this.logger.summary();
        this.logger.info(`   Log Entries: ${logSummary.total} (${logSummary.byLevel.ERROR} errors, ${logSummary.byLevel.WARN} warnings)`);
    }

    public createTestSuite(name: string, description?: string): TestSuiteBuilder {
        return new TestSuiteBuilder(name, description);
    }

    public setDefaultTimeout(timeout: number): void {
        this.defaultTimeout = timeout;
    }
}

class TestSuiteBuilder {
    private suite: TestSuite;

    constructor(name: string, description?: string) {
        this.suite = {
            name,
            description,
            tests: []
        };
    }

    public addTest(
        name: string, 
        test: () => Promise<any> | any, 
        options: { description?: string; timeout?: number; skip?: boolean } = {}
    ): TestSuiteBuilder {
        this.suite.tests.push({
            name,
            test,
            description: options.description,
            timeout: options.timeout,
            skip: options.skip
        });
        return this;
    }

    public build(): TestSuite {
        return this.suite;
    }
}

export type { TestResult, TestSuite, TestCase, TestStats };
export { TestRunner, TestSuiteBuilder };
export default TestRunner; 