
/**
 * 提示渲染器
 */
export class PromptRenderer {
  /**
   * 渲染模板
   * 
   * 支持：
   * - {{variable}} 变量插值
   * - {{#if condition}}...{{/if}} 条件渲染
   * - {{#each items}}...{{/each}} 循环渲染
   */
  static render(template: string, args: Record<string, any>): string {
    let result = template;

    // 处理条件块 {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      if (args[condition]) {
        return content;
      }
      return '';
    });

    // 处理循环块 {{#each items}}...{{/each}}
    result = result.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = args[arrayName];
      if (Array.isArray(array)) {
        return array.map((item, index) => {
          let itemContent = content;
          // 替换 {{this}} 为当前项
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          // 替换 {{@index}} 为索引
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
          // 如果是对象，替换对象的属性
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((key) => {
              itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(item[key]));
            });
          }
          return itemContent;
        }).join('');
      }
      return '';
    });

    // 处理变量插值 {{variable}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      const value = args[variable];
      return value !== undefined ? String(value) : '';
    });

    return result;
  }
}

