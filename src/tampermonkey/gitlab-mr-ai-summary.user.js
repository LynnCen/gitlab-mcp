// ==UserScript==
// @name         GitLab MR AI Summary
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  为 GitLab MR 页面生成 AI 总结，帮助 Review 人员更好地审查代码
// @author       xuer
// @match        https://git.intra.gaoding.com/*/merge_requests/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @require      https://cdn.jsdelivr.net/npm/marked@4.3.0/marked.min.js
// ==/UserScript==

(function() {
    'use strict';

    // 配置常量
    const CONFIG = {
        // DIFY API 配置 - 用户需要设置自己的 API Key
        DIFY_API_KEY: GM_getValue('dify_api_key', ''),
        DIFY_API_URL: 'https://api-dify.intra.gaoding.com/v1/chat-messages',

        // GitLab API 配置
        GITLAB_TOKEN: GM_getValue('gitlab_token', ''),
        GITLAB_BASE_URL: 'https://git.intra.gaoding.com',

        // setting btn id
        SETTING_BTN_ID: 'ai-summary-setting-btn',

        // 按钮样式
        BUTTON_STYLE: `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin-left: 10px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 32px;
            line-height: 1;
        `,

        // 总结区域样式
        SUMMARY_STYLE: `
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `
    };

    // 检查是否为 GitLab MR 页面
    function isGitLabMRPage() {
        const url = window.location.href;
        const pathPattern = /\/merge_requests\/\d+\/?$/;
        return pathPattern.test(url);
    }

    // 解析当前页面的项目和 MR 信息
    function parseCurrentPageInfo() {
        const url = window.location.href;
        const urlMatch = url.match(/\/([^\/]+\/[^\/]+)\/-\/merge_requests\/(\d+)/);

        if (!urlMatch) {
            throw new Error('无法解析当前页面的项目和 MR 信息');
        }

        const projectPath = urlMatch[1];
        const mergeRequestId = urlMatch[2];

        return {
            projectPath,
            mergeRequestId,
            url
        };
    }

    // 使用 GitLab API 获取 MR 信息
    async function getMRInfo() {
        const token = CONFIG.GITLAB_TOKEN;
        if (!token) {
            throw new Error('请先设置 GitLab Personal Access Token');
        }

        const { projectPath, mergeRequestId } = parseCurrentPageInfo();
        const encodedProjectPath = encodeURIComponent(projectPath);
        const apiUrl = `${CONFIG.GITLAB_BASE_URL}/api/v4/projects/${encodedProjectPath}/merge_requests/${mergeRequestId}`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            resolve({
                                title: data.title,
                                description: data.description || '',
                                url: data.web_url,
                                id: data.id,
                                iid: data.iid,
                                projectId: data.project_id,
                                sourceBranch: data.source_branch,
                                targetBranch: data.target_branch,
                                author: data.author?.username,
                            });
                        } else {
                            reject(new Error(`获取 MR 信息失败: ${response.status} ${response.statusText}`));
                        }
                    } catch (error) {
                        reject(new Error('解析 MR 信息失败: ' + error.message));
                    }
                },
                onerror: function() {
                    reject(new Error('获取 MR 信息的网络请求失败'));
                }
            });
        });
    }

    // 使用 GitLab API 获取 MR 文件差异
    async function getMRChanges() {
        const token = CONFIG.GITLAB_TOKEN;
        if (!token) {
            throw new Error('请先设置 GitLab Personal Access Token');
        }

        const { projectPath, mergeRequestId } = parseCurrentPageInfo();
        const encodedProjectPath = encodeURIComponent(projectPath);
        const apiUrl = `${CONFIG.GITLAB_BASE_URL}/api/v4/projects/${encodedProjectPath}/merge_requests/${mergeRequestId}/changes`;

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                onload: function(response) {
                    try {
                        if (response.status === 200) {
                            const data = JSON.parse(response.responseText);
                            const files = data.changes.map(change => {
                                const diff = change.diff || '';
                                const additions = [];
                                const deletions = [];

                                // 解析 diff 内容
                                const diffLines = diff.split('\n');
                                diffLines.forEach(line => {
                                    // 过滤掉 Git diff 的元信息行
                                    if (line.startsWith('diff --git') || 
                                        line.startsWith('index ') || 
                                        line.startsWith('@@') || 
                                        line.startsWith('+++') || 
                                        line.startsWith('---') ||
                                        line.startsWith('Binary files')) {
                                        return;
                                    }
                                    
                                    // 提取实际的代码变更
                                    if (line.startsWith('+')) {
                                        additions.push(line.substring(1));
                                    } else if (line.startsWith('-')) {
                                        deletions.push(line.substring(1));
                                    }
                                });

                                return {
                                    fileName: change.new_path || change.old_path,
                                    oldPath: change.old_path,
                                    newPath: change.new_path,
                                    additions: additions.slice(0, 50), // 限制行数避免过长
                                    deletions: deletions.slice(0, 50),
                                    additionCount: additions.length,
                                    deletionCount: deletions.length,
                                    isNewFile: change.new_file,
                                    isDeletedFile: change.deleted_file,
                                    isRenamedFile: change.renamed_file
                                };
                            });

                            resolve(files);
                        } else {
                            reject(new Error(`获取 MR 文件差异失败: ${response.status} ${response.statusText}`));
                        }
                    } catch (error) {
                        reject(new Error('解析 MR 文件差异失败: ' + error.message));
                    }
                },
                onerror: function() {
                    reject(new Error('获取 MR 文件差异的网络请求失败'));
                }
            });
        });
    }

    // 生成 AI 总结
    async function generateAISummary(mrInfo, changedFiles) {
        const apiKey = CONFIG.DIFY_API_KEY;
        if (!apiKey) {
            throw new Error('请先设置 DIFY API Key');
        }

        const filesContent = changedFiles.map(file => {
            let fileStatus = '';
            if (file.isNewFile) fileStatus = ' (新文件)';
            else if (file.isDeletedFile) fileStatus = ' (删除文件)';
            else if (file.isRenamedFile) fileStatus = ' (重命名文件)';

            const additionsText = file.additions.length > 0 ?
                `添加的内容:\n${file.additions.join('\n')}` : '';
            const deletionsText = file.deletions.length > 0 ?
                `删除的内容:\n${file.deletions.join('\n')}` : '';

            return `文件: ${file.fileName}${fileStatus} (+${file.additionCount} -${file.deletionCount})
${additionsText}
${deletionsText}`;
        }).join('\n\n');


        console.log('filesContent', filesContent);

        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.DIFY_API_URL,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                data: JSON.stringify({
                    query: '开始',
                    inputs: {
                        mr_content: filesContent,
                    },
                    response_mode:'blocking',
                    user: mrInfo.author || `fake-user-${Math.random().toString(36).substring(2, 15)}`,
                }),
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve(data.answer)
                    } catch (error) {
                        reject(new Error('解析 API 响应失败: ' + error.message));
                    }
                },
                onerror: function(error) {
                    reject(new Error('API 请求失败: ' + error.message));
                }
            });
        });
    }

    // 显示总结
    function displaySummary(summary) {
        // 移除旧的总结
        const oldSummary = document.getElementById('ai-mr-summary');
        if (oldSummary) {
            oldSummary.remove();
        }

        // 创建总结容器
        const summaryContainer = document.createElement('div');
        summaryContainer.id = 'ai-mr-summary';
        summaryContainer.style.cssText = CONFIG.SUMMARY_STYLE;

        // 添加标题
        const title = document.createElement('h3');
        title.textContent = '🤖 AI 生成的 MR 总结';
        title.style.cssText = 'margin-top: 0; color: #333; font-size: 16px; font-weight: 600;';
        summaryContainer.appendChild(title);

        // 添加总结内容
        const content = document.createElement('div');
        content.innerHTML = marked.parse(summary);
        content.style.cssText = 'color: #555; font-size: 14px;';
        summaryContainer.appendChild(content);

        // 添加操作按钮
        const buttonsContainer = document.createElement('div');
        buttonsContainer.style.cssText = 'margin-top: 12px; display: flex; gap: 8px;';

        // 复制按钮
        const copyButton = document.createElement('button');
        copyButton.textContent = '📋 复制总结';
        copyButton.style.cssText = CONFIG.BUTTON_STYLE.replace('#667eea', '#17a2b8').replace('#764ba2', '#138496');
        copyButton.addEventListener('click', function() {
            navigator.clipboard.writeText(summary).then(() => {
                const originalText = this.textContent;
                this.textContent = '✅ 已复制';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 1000);
            }).catch(() => {
                alert('复制失败，请手动复制');
            });
        });

        buttonsContainer.appendChild(copyButton);
        summaryContainer.appendChild(buttonsContainer);

        // 插入到页面中
        const targetElement = document.querySelector('.merge-request-details, .issuable-details, .detail-page-description');
        if (targetElement) {
            targetElement.insertBefore(summaryContainer, targetElement.firstChild);
        } else {
            document.body.insertBefore(summaryContainer, document.body.firstChild);
        }
    }

    // 创建生成按钮
    function createGenerateButton() {
        const button = document.createElement('button');
        button.textContent = '🤖 生成 AI 总结';
        button.style.cssText = CONFIG.BUTTON_STYLE;

        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        });

        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        button.addEventListener('click', async function() {
            const originalText = this.textContent;
            this.textContent = '🔄 生成中...';
            this.disabled = true;

            try {
                // 检查必要的 API Key
                if (!CONFIG.DIFY_API_KEY) {
                    const apiKey = prompt('请输入你的 DIFY API Key:');
                    if (apiKey) {
                        GM_setValue('dify_api_key', apiKey);
                        CONFIG.DIFY_API_KEY = apiKey;
                    } else {
                        throw new Error('需要 DIFY API Key 才能生成总结(获取地址：https://dify.intra.gaoding.com/app/e32df53e-717e-4a39-b2bf-d51f36995be0/develop )');
                    }
                }

                if (!CONFIG.GITLAB_TOKEN) {
                    const token = prompt('请输入你的 GitLab Personal Access Token:');
                    if (token) {
                        GM_setValue('gitlab_token', token);
                        CONFIG.GITLAB_TOKEN = token;
                    } else {
                        throw new Error('需要 GitLab Token 才能获取 MR 信息');
                    }
                }

                const mrInfo = await getMRInfo();
                const changedFiles = await getMRChanges();

                if (changedFiles.length === 0) {
                    throw new Error('未找到修改的文件内容');
                }

                const summary = await generateAISummary(mrInfo, changedFiles);
                displaySummary(summary);

            } catch (error) {
                alert('生成总结失败: ' + error.message);
                console.error('AI Summary Error:', error);
            } finally {
                this.textContent = originalText;
                this.disabled = false;
            }
        });

        return button;
    }

    // 插入按钮到页面
    function insertButton() {
        // 查找合适的位置插入按钮
        const targetElements = [
            '.merge-request-actions',
            '.issuable-actions',
            '.detail-page-header-actions',
            '.merge-request-header-actions'
        ];

        for (const selector of targetElements) {
            const target = document.querySelector(selector);
            if (target) {
                const button = createGenerateButton();
                target.appendChild(button);
                break;
            }
        }
    }

    // 设置按钮（用于配置 API Key 和 Token）
    function createSettingsButton() {
        const button = document.createElement('button');
        button.id=CONFIG.SETTING_BTN_ID;
        button.textContent = '⚙️ 设置';
        button.style.cssText = CONFIG.BUTTON_STYLE.replace('#667eea', '#28a745').replace('#764ba2', '#20c997');

        button.addEventListener('click', function() {
            const settings = `
当前设置：
- DIFY API Key: ${CONFIG.DIFY_API_KEY ? '已设置' : '未设置'}
- GitLab Token: ${CONFIG.GITLAB_TOKEN ? '已设置' : '未设置'}

请选择要设置的项目：
1. DIFY API Key
2. GitLab Personal Access Token
3. 清除所有设置`;

            const choice = prompt(settings);

            if (choice === '1') {
                const currentKey = GM_getValue('dify_api_key', '');
                const newKey = prompt('请输入 DIFY API Key:', currentKey);
                if (newKey !== null) {
                    GM_setValue('dify_api_key', newKey);
                    CONFIG.DIFY_API_KEY = newKey;
                    alert('DIFY API Key 已保存');
                }
            } else if (choice === '2') {
                const currentToken = GM_getValue('gitlab_token', '');
                const newToken = prompt('请输入 GitLab Personal Access Token:', currentToken);
                if (newToken !== null) {
                    GM_setValue('gitlab_token', newToken);
                    CONFIG.GITLAB_TOKEN = newToken;
                    alert('GitLab Token 已保存');
                }
            } else if (choice === '3') {
                if (confirm('确定要清除所有设置吗？')) {
                    GM_setValue('dify_api_key', '');
                    GM_setValue('gitlab_token', '');
                    CONFIG.DIFY_API_KEY = '';
                    CONFIG.GITLAB_TOKEN = '';
                    alert('所有设置已清除');
                }
            }
        });

        return button;
    }

    // 初始化
    function init() {
        if (!isGitLabMRPage()) {
            return;
        }

        if (document.getElementById(CONFIG.SETTING_BTN_ID)) {
            return;
        }

        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // 延迟执行以确保 GitLab 页面完全加载
        setTimeout(() => {
            insertButton();

            // 同时插入设置按钮
            const targetElements = [
                '.merge-request-actions',
                '.issuable-actions',
                '.detail-page-header-actions'
            ];

            for (const selector of targetElements) {
                const target = document.querySelector(selector);
                if (target) {
                    const settingsButton = createSettingsButton();
                    target.appendChild(settingsButton);
                    break;
                }
            }
        }, 2000);
    }

    // 监听页面变化（GitLab 使用 SPA）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            if (isGitLabMRPage()) {
                setTimeout(init, 1000);
            }
        }
    }).observe(document, {subtree: true, childList: true});

    // 启动
    init();
})();