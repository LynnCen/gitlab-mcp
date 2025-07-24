import { CodeReviewRules, FileFilterConfig } from "../config/types";

/**
 * 代码审查规则配置
 */
export const CODE_REVIEW_RULES: Record<string, CodeReviewRules> = {
    '.ts': {
      focus_areas: ['类型安全', '性能优化', '代码规范', '错误处理'],
      specific_rules: [
        '确保所有函数都有明确的返回类型',
        '避免使用 any 类型，使用具体类型或泛型',
        '异步函数必须正确处理错误',
        '组件和函数名使用 PascalCase 或 camelCase',
        '避免在循环中进行异步操作',
        '使用 const assertions 来获得更精确的类型推断'
      ],
      ignore_patterns: ['*.d.ts', '*.test.ts', '*.spec.ts'],
      severity_mapping: {
        'any类型使用': 'warning',
        '未处理的Promise': 'critical',
        '循环中的异步操作': 'warning',
        '缺少类型注解': 'suggestion'
      }
    },
    '.vue': {
      focus_areas: ['组件设计', '性能优化', 'Vue最佳实践', '可访问性'],
      specific_rules: [
        'template 中避免复杂的表达式',
        '合理使用 computed 和 watch',
        '确保组件的 props 有正确的类型定义',
        'emit 事件需要明确定义类型',
        '避免在 template 中直接修改 props',
        '使用正确的生命周期钩子'
      ],
      ignore_patterns: [],
      severity_mapping: {
        'template表达式过于复杂': 'warning',
        'props缺少类型': 'warning',
        '直接修改props': 'critical'
      }
    },
    '.js': {
      focus_areas: ['ES6+语法', '性能', '错误处理', '代码规范'],
      specific_rules: [
        '使用 const/let 替代 var',
        '使用箭头函数或 function 声明',
        '避免回调地狱，使用 Promise 或 async/await',
        '正确处理异常和错误',
        '使用严格模式',
        '避免全局变量污染'
      ],
      ignore_patterns: ['*.min.js', '*.bundle.js'],
      severity_mapping: {
        '使用var声明': 'suggestion',
        '回调地狱': 'warning',
        '未处理异常': 'critical'
      }
    }
  };


  /**
 * 文件过滤配置
 */
export const FILE_FILTER_CONFIG: FileFilterConfig = {
    includedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.py', '.java', '.cs', '.go', '.rs'],
    excludePatterns: [
      /node_modules/,
      /dist/,
      /build/,
      /\.git/,
      /coverage/,
      /\.nyc_output/,
      /\.next/,
      /\.nuxt/,
      /\.vuepress/,
      /\.temp/,
      /\.cache/,
      /\.DS_Store/,
      /\.env/,
      /\.log$/,
      /\.lock$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
      /pnpm-lock\.yaml$/,
      /\.map$/,
      /\.min\./,
      /\.d\.ts$/,
      /\.test\./,
      /\.spec\./,
      /\.stories\./,
      /\.config\./,
      /\.md$/,
      /README/i,
      /CHANGELOG/i,
      /LICENSE/i
    ],
    maxFileSize: 100 * 1024, // 100KB
    maxDiffLines: 500
  };