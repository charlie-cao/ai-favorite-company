// 简化版AI配置管理
class SimpleAIConfig {
    constructor() {
        this.apiBase = '/api';
        this.selectedModel = null;
        this.availableModels = [];
        this.currentConfig = null;
        
        this.initializeElements();
        this.bindEvents();
        this.checkCurrentConfig();
    }
    
    initializeElements() {
        this.elements = {
            // 状态指示器
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            checkOllamaBtn: document.getElementById('checkOllamaBtn'),
            ollamaInfo: document.getElementById('ollamaInfo'),
            ollamaStatus: document.getElementById('ollamaStatus'),
            modelCount: document.getElementById('modelCount'),
            
            // 模型选择
            modelSection: document.getElementById('modelSection'),
            modelList: document.getElementById('modelList'),
            
            // 测试和保存
            testSection: document.getElementById('testSection'),
            testPrompt: document.getElementById('testPrompt'),
            testModelBtn: document.getElementById('testModelBtn'),
            testResult: document.getElementById('testResult'),
            testOutput: document.getElementById('testOutput'),
            selectedModelName: document.getElementById('selectedModelName'),
            saveConfigBtn: document.getElementById('saveConfigBtn'),
            
            // 当前配置
            currentConfig: document.getElementById('currentConfig'),
            currentConfigName: document.getElementById('currentConfigName'),
            currentModelName: document.getElementById('currentModelName'),
            currentBaseUrl: document.getElementById('currentBaseUrl'),
            reconfigureBtn: document.getElementById('reconfigureBtn')
        };
    }
    
    bindEvents() {
        this.elements.checkOllamaBtn.addEventListener('click', () => this.checkOllama());
        this.elements.testModelBtn.addEventListener('click', () => this.testModel());
        this.elements.saveConfigBtn.addEventListener('click', () => this.saveConfig());
        this.elements.reconfigureBtn.addEventListener('click', () => this.reconfigure());
        
        // 回车测试
        this.elements.testPrompt.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.testModel();
            }
        });
    }
    
    async checkCurrentConfig() {
        try {
            const response = await fetch(`${this.apiBase}/ai/configs`);
            if (response.ok) {
                const result = await response.json();
                const configs = result.data.configs || [];
                const activeConfig = configs.find(config => config.is_active && config.type === 'ollama');
                
                if (activeConfig) {
                    this.currentConfig = activeConfig;
                    this.showCurrentConfig();
                }
            }
        } catch (error) {
            console.log('检查当前配置失败:', error);
        }
    }
    
    showCurrentConfig() {
        if (this.currentConfig) {
            this.elements.currentConfigName.textContent = this.currentConfig.name;
            this.elements.currentModelName.textContent = this.currentConfig.model;
            this.elements.currentBaseUrl.textContent = this.currentConfig.base_url;
            this.elements.currentConfig.classList.remove('hidden');
            
            // 隐藏配置步骤
            this.hideConfigSteps();
        }
    }
    
    hideConfigSteps() {
        this.elements.modelSection.classList.add('hidden');
        this.elements.testSection.classList.add('hidden');
    }
    
    reconfigure() {
        this.elements.currentConfig.classList.add('hidden');
        this.currentConfig = null;
        this.reset();
    }
    
    reset() {
        this.updateStatus('disconnected', '未检测');
        this.elements.ollamaInfo.classList.add('hidden');
        this.elements.modelSection.classList.add('hidden');
        this.elements.testSection.classList.add('hidden');
        this.selectedModel = null;
        this.availableModels = [];
    }
    
    updateStatus(status, text) {
        this.elements.statusIndicator.className = `status-indicator status-${status}`;
        this.elements.statusText.textContent = text;
    }
    
    async checkOllama() {
        this.updateStatus('checking', '检测中...');
        this.elements.checkOllamaBtn.disabled = true;
        this.elements.checkOllamaBtn.textContent = '检测中...';
        
        try {
            const response = await fetch(`${this.apiBase}/ai/test-ollama`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_url: 'http://localhost:11434'
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.updateStatus('connected', 'Ollama运行正常');
                this.availableModels = result.data.available_models || [];
                
                // 显示Ollama信息
                this.elements.ollamaStatus.textContent = '正常运行';
                this.elements.modelCount.textContent = this.availableModels.length;
                this.elements.ollamaInfo.classList.remove('hidden');
                
                // 显示模型选择
                this.showModelSelection();
                
            } else {
                throw new Error(result.message || '连接失败');
            }
            
        } catch (error) {
            console.error('检测Ollama失败:', error);
            this.updateStatus('disconnected', '连接失败');
            this.showError('Ollama连接失败: ' + error.message + '\n\n请确保:\n1. Ollama已安装并启动\n2. 运行命令: ollama serve\n3. 服务地址: http://localhost:11434');
        } finally {
            this.elements.checkOllamaBtn.disabled = false;
            this.elements.checkOllamaBtn.textContent = '重新检测';
        }
    }
    
    showModelSelection() {
        if (this.availableModels.length === 0) {
            this.elements.modelList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <p>没有找到可用的模型</p>
                    <p class="text-sm mt-2">请先下载模型，例如: <code class="bg-gray-100 px-2 py-1 rounded">ollama pull llama2</code></p>
                </div>
            `;
        } else {
            const modelHtml = this.availableModels.map(model => `
                <div class="model-item p-4 rounded-lg cursor-pointer" data-model="${model}">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-medium text-gray-900">${model}</h4>
                            <p class="text-sm text-gray-600">点击选择此模型</p>
                        </div>
                        <div class="model-selector hidden">
                            <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            `).join('');
            
            this.elements.modelList.innerHTML = modelHtml;
            
            // 绑定模型选择事件
            this.elements.modelList.querySelectorAll('.model-item').forEach(item => {
                item.addEventListener('click', () => this.selectModel(item.dataset.model));
            });
        }
        
        this.elements.modelSection.classList.remove('hidden');
    }
    
    selectModel(modelName) {
        // 移除之前的选择
        this.elements.modelList.querySelectorAll('.model-item').forEach(item => {
            item.classList.remove('selected');
            item.querySelector('.model-selector').classList.add('hidden');
        });
        
        // 选择新模型
        const selectedItem = this.elements.modelList.querySelector(`[data-model="${modelName}"]`);
        selectedItem.classList.add('selected');
        selectedItem.querySelector('.model-selector').classList.remove('hidden');
        
        this.selectedModel = modelName;
        this.elements.selectedModelName.textContent = modelName;
        
        // 显示测试区域
        this.elements.testSection.classList.remove('hidden');
        
        // 自动设置测试提示词
        this.elements.testPrompt.value = '你好，请简单介绍一下你自己';
        
        console.log('选择模型:', modelName);
    }
    
    async testModel() {
        if (!this.selectedModel) {
            this.showError('请先选择一个模型');
            return;
        }
        
        const prompt = this.elements.testPrompt.value.trim();
        if (!prompt) {
            this.showError('请输入测试消息');
            return;
        }
        
        this.elements.testModelBtn.disabled = true;
        this.elements.testModelBtn.textContent = '测试中...';
        this.elements.testResult.classList.add('hidden');
        
        try {
            // 创建临时配置进行测试
            const testConfig = {
                name: 'temp_test',
                type: 'ollama',
                base_url: 'http://localhost:11434',
                model: this.selectedModel,
                max_tokens: 512,
                temperature: 0.7,
                is_active: true
            };
            
            // 先创建临时配置
            await fetch(`${this.apiBase}/ai/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testConfig)
            });
            
            // 测试模型
            const response = await fetch(`${this.apiBase}/ai/test`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    config_name: 'temp_test',
                    prompt: prompt
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.elements.testOutput.textContent = result.data.response;
                this.elements.testResult.classList.remove('hidden');
            } else {
                throw new Error(result.detail || result.message || '测试失败');
            }
            
        } catch (error) {
            console.error('测试模型失败:', error);
            this.showError('模型测试失败: ' + error.message);
        } finally {
            this.elements.testModelBtn.disabled = false;
            this.elements.testModelBtn.textContent = '重新测试';
            
            // 清理临时配置
            try {
                await fetch(`${this.apiBase}/ai/configs/temp_test`, { method: 'DELETE' });
            } catch (e) {
                console.log('清理临时配置失败:', e);
            }
        }
    }
    
    async saveConfig() {
        if (!this.selectedModel) {
            this.showError('请先选择一个模型');
            return;
        }
        
        this.elements.saveConfigBtn.disabled = true;
        this.elements.saveConfigBtn.textContent = '保存中...';
        
        try {
            // 先删除现有的ollama配置
            const existingResponse = await fetch(`${this.apiBase}/ai/configs`);
            if (existingResponse.ok) {
                const existingResult = await existingResponse.json();
                const existingConfigs = existingResult.data.configs || [];
                
                for (const config of existingConfigs) {
                    if (config.type === 'ollama') {
                        await fetch(`${this.apiBase}/ai/configs/${config.name}`, { method: 'DELETE' });
                    }
                }
            }
            
            // 创建新配置
            const newConfig = {
                name: 'Ollama默认配置',
                type: 'ollama',
                base_url: 'http://localhost:11434',
                model: this.selectedModel,
                max_tokens: 2048,
                temperature: 0.7,
                is_active: true
            };
            
            const response = await fetch(`${this.apiBase}/ai/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.currentConfig = newConfig;
                this.showSuccess('AI配置保存成功！现在可以使用AI功能了。');
                
                // 显示当前配置状态
                setTimeout(() => {
                    this.showCurrentConfig();
                }, 1500);
            } else {
                throw new Error(result.detail || result.message || '保存失败');
            }
            
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showError('保存配置失败: ' + error.message);
        } finally {
            this.elements.saveConfigBtn.disabled = false;
            this.elements.saveConfigBtn.textContent = '保存配置';
        }
    }
    
    showSuccess(message) {
        alert('✅ ' + message);
    }
    
    showError(message) {
        alert('❌ ' + message);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SimpleAIConfig();
});