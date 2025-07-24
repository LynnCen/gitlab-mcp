import { CodeReviewRules, DiffAnalysis, GitLabFileChange } from "../../../config/types";
import { CODE_REVIEW_RULES, FILE_FILTER_CONFIG } from "../../../utils/const";

/**
 * 分析diff并提取准确的行号信息
 */
export function analyzeDiffLines(diff: string): DiffAnalysis {
    const lines = diff.split('\n');
    const newLines = [];
    const deletedLines = [];
    const contextLines = [];
    
    let newLineNumber = 0;
    let oldLineNumber = 0;
    
    for (const line of lines) {
      if (line.startsWith('@@')) {
        // 解析行号范围 @@-oldStart,oldCount +newStart,newCount@@
        const match = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
        if (match) {
          oldLineNumber = parseInt(match[1]) - 1;
          newLineNumber = parseInt(match[2]) - 1;
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        newLineNumber++;
        newLines.push({ lineNumber: newLineNumber, content: line.substring(1) });
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        oldLineNumber++;
        deletedLines.push({ lineNumber: oldLineNumber, content: line.substring(1) });
      } else if (line.startsWith(' ')) {
        oldLineNumber++;
        newLineNumber++;
        contextLines.push({ lineNumber: newLineNumber, content: line.substring(1) });
      }
    }
    
    return { newLines, deletedLines, contextLines };
  }
  
  /**
   * 获取文件扩展名
   */
  export function getFileExtension(filePath: string): string {
    const match = filePath.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
  }
  
  /**
   * 获取文件的代码审查规则
   */
  export function getCodeReviewRules(extension: string): CodeReviewRules {
    const rules = CODE_REVIEW_RULES[extension];
    if (!rules) {
      return {
        focus_areas: ['基础代码质量', '可读性', '维护性'],
        specific_rules: [
          '确保代码逻辑清晰',
          '避免过度复杂的嵌套',
          '函数和变量命名要有意义',
          '添加必要的注释'
        ],
        ignore_patterns: [],
        severity_mapping: {}
      };
    }
    
    return rules;
  }
  
  /**
   * 判断文件是否需要审查
   */
  export function shouldReviewFile(filePath: string, extension: string): boolean {
    // 检查扩展名
    if (!FILE_FILTER_CONFIG.includedExtensions.includes(extension)) {
      return false;
    }
    
    // 检查排除模式
    for (const pattern of FILE_FILTER_CONFIG.excludePatterns) {
      if (pattern.test(filePath)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * 过滤可审查的变更
   */
  export function filterReviewableChanges(changes: GitLabFileChange[], focusFiles?: string[]): GitLabFileChange[] {
    return changes.filter(change => {
      // 如果指定了重点文件，只审查指定文件
      if (focusFiles && focusFiles.length > 0) {
        return focusFiles.some(file => change.new_path.includes(file));
      }
      
      // 排除删除的文件
      if (change.deleted_file) {
        return false;
      }
      
      // 检查文件是否应该被审查
      const extension = getFileExtension(change.new_path);
      if (!shouldReviewFile(change.new_path, extension)) {
        return false;
      }
      
      // 检查diff大小
      if (change.diff && change.diff.split('\n').length > FILE_FILTER_CONFIG.maxDiffLines) {
        console.log(`⚠️  文件 ${change.new_path} diff过大，跳过审查`);
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 获取文件被排除的原因
   */
 export function getExclusionReason(change: GitLabFileChange): string {
    if (change.deleted_file) {
      return '文件已删除';
    }
    
    const extension = getFileExtension(change.new_path);
    if (!FILE_FILTER_CONFIG.includedExtensions.includes(extension)) {
      return '文件类型不支持';
    }
    
    for (const pattern of FILE_FILTER_CONFIG.excludePatterns) {
      if (pattern.test(change.new_path)) {
        return '匹配排除模式';
      }
    }
    
    if (change.diff && change.diff.split('\n').length > FILE_FILTER_CONFIG.maxDiffLines) {
      return 'diff过大';
    }
    
    return '未知原因';
  } 