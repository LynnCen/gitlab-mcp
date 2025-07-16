import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

enum LogLevel {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    ERROR = 'ERROR',
    WARN = 'WARN'
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class TestLogger {
    private static instance: TestLogger;
    private logs: LogEntry[] = [];
    private logDir: string;
    private logFile: string;

    private constructor() {
        this.logDir = resolve(process.cwd(), 'tests/logs');
        this.logFile = resolve(this.logDir, `test-${new Date().toISOString().split('T')[0]}.log`);
        this.ensureLogDir();
    }

    public static getInstance(): TestLogger {
        if (!TestLogger.instance) {
            TestLogger.instance = new TestLogger();
        }
        return TestLogger.instance;
    }

    private ensureLogDir(): void {
        if (!existsSync(this.logDir)) {
            mkdirSync(this.logDir, { recursive: true });
        }
    }

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private getColorCode(level: LogLevel): string {
        const colors = {
            [LogLevel.INFO]: '\x1b[36m',    // Cyan
            [LogLevel.SUCCESS]: '\x1b[32m',  // Green
            [LogLevel.ERROR]: '\x1b[31m',    // Red
            [LogLevel.WARN]: '\x1b[33m'      // Yellow
        };
        return colors[level];
    }

    private log(level: LogLevel, message: string, data?: any): void {
        const timestamp = this.formatTimestamp();
        const logEntry: LogEntry = { timestamp, level, message, data };
        
        this.logs.push(logEntry);
        
        // Console output with colors
        const colorCode = this.getColorCode(level);
        const reset = '\x1b[0m';
        const prefix = `${colorCode}[${level}]${reset}`;
        
        if (data !== undefined) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
        
        this.writeToFile(logEntry);
    }

    private writeToFile(entry: LogEntry): void {
        const logLine = `[${entry.timestamp}] [${entry.level}] ${entry.message}${
            entry.data ? ` ${JSON.stringify(entry.data)}` : ''
        }\n`;
        
        try {
            writeFileSync(this.logFile, logLine, { flag: 'a' });
        } catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.INFO, message, data);
    }

    public success(message: string, data?: any): void {
        this.log(LogLevel.SUCCESS, message, data);
    }

    public error(message: string, data?: any): void {
        this.log(LogLevel.ERROR, message, data);
    }

    public warn(message: string, data?: any): void {
        this.log(LogLevel.WARN, message, data);
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(log => log.level === level);
    }

    public clearLogs(): void {
        this.logs = [];
    }

    public getLogFile(): string {
        return this.logFile;
    }

    public summary(): { total: number; byLevel: Record<LogLevel, number> } {
        const byLevel = {
            [LogLevel.INFO]: 0,
            [LogLevel.SUCCESS]: 0,
            [LogLevel.ERROR]: 0,
            [LogLevel.WARN]: 0
        };
        
        this.logs.forEach(log => {
            byLevel[log.level]++;
        });
        
        return {
            total: this.logs.length,
            byLevel
        };
    }
}

export type { LogEntry };
export { TestLogger, LogLevel };
export default TestLogger; 