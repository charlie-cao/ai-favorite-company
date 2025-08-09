// AI Agent工作台管理系统
class AgentsHub {
    constructor() {
        this.apiBase = '/api';
        this.currentConfig = null;
        
        this.initializeElements();
        this.bindEvents();
        this.checkAIConfig();
    }
    
    initializeElements() {
        this.elements = {
            // 浏览记录分析师
            analysisRange: document.getElementById('analysisRange'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            analysisResult: document.getElementById('analysisResult'),
            analysisOutput: document.getElementById('analysisOutput'),
            
            // 内容创作助手
            contentUrl: document.getElementById('contentUrl'),
            contentStyle: document.getElementById('contentStyle'),
            targetAudience: document.getElementById('targetAudience'),
            contentLength: document.getElementById('contentLength'),
            createBtn: document.getElementById('createBtn'),
            creationResult: document.getElementById('creationResult'),
            creationOutput: document.getElementById('creationOutput'),
            copyBtn: document.getElementById('copyBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            
            // 状态指示器
            workingIndicator: document.getElementById('workingIndicator'),
            workingText: document.getElementById('workingText')
        };
    }
    
    bindEvents() {
        // 浏览记录分析
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeHistory());
        
        // 内容创作
        this.elements.createBtn.addEventListener('click', () => this.createContent());
        this.elements.copyBtn.addEventListener('click', () => this.copyContent());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadContent());
        
        // 回车快捷键
        this.elements.contentUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createContent();
            }
        });
    }
    
    async checkAIConfig() {
        try {
            const response = await fetch(`${this.apiBase}/ai/configs`);
            if (response.ok) {
                const result = await response.json();
                const configs = result.data.configs || [];
                this.currentConfig = configs.find(config => config.is_active && config.type === 'ollama');
                
                if (!this.currentConfig) {
                    this.showError('请先配置AI模型', '需要先在AI配置页面设置Ollama模型才能使用Agent功能。', () => {
                        window.location.href = '/ai';
                    });
                }
            }
        } catch (error) {
            console.error('检查AI配置失败:', error);
        }
    }
    
    async analyzeHistory() {
        if (!this.currentConfig) {
            this.showError('AI配置未就绪', '请先配置AI模型');
            return;
        }
        
        const range = this.elements.analysisRange.value;
        const depth = document.querySelector('input[name="analysisDepth"]:checked').value;
        
        this.elements.analyzeBtn.disabled = true;
        this.elements.analyzeBtn.textContent = '分析中...';
        this.showWorking('正在分析浏览记录...');
        
        try {
            // 获取历史记录数据
            const historyResponse = await fetch(`${this.apiBase}/history?limit=1000&offset=0`);
            if (!historyResponse.ok) {
                throw new Error('无法获取历史记录数据');
            }
            
            const historyResult = await historyResponse.json();
            const historyData = historyResult.data.records || [];
            
            if (historyData.length === 0) {
                throw new Error('没有找到历史记录数据，请先同步浏览记录');
            }
            
            // 根据时间范围过滤数据
            const filteredData = this.filterDataByRange(historyData, range);
            
            // 构建分析提示词
            const analysisPrompt = this.buildAnalysisPrompt(filteredData, depth);
            
            // 调用AI分析
            const aiResponse = await fetch(`${this.apiBase}/ai/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: this.currentConfig.name,
                    prompt: analysisPrompt
                })
            });
            
            if (!aiResponse.ok) {
                const error = await aiResponse.json();
                throw new Error(error.detail || 'AI分析失败');
            }
            
            const aiResult = await aiResponse.json();
            
            // 显示分析结果
            this.displayAnalysisResult(aiResult.data.response, filteredData.length);
            
        } catch (error) {
            console.error('分析失败:', error);
            this.showError('分析失败', error.message);
        } finally {
            this.elements.analyzeBtn.disabled = false;
            this.elements.analyzeBtn.textContent = '开始分析';
            this.hideWorking();
        }
    }
    
    filterDataByRange(data, range) {
        const now = new Date();
        let cutoffTime;
        
        switch (range) {
            case 'week':
                cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'quarter':
                cutoffTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                return data;
        }
        
        return data.filter(item => new Date(item.visitTime) >= cutoffTime);
    }
    
    buildAnalysisPrompt(data, depth) {
        // 提取网站域名和标题
        const sites = data.map(item => ({
            domain: this.extractDomain(item.url),
            title: item.title || '无标题',
            url: item.url,
            visitCount: item.visitCount || 1
        }));
        
        // 统计域名频率
        const domainStats = {};
        sites.forEach(site => {
            domainStats[site.domain] = (domainStats[site.domain] || 0) + site.visitCount;
        });
        
        // 获取高频域名
        const topDomains = Object.entries(domainStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20)
            .map(([domain, count]) => `${domain} (${count}次)`);
        
        // 获取标题关键词
        const titles = sites.map(s => s.title).filter(t => t !== '无标题');
        
        const prompt = `作为专业的数据分析师，请分析以下浏览历史数据：

=== 数据概览 ===
总访问记录: ${data.length} 条
时间范围: ${this.elements.analysisRange.options[this.elements.analysisRange.selectedIndex].text}
分析深度: ${depth === 'deep' ? '深度分析' : '基础分析'}

=== 高频访问网站 ===
${topDomains.join('\n')}

=== 页面标题样本 ===
${titles.slice(0, 30).join('\n')}

请提供以下分析：

1. **用户画像分析**
   - 主要兴趣领域和偏好
   - 职业/身份特征推测
   - 生活习惯和时间模式

2. **内容偏好总结**
   - 访问最频繁的网站类型
   - 关注的主题和话题
   - 内容消费习惯

3. **兴趣标签词云** (请用中文，按重要性排序)
   格式：[高频] 关键词1, 关键词2 | [中频] 关键词3, 关键词4 | [低频] 关键词5, 关键词6

4. **行为模式洞察**
   - 浏览行为特点
   - 信息获取方式
   - 潜在需求和痛点

5. **个性化建议**
   - 内容推荐方向
   - 学习成长建议
   - 效率优化建议

请用专业但易懂的语言，提供有价值的洞察和建议。`;

        return prompt;
    }
    
    displayAnalysisResult(response, dataCount) {
        this.elements.analysisResult.classList.remove('hidden');
        
        // 解析和格式化AI响应
        const formattedResponse = this.formatAnalysisResponse(response);
        
        this.elements.analysisOutput.innerHTML = `
            <div class="space-y-6">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-2">📊 分析概要</h4>
                    <p class="text-blue-800 text-sm">
                        基于 <span class="font-semibold">${dataCount}</span> 条浏览记录的深度分析结果
                    </p>
                </div>
                <div class="prose max-w-none">
                    ${formattedResponse}
                </div>
                <div class="flex space-x-2 pt-4 border-t">
                    <button onclick="agentsHub.shareAnalysis()" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                        分享分析
                    </button>
                    <button onclick="agentsHub.exportAnalysis()" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                        导出报告
                    </button>
                </div>
            </div>
        `;
    }
    
    formatAnalysisResponse(response) {
        // 简单的格式化处理
        let formatted = response
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 处理词云标签
        formatted = formatted.replace(/\[高频\](.*?)\|/g, '<div class="tag-cloud mb-4"><span class="text-sm font-medium text-gray-700">高频标签：</span>$1</div>');
        formatted = formatted.replace(/\[中频\](.*?)\|/g, '<div class="tag-cloud mb-4"><span class="text-sm font-medium text-gray-700">中频标签：</span>$1</div>');
        formatted = formatted.replace(/\[低频\](.*?)$/g, '<div class="tag-cloud mb-4"><span class="text-sm font-medium text-gray-700">低频标签：</span>$1</div>');
        
        return `<p>${formatted}</p>`;
    }
    
    async createContent() {
        if (!this.currentConfig) {
            this.showError('AI配置未就绪', '请先配置AI模型');
            return;
        }
        
        const url = this.elements.contentUrl.value.trim();
        const style = this.elements.contentStyle.value;
        const audience = this.elements.targetAudience.value.trim();
        const length = this.elements.contentLength.value;
        
        if (!url) {
            this.showError('请输入网页链接', '需要基于具体的网页内容进行创作');
            return;
        }
        
        if (!this.isValidUrl(url)) {
            this.showError('请输入有效的网页链接', '链接格式不正确，请检查后重试');
            return;
        }
        
        this.elements.createBtn.disabled = true;
        this.elements.createBtn.textContent = '创作中...';
        this.showWorking('正在分析网页内容并创作...');
        
        try {
            // 构建创作提示词
            const creationPrompt = this.buildCreationPrompt(url, style, audience, length);
            
            // 调用AI创作
            const aiResponse = await fetch(`${this.apiBase}/ai/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: this.currentConfig.name,
                    prompt: creationPrompt
                })
            });
            
            if (!aiResponse.ok) {
                const error = await aiResponse.json();
                throw new Error(error.detail || 'AI创作失败');
            }
            
            const aiResult = await aiResponse.json();
            
            // 显示创作结果
            this.displayCreationResult(aiResult.data.response, url, style);
            
        } catch (error) {
            console.error('创作失败:', error);
            this.showError('创作失败', error.message);
        } finally {
            this.elements.createBtn.disabled = false;
            this.elements.createBtn.textContent = '开始创作';
            this.hideWorking();
        }
    }
    
    buildCreationPrompt(url, style, audience, length) {
        const styleMap = {
            'marketing': '营销推广文，突出产品优势和价值，包含强烈的行动召唤',
            'review': '产品评测文，客观分析优缺点，提供购买建议',
            'tutorial': '教程指南文，步骤清晰，实用性强',
            'news': '新闻报道文，客观中立，信息丰富',
            'story': '故事叙述文，情节生动，引人入胜'
        };
        
        const lengthMap = {
            'short': '500-800字的短文',
            'medium': '800-1500字的中等长度文章',
            'long': '1500-3000字的深度长文'
        };
        
        const prompt = `作为专业的内容创作专家，请基于以下网页内容进行二次创作：

=== 创作要求 ===
目标网页: ${url}
文章风格: ${styleMap[style]}
目标受众: ${audience || '普通网络用户'}
文章长度: ${lengthMap[length]}

=== 创作任务 ===
请访问上述网页(如无法访问，请基于URL推测内容)，然后创作一篇${styleMap[style]}。

要求：
1. **标题优化**: 创作3个吸引眼球的标题选项
2. **内容结构**: 清晰的开头、主体、结尾结构
3. **价值输出**: 为读者提供实用价值和洞察
4. **转化优化**: 适当融入行动召唤和转化元素
5. **SEO友好**: 自然融入相关关键词

=== 输出格式 ===
标题选项：
1. [标题1]
2. [标题2] (推荐)
3. [标题3]

正文：
[开头段落 - 吸引注意力]

[主体内容 - 分点论述或叙述]

[结尾段落 - 总结和行动召唤]

关键词标签：#关键词1 #关键词2 #关键词3

创作说明：
[简述创作思路和亮点]

请确保内容原创、有价值，并针对${audience || '目标受众'}进行优化。`;

        return prompt;
    }
    
    displayCreationResult(response, url, style) {
        this.elements.creationResult.classList.remove('hidden');
        
        const formattedResponse = this.formatCreationResponse(response);
        
        this.elements.creationOutput.innerHTML = `
            <div class="space-y-4">
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="font-semibold text-green-900 mb-2">✅ 创作完成</h4>
                    <div class="text-green-800 text-sm space-y-1">
                        <div><span class="font-medium">原始链接:</span> <a href="${url}" target="_blank" class="text-blue-600 hover:underline">${url}</a></div>
                        <div><span class="font-medium">创作风格:</span> ${this.elements.contentStyle.options[this.elements.contentStyle.selectedIndex].text}</div>
                        <div><span class="font-medium">字数统计:</span> 约${this.countWords(response)}字</div>
                    </div>
                </div>
                <div class="prose max-w-none bg-white border rounded-lg p-4">
                    ${formattedResponse}
                </div>
            </div>
        `;
        
        // 滚动到结果区域
        this.elements.creationResult.scrollIntoView({ behavior: 'smooth' });
    }
    
    formatCreationResponse(response) {
        // 格式化AI响应
        let formatted = response
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/#([^\s]+)/g, '<span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">#$1</span>');
        
        return `<div>${formatted}</div>`;
    }
    
    copyContent() {
        const content = this.elements.creationOutput.textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.showSuccess('内容已复制到剪贴板');
            this.elements.copyBtn.textContent = '已复制';
            setTimeout(() => {
                this.elements.copyBtn.textContent = '复制内容';
            }, 2000);
        }).catch(() => {
            this.showError('复制失败', '请手动选择文本复制');
        });
    }
    
    downloadContent() {
        const content = this.elements.creationOutput.textContent;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `AI创作内容_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('文档下载已开始');
    }
    
    // 工具方法
    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url.split('/')[0];
        }
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    }
    
    countWords(text) {
        return text.replace(/\s+/g, '').length;
    }
    
    showWorking(text) {
        this.elements.workingText.textContent = text;
        this.elements.workingIndicator.classList.remove('hidden');
    }
    
    hideWorking() {
        this.elements.workingIndicator.classList.add('hidden');
    }
    
    showSuccess(message) {
        alert('✅ ' + message);
    }
    
    showError(title, message, callback) {
        alert('❌ ' + title + (message ? '\n\n' + message : ''));
        if (callback) callback();
    }
    
    shareAnalysis() {
        const content = this.elements.analysisOutput.textContent;
        if (navigator.share) {
            navigator.share({
                title: '浏览记录分析报告',
                text: content.substring(0, 200) + '...',
                url: window.location.href
            });
        } else {
            this.copyAnalysis();
        }
    }
    
    copyAnalysis() {
        const content = this.elements.analysisOutput.textContent;
        navigator.clipboard.writeText(content).then(() => {
            this.showSuccess('分析结果已复制到剪贴板');
        });
    }
    
    exportAnalysis() {
        const content = this.elements.analysisOutput.textContent;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `浏览记录分析报告_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('分析报告下载已开始');
    }
}

// 初始化应用
let agentsHub;
document.addEventListener('DOMContentLoaded', () => {
    agentsHub = new AgentsHub();
});