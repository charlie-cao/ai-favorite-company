class AgentStudio {
    constructor() {
        this.contentTasks = [];
        this.publishingData = {};
        this.academicWorks = [];
        
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // 批量内容生成表单
        document.getElementById('batchContentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitBatchContentGeneration();
        });

        // 内容发布表单
        document.getElementById('publishingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitContentPublishing();
        });

        // 学术创作表单
        document.getElementById('academicForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAcademicCreation();
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.refreshContentTasks(),
            this.refreshAnalytics(),
            this.refreshAcademicWorks(),
            this.loadContentOptions()
        ]);
    }

    async refreshContentTasks() {
        try {
            const response = await fetch('/api/content/tasks');
            const result = await response.json();
            
            if (result.success) {
                this.contentTasks = result.data.tasks;
                this.updateContentTasksDisplay();
            }
        } catch (error) {
            console.error('加载内容任务失败:', error);
        }
    }

    updateContentTasksDisplay() {
        const container = document.getElementById('contentTasksList');
        container.innerHTML = '';

        if (this.contentTasks.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">暂无内容生成任务</p>';
            return;
        }

        this.contentTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 rounded-lg p-4 border-l-4 ' + this.getTaskBorderColor(task.status);
        
        div.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-gray-900">${task.task_name}</h4>
                <span class="text-xs px-2 py-1 rounded ${this.getTaskStatusClass(task.status)}">${this.getTaskStatusText(task.status)}</span>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>${task.agent_type} | ${task.content_style}</span>
                <span>${task.progress}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div class="bg-blue-600 h-2 rounded-full transition-all" style="width: ${task.progress}%"></div>
            </div>
            <div class="flex justify-between items-center mt-3">
                <span class="text-xs text-gray-500">${this.formatDate(task.created_at)}</span>
                <div class="space-x-2">
                    ${task.status === 'completed' ? 
                        `<button onclick="agentStudio.viewTaskResults(${task.id})" class="text-blue-600 hover:text-blue-800 text-xs">查看结果</button>` : ''
                    }
                    ${task.status === 'failed' ? 
                        `<button onclick="agentStudio.retryTask(${task.id})" class="text-red-600 hover:text-red-800 text-xs">重试</button>` : ''
                    }
                </div>
            </div>
        `;

        return div;
    }

    getTaskBorderColor(status) {
        const colors = {
            'pending': 'border-yellow-400',
            'processing': 'border-blue-400',
            'completed': 'border-green-400',
            'failed': 'border-red-400'
        };
        return colors[status] || 'border-gray-400';
    }

    getTaskStatusClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'processing': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getTaskStatusText(status) {
        const texts = {
            'pending': '等待中',
            'processing': '处理中',
            'completed': '已完成',
            'failed': '失败'
        };
        return texts[status] || '未知';
    }

    async refreshAnalytics() {
        try {
            const response = await fetch('/api/content/analytics');
            const result = await response.json();
            
            if (result.success) {
                this.publishingData = result.data;
                this.updateAnalyticsDisplay();
            }
        } catch (error) {
            console.error('加载发布分析失败:', error);
        }
    }

    updateAnalyticsDisplay() {
        const container = document.getElementById('publishingAnalytics');
        
        if (!this.publishingData.platform_stats || this.publishingData.platform_stats.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">暂无发布数据</p>';
            return;
        }

        let html = '<div class="space-y-4">';
        
        // 平台统计
        html += '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">';
        this.publishingData.platform_stats.forEach(stat => {
            html += `
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-1">
                        <span class="font-medium text-gray-900">${this.getPlatformName(stat.platform)}</span>
                        <span class="text-sm text-gray-600">${stat.count}篇</span>
                    </div>
                    <div class="text-xs text-gray-500">
                        总浏览: ${stat.total_views.toLocaleString()} | 平均互动率: ${(stat.avg_engagement * 100).toFixed(1)}%
                    </div>
                </div>
            `;
        });
        html += '</div>';

        // 最近发布
        if (this.publishingData.recent_posts && this.publishingData.recent_posts.length > 0) {
            html += '<div class="mt-4"><h4 class="font-medium text-gray-900 mb-2">最近发布</h4><div class="space-y-2">';
            this.publishingData.recent_posts.slice(0, 3).forEach(post => {
                html += `
                    <div class="text-sm bg-gray-50 rounded p-2">
                        <div class="flex justify-between items-center">
                            <span class="font-medium">${post.task_name}</span>
                            <span class="text-gray-500">${this.getPlatformName(post.platform)}</span>
                        </div>
                        <div class="text-xs text-gray-600 mt-1">
                            浏览: ${post.view_count} | 互动率: ${(post.engagement_rate * 100).toFixed(1)}%
                        </div>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        html += '</div>';
        container.innerHTML = html;
    }

    getPlatformName(platform) {
        const names = {
            'weibo': '微博',
            'wechat': '微信',
            'zhihu': '知乎',
            'xiaohongshu': '小红书',
            'douyin': '抖音'
        };
        return names[platform] || platform;
    }

    async refreshAcademicWorks() {
        try {
            const response = await fetch('/api/academic/works');
            const result = await response.json();
            
            if (result.success) {
                this.academicWorks = result.data.works;
                this.updateAcademicWorksDisplay();
            }
        } catch (error) {
            console.error('加载学术作品失败:', error);
        }
    }

    updateAcademicWorksDisplay() {
        const container = document.getElementById('academicWorksList');
        container.innerHTML = '';

        if (this.academicWorks.length === 0) {
            container.innerHTML = '<div class="col-span-full"><p class="text-gray-500 text-center py-8">暂无学术作品</p></div>';
            return;
        }

        this.academicWorks.forEach(work => {
            const workElement = this.createAcademicWorkElement(work);
            container.appendChild(workElement);
        });
    }

    createAcademicWorkElement(work) {
        const div = document.createElement('div');
        div.className = 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer';
        div.onclick = () => this.viewAcademicWork(work.id);
        
        div.innerHTML = `
            <div class="flex items-center mb-2">
                <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <span class="text-white text-xs font-bold">${this.getWorkTypeIcon(work.work_type)}</span>
                </div>
                <h4 class="font-medium text-gray-900 text-sm truncate">${work.title}</h4>
            </div>
            <div class="text-xs text-gray-600 mb-2">
                ${this.getWorkTypeName(work.work_type)} | 质量评分: ${work.quality_score.toFixed(1)}
            </div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">${this.formatDate(work.created_at)}</span>
                <span class="text-xs px-2 py-1 rounded ${this.getWorkStatusClass(work.status)}">${work.status}</span>
            </div>
        `;

        return div;
    }

    getWorkTypeIcon(type) {
        const icons = {
            'paper': '📄',
            'patent': '⚖️',
            'product_design': '🎨'
        };
        return icons[type] || '📋';
    }

    getWorkTypeName(type) {
        const names = {
            'paper': '学术论文',
            'patent': '专利申请',
            'product_design': '产品设计'
        };
        return names[type] || type;
    }

    getWorkStatusClass(status) {
        const classes = {
            'draft': 'bg-yellow-100 text-yellow-800',
            'completed': 'bg-green-100 text-green-800',
            'published': 'bg-blue-100 text-blue-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    async loadContentOptions() {
        await this.refreshContentTasks();
        const select = document.getElementById('contentSelect');
        select.innerHTML = '<option value="">选择要发布的内容...</option>';
        
        this.contentTasks
            .filter(task => task.status === 'completed')
            .forEach(task => {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.task_name;
                select.appendChild(option);
            });
    }

    async submitBatchContentGeneration() {
        const form = document.getElementById('batchContentForm');
        const formData = new FormData(form);
        
        const urls = document.getElementById('sourceUrls').value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url);

        if (urls.length === 0) {
            this.showError('请输入至少一个有效的URL');
            return;
        }

        const requestData = {
            task_name: document.getElementById('taskName').value,
            source_urls: urls,
            agent_type: document.getElementById('agentType').value,
            content_style: document.getElementById('contentStyle').value,
            target_audience: document.getElementById('targetAudience').value,
            content_length: document.getElementById('contentLength').value
        };

        this.showLoading();
        try {
            const response = await fetch('/api/content/batch-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess('批量内容生成任务已创建！');
                this.hideBatchContentModal();
                form.reset();
                setTimeout(() => this.refreshContentTasks(), 1000);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('批量内容生成失败:', error);
            this.showError('生成失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    async submitContentPublishing() {
        const contentId = document.getElementById('contentSelect').value;
        const platform = document.getElementById('publishPlatform').value;
        const autoPublish = document.getElementById('autoPublish').checked;

        if (!contentId) {
            this.showError('请选择要发布的内容');
            return;
        }

        const requestData = {
            content_id: parseInt(contentId),
            platform: platform,
            auto_publish: autoPublish
        };

        this.showLoading();
        try {
            const response = await fetch('/api/content/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess(`内容已${autoPublish ? '发布' : '保存为草稿'}到${this.getPlatformName(platform)}！`);
                this.hidePublishingModal();
                document.getElementById('publishingForm').reset();
                setTimeout(() => this.refreshAnalytics(), 1000);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('内容发布失败:', error);
            this.showError('发布失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    async submitAcademicCreation() {
        const requestData = {
            work_type: document.getElementById('workType').value,
            title: document.getElementById('workTitle').value,
            focus_area: document.getElementById('focusArea').value,
            additional_context: document.getElementById('additionalContext').value,
            use_user_profile: document.getElementById('useUserProfile').checked,
            use_word_cloud: document.getElementById('useWordCloud').checked
        };

        this.showLoading();
        try {
            const response = await fetch('/api/academic/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            if (result.success) {
                this.showSuccess('学术作品生成成功！');
                this.hideAcademicModal();
                document.getElementById('academicForm').reset();
                setTimeout(() => this.refreshAcademicWorks(), 1000);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('学术作品生成失败:', error);
            this.showError('生成失败，请重试');
        } finally {
            this.hideLoading();
        }
    }

    async viewTaskResults(taskId) {
        try {
            const response = await fetch(`/api/content/tasks/${taskId}/results`);
            const result = await response.json();
            
            if (result.success) {
                this.showTaskResultsModal(result.data);
            } else {
                this.showError('获取任务结果失败');
            }
        } catch (error) {
            console.error('获取任务结果失败:', error);
            this.showError('获取结果失败，请重试');
        }
    }

    async viewAcademicWork(workId) {
        try {
            const response = await fetch(`/api/academic/works/${workId}`);
            const result = await response.json();
            
            if (result.success) {
                this.showAcademicWorkModal(result.data);
            } else {
                this.showError('获取学术作品失败');
            }
        } catch (error) {
            console.error('获取学术作品失败:', error);
            this.showError('获取作品失败，请重试');
        }
    }

    showTaskResultsModal(data) {
        // 创建动态模态框显示任务结果
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">📄 任务结果: ${data.task_name}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="text-sm text-gray-600">
                        状态: ${this.getTaskStatusText(data.status)} | 进度: ${data.progress}%
                    </div>
                    <div class="space-y-3">
                        ${data.results.map((result, index) => `
                            <div class="border rounded-lg p-4 ${result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="font-medium text-sm">${result.url}</span>
                                    <span class="text-xs px-2 py-1 rounded ${result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                        ${result.status === 'success' ? '成功' : '失败'}
                                    </span>
                                </div>
                                ${result.content ? `
                                    <div class="text-sm text-gray-700 max-h-40 overflow-y-auto bg-white p-3 rounded border">
                                        ${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}
                                    </div>
                                ` : ''}
                                ${result.error ? `
                                    <div class="text-sm text-red-600 bg-red-50 p-2 rounded">
                                        错误: ${result.error}
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showAcademicWorkModal(data) {
        // 创建动态模态框显示学术作品
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-medium text-gray-900">${this.getWorkTypeIcon(data.work_type)} ${data.title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="space-y-4">
                    <div class="text-sm text-gray-600">
                        类型: ${this.getWorkTypeName(data.work_type)} | 状态: ${data.status} | 质量评分: ${data.quality_score.toFixed(1)}
                    </div>
                    ${data.abstract ? `
                        <div>
                            <h4 class="font-medium text-gray-900 mb-2">摘要</h4>
                            <div class="text-sm text-gray-700 bg-gray-50 p-3 rounded">${data.abstract}</div>
                        </div>
                    ` : ''}
                    <div>
                        <h4 class="font-medium text-gray-900 mb-2">内容</h4>
                        <div class="text-sm text-gray-700 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded whitespace-pre-wrap">${data.content}</div>
                    </div>
                    ${data.keywords ? `
                        <div>
                            <h4 class="font-medium text-gray-900 mb-2">关键词</h4>
                            <div class="text-sm text-gray-700">${data.keywords}</div>
                        </div>
                    ` : ''}
                    <div class="text-xs text-gray-500">
                        创建时间: ${this.formatDate(data.created_at)} | 更新时间: ${this.formatDate(data.updated_at)}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    formatDate(dateString) {
        if (!dateString) return '未知';
        return new Date(dateString).toLocaleString('zh-CN');
    }

    showLoading() {
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

// 模态框控制函数
function showBatchContentModal() {
    document.getElementById('batchContentModal').classList.remove('hidden');
    document.getElementById('batchContentModal').classList.add('flex');
}

function hideBatchContentModal() {
    document.getElementById('batchContentModal').classList.add('hidden');
    document.getElementById('batchContentModal').classList.remove('flex');
}

function showPublishingModal() {
    agentStudio.loadContentOptions();
    document.getElementById('publishingModal').classList.remove('hidden');
    document.getElementById('publishingModal').classList.add('flex');
}

function hidePublishingModal() {
    document.getElementById('publishingModal').classList.add('hidden');
    document.getElementById('publishingModal').classList.remove('flex');
}

function showAcademicModal() {
    document.getElementById('academicModal').classList.remove('hidden');
    document.getElementById('academicModal').classList.add('flex');
}

function hideAcademicModal() {
    document.getElementById('academicModal').classList.add('hidden');
    document.getElementById('academicModal').classList.remove('flex');
}

// 刷新函数
function refreshContentTasks() {
    agentStudio.refreshContentTasks();
}

function refreshAnalytics() {
    agentStudio.refreshAnalytics();
}

function refreshAcademicWorks() {
    agentStudio.refreshAcademicWorks();
}

// 初始化Agent工作室
const agentStudio = new AgentStudio();