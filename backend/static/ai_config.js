// AI配置管理系统前端JS
class AIConfigManager {
    constructor() {
        this.apiBase = '/api';
        this.currentConfigs = [];
        this.currentAgents = [];
        this.isEditing = false;
        this.editingConfigName = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadData();
    }
    
    initializeElements() {
        this.elements = {
            // 标签页
            configTab: document.getElementById('configTab'),
            agentTab: document.getElementById('agentTab'),
            testTab: document.getElementById('testTab'),
            
            // 面板
            configPanel: document.getElementById('configPanel'),
            agentPanel: document.getElementById('agentPanel'),
            testPanel: document.getElementById('testPanel'),
            
            // 配置管理
            addConfigBtn: document.getElementById('addConfigBtn'),
            configList: document.getElementById('configList'),
            configModal: document.getElementById('configModal'),
            configForm: document.getElementById('configForm'),
            configModalTitle: document.getElementById('configModalTitle'),
            configSaveBtn: document.getElementById('configSaveBtn'),
            configCancelBtn: document.getElementById('configCancelBtn'),
            
            // Agent管理
            addAgentBtn: document.getElementById('addAgentBtn'),
            agentList: document.getElementById('agentList'),
            agentModal: document.getElementById('agentModal'),
            agentForm: document.getElementById('agentForm'),
            agentModalTitle: document.getElementById('agentModalTitle'),
            agentSaveBtn: document.getElementById('agentSaveBtn'),
            agentCancelBtn: document.getElementById('agentCancelBtn'),
            
            // 测试工具
            ollamaTestForm: document.getElementById('ollamaTestForm'),
            ollamaTestResult: document.getElementById('ollamaTestResult'),
            aiTestForm: document.getElementById('aiTestForm'),
            aiTestResult: document.getElementById('aiTestResult'),
            aiConfigSelect: document.getElementById('aiConfigSelect')
        };
    }
    
    bindEvents() {
        // 标签页切换
        this.elements.configTab.addEventListener('click', () => this.switchTab('config'));
        this.elements.agentTab.addEventListener('click', () => this.switchTab('agent'));
        this.elements.testTab.addEventListener('click', () => this.switchTab('test'));
        
        // 配置管理
        this.elements.addConfigBtn.addEventListener('click', () => this.showConfigModal());
        this.elements.configSaveBtn.addEventListener('click', () => this.saveConfig());
        this.elements.configCancelBtn.addEventListener('click', () => this.hideConfigModal());
        
        // Agent管理
        this.elements.addAgentBtn.addEventListener('click', () => this.showAgentModal());
        this.elements.agentSaveBtn.addEventListener('click', () => this.saveAgent());
        this.elements.agentCancelBtn.addEventListener('click', () => this.hideAgentModal());
        
        // 测试工具
        this.elements.ollamaTestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.testOllamaConnection();
        });
        this.elements.aiTestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.testAIModel();
        });
        
        // 模态框点击外部关闭
        this.elements.configModal.addEventListener('click', (e) => {
            if (e.target === this.elements.configModal) {
                this.hideConfigModal();
            }
        });
        this.elements.agentModal.addEventListener('click', (e) => {
            if (e.target === this.elements.agentModal) {
                this.hideAgentModal();
            }
        });
    }
    
    switchTab(tab) {
        // 重置所有标签
        const tabs = [this.elements.configTab, this.elements.agentTab, this.elements.testTab];
        const panels = [this.elements.configPanel, this.elements.agentPanel, this.elements.testPanel];
        
        tabs.forEach(t => t.classList.remove('tab-active'));
        panels.forEach(p => p.classList.add('hidden'));
        
        // 激活选中的标签
        switch(tab) {
            case 'config':
                this.elements.configTab.classList.add('tab-active');
                this.elements.configPanel.classList.remove('hidden');
                break;
            case 'agent':
                this.elements.agentTab.classList.add('tab-active');
                this.elements.agentPanel.classList.remove('hidden');
                this.loadAgents();
                break;
            case 'test':
                this.elements.testTab.classList.add('tab-active');
                this.elements.testPanel.classList.remove('hidden');
                this.updateTestConfigSelect();
                break;
        }
    }
    
    async loadData() {
        console.log('开始加载AI配置数据...');
        try {
            await this.loadConfigs();
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('加载数据失败: ' + error.message);
        }
    }
    
    async loadConfigs() {
        try {
            const response = await fetch(`${this.apiBase}/ai/configs`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.currentConfigs = result.data.configs || [];
            this.renderConfigList();
            this.updateTestConfigSelect();
            
            console.log('AI配置加载完成:', this.currentConfigs.length, '个配置');
        } catch (error) {
            console.error('加载AI配置失败:', error);
            throw error;
        }
    }
    
    async loadAgents() {
        try {
            const response = await fetch(`${this.apiBase}/ai/agents`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            this.currentAgents = result.data.templates || [];
            this.renderAgentList();
            
            console.log('Agent模板加载完成:', this.currentAgents.length, '个模板');
        } catch (error) {
            console.error('加载Agent模板失败:', error);
            this.showError('加载Agent模板失败: ' + error.message);
        }
    }
    
    renderConfigList() {
        if (this.currentConfigs.length === 0) {
            this.elements.configList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-500 mb-4">
                        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500">暂无AI配置</p>
                    <p class="text-sm text-gray-400 mt-1">点击"添加配置"开始配置你的AI模型</p>
                </div>
            `;
            return;
        }
        
        const html = this.currentConfigs.map(config => `
            <div class="bg-white rounded-lg shadow-md p-6 config-card ${config.is_active ? '' : 'inactive'}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(config.name)}</h3>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${config.is_active ? '已启用' : '已禁用'}
                            </span>
                            <span class="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                ${config.type.toUpperCase()}
                            </span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <span class="font-medium">服务地址:</span> ${this.escapeHtml(config.base_url)}
                            </div>
                            <div>
                                <span class="font-medium">模型:</span> ${this.escapeHtml(config.model)}
                            </div>
                            <div>
                                <span class="font-medium">最大Token:</span> ${config.max_tokens}
                            </div>
                            <div>
                                <span class="font-medium">温度:</span> ${config.temperature}
                            </div>
                        </div>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="aiConfigManager.editConfig('${config.name}')" 
                                class="text-blue-600 hover:text-blue-800 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="aiConfigManager.deleteConfig('${config.name}')" 
                                class="text-red-600 hover:text-red-800 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.elements.configList.innerHTML = html;
    }
    
    renderAgentList() {
        if (this.currentAgents.length === 0) {
            this.elements.agentList.innerHTML = `
                <div class="text-center py-8">
                    <div class="text-gray-500 mb-4">
                        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                    <p class="text-gray-500">暂无Agent模板</p>
                    <p class="text-sm text-gray-400 mt-1">点击"添加模板"创建你的第一个AI Agent</p>
                </div>
            `;
            return;
        }
        
        const html = this.currentAgents.map(agent => `
            <div class="bg-white rounded-lg shadow-md p-6">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <h3 class="text-lg font-semibold text-gray-900">${this.escapeHtml(agent.name)}</h3>
                            <span class="ml-2 px-2 py-1 text-xs rounded-full ${agent.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                ${agent.is_active ? '已启用' : '已禁用'}
                            </span>
                        </div>
                        <p class="text-gray-600 mb-3">${this.escapeHtml(agent.description)}</p>
                        <div class="text-sm text-gray-600 mb-3">
                            <span class="font-medium">关联配置:</span> 
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">${this.escapeHtml(agent.ai_config)}</span>
                        </div>
                        <details class="text-sm">
                            <summary class="cursor-pointer text-gray-700 font-medium">查看提示词</summary>
                            <div class="mt-2 space-y-2">
                                <div>
                                    <span class="font-medium text-gray-700">系统提示词:</span>
                                    <pre class="mt-1 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">${this.escapeHtml(agent.system_prompt)}</pre>
                                </div>
                                <div>
                                    <span class="font-medium text-gray-700">用户模板:</span>
                                    <pre class="mt-1 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">${this.escapeHtml(agent.user_prompt_template)}</pre>
                                </div>
                            </div>
                        </details>
                    </div>
                    <div class="flex space-x-2 ml-4">
                        <button onclick="aiConfigManager.editAgent('${agent.name}')" 
                                class="text-blue-600 hover:text-blue-800 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                        </button>
                        <button onclick="aiConfigManager.deleteAgent('${agent.name}')" 
                                class="text-red-600 hover:text-red-800 p-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        this.elements.agentList.innerHTML = html;
    }
    
    updateTestConfigSelect() {
        const activeConfigs = this.currentConfigs.filter(config => config.is_active);
        const options = activeConfigs.map(config => 
            `<option value="${config.name}">${config.name} (${config.type})</option>`
        ).join('');
        
        this.elements.aiConfigSelect.innerHTML = `
            <option value="">请选择AI配置</option>
            ${options}
        `;
    }
    
    showConfigModal(configName = null) {
        this.isEditing = !!configName;
        this.editingConfigName = configName;
        
        this.elements.configModalTitle.textContent = this.isEditing ? '编辑AI配置' : '添加AI配置';
        
        if (this.isEditing) {
            const config = this.currentConfigs.find(c => c.name === configName);
            if (config) {
                document.getElementById('configName').value = config.name;
                document.getElementById('configType').value = config.type;
                document.getElementById('configBaseUrl').value = config.base_url;
                document.getElementById('configApiKey').value = '';
                document.getElementById('configModel').value = config.model;
                document.getElementById('configMaxTokens').value = config.max_tokens;
                document.getElementById('configTemperature').value = config.temperature;
                document.getElementById('configIsActive').checked = config.is_active;
                
                // 编辑时禁用名称修改
                document.getElementById('configName').disabled = true;
            }
        } else {
            this.elements.configForm.reset();
            document.getElementById('configName').disabled = false;
            document.getElementById('configMaxTokens').value = 2048;
            document.getElementById('configTemperature').value = 0.7;
            document.getElementById('configIsActive').checked = true;
        }
        
        this.elements.configModal.classList.remove('hidden');
    }
    
    hideConfigModal() {
        this.elements.configModal.classList.add('hidden');
        this.isEditing = false;
        this.editingConfigName = null;
    }
    
    async saveConfig() {
        try {
            const formData = new FormData(this.elements.configForm);
            const config = {
                name: document.getElementById('configName').value,
                type: document.getElementById('configType').value,
                base_url: document.getElementById('configBaseUrl').value,
                api_key: document.getElementById('configApiKey').value || null,
                model: document.getElementById('configModel').value,
                max_tokens: parseInt(document.getElementById('configMaxTokens').value),
                temperature: parseFloat(document.getElementById('configTemperature').value),
                is_active: document.getElementById('configIsActive').checked
            };
            
            let response;
            if (this.isEditing) {
                response = await fetch(`${this.apiBase}/ai/configs/${this.editingConfigName}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
            } else {
                response = await fetch(`${this.apiBase}/ai/configs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });
            }
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.showSuccess(result.message);
            this.hideConfigModal();
            await this.loadConfigs();
            
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showError('保存配置失败: ' + error.message);
        }
    }
    
    async editConfig(configName) {
        this.showConfigModal(configName);
    }
    
    async deleteConfig(configName) {
        if (!confirm(`确定要删除配置 "${configName}" 吗？`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/ai/configs/${configName}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.showSuccess(result.message);
            await this.loadConfigs();
            
        } catch (error) {
            console.error('删除配置失败:', error);
            this.showError('删除配置失败: ' + error.message);
        }
    }
    
    showAgentModal() {
        this.elements.agentModalTitle.textContent = '添加Agent模板';
        
        // 更新AI配置选项
        const activeConfigs = this.currentConfigs.filter(config => config.is_active);
        const options = activeConfigs.map(config => 
            `<option value="${config.name}">${config.name} (${config.type})</option>`
        ).join('');
        
        document.getElementById('agentModelConfig').innerHTML = `
            <option value="">请选择AI配置</option>
            ${options}
        `;
        
        this.elements.agentForm.reset();
        document.getElementById('agentIsActive').checked = true;
        this.elements.agentModal.classList.remove('hidden');
    }
    
    hideAgentModal() {
        this.elements.agentModal.classList.add('hidden');
    }
    
    async saveAgent() {
        try {
            const agent = {
                name: document.getElementById('agentName').value,
                description: document.getElementById('agentDescription').value,
                ai_config: document.getElementById('agentModelConfig').value,
                system_prompt: document.getElementById('agentSystemPrompt').value,
                user_prompt_template: document.getElementById('agentUserPrompt').value,
                is_active: document.getElementById('agentIsActive').checked
            };
            
            const response = await fetch(`${this.apiBase}/ai/agents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agent)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || `HTTP ${response.status}`);
            }
            
            const result = await response.json();
            this.showSuccess(result.message);
            this.hideAgentModal();
            await this.loadAgents();
            
        } catch (error) {
            console.error('保存Agent模板失败:', error);
            this.showError('保存Agent模板失败: ' + error.message);
        }
    }
    
    async editAgent(agentName) {
        // TODO: 实现Agent编辑功能
        this.showInfo('Agent编辑功能暂未实现');
    }
    
    async deleteAgent(agentName) {
        // TODO: 实现Agent删除功能
        this.showInfo('Agent删除功能暂未实现');
    }
    
    async testOllamaConnection() {
        const url = document.getElementById('ollamaUrl').value;
        const model = document.getElementById('ollamaModel').value;
        
        if (!url) {
            this.showError('请输入Ollama服务地址');
            return;
        }
        
        try {
            this.showTestLoading('ollamaTestResult', '正在测试Ollama连接...');
            
            const response = await fetch(`${this.apiBase}/ai/test-ollama`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_url: url,
                    model: model || null
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showTestResult('ollamaTestResult', result.data, true);
            } else {
                this.showTestResult('ollamaTestResult', { error: result.detail }, false);
            }
            
        } catch (error) {
            console.error('测试Ollama连接失败:', error);
            this.showTestResult('ollamaTestResult', { error: error.message }, false);
        }
    }
    
    async testAIModel() {
        const configName = document.getElementById('aiConfigSelect').value;
        const prompt = document.getElementById('aiTestPrompt').value;
        
        if (!configName) {
            this.showError('请选择AI配置');
            return;
        }
        
        if (!prompt) {
            this.showError('请输入测试提示词');
            return;
        }
        
        try {
            this.showTestLoading('aiTestResult', '正在测试AI模型...');
            
            const response = await fetch(`${this.apiBase}/ai/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: configName,
                    prompt: prompt
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                this.showTestResult('aiTestResult', result.data, true);
            } else {
                this.showTestResult('aiTestResult', { error: result.detail }, false);
            }
            
        } catch (error) {
            console.error('测试AI模型失败:', error);
            this.showTestResult('aiTestResult', { error: error.message }, false);
        }
    }
    
    showTestLoading(resultId, message) {
        const resultDiv = document.getElementById(resultId);
        resultDiv.classList.remove('hidden');
        resultDiv.querySelector('.test-output').innerHTML = `
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                ${message}
            </div>
        `;
    }
    
    showTestResult(resultId, data, success) {
        const resultDiv = document.getElementById(resultId);
        const outputDiv = resultDiv.querySelector('.test-output');
        
        if (success) {
            outputDiv.innerHTML = `
                <div class="text-green-600 font-medium mb-2">✅ 测试成功</div>
                <pre class="text-sm whitespace-pre-wrap">${JSON.stringify(data, null, 2)}</pre>
            `;
        } else {
            outputDiv.innerHTML = `
                <div class="text-red-600 font-medium mb-2">❌ 测试失败</div>
                <pre class="text-sm text-red-700 whitespace-pre-wrap">${JSON.stringify(data, null, 2)}</pre>
            `;
        }
    }
    
    showSuccess(message) {
        alert(`✅ ${message}`);
    }
    
    showError(message) {
        alert(`❌ ${message}`);
    }
    
    showInfo(message) {
        alert(`ℹ️ ${message}`);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 初始化应用
let aiConfigManager;
document.addEventListener('DOMContentLoaded', () => {
    aiConfigManager = new AIConfigManager();
});