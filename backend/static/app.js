// 浏览器历史记录管理系统前端JS
class HistoryManager {
    constructor() {
        this.apiBase = '/api';
        this.currentData = [];
        this.chart = null;
        
        this.initializeElements();
        this.bindEvents();
        this.bootstrapOnboarding();
        this.loadData();
    }
    
    initializeElements() {
        this.elements = {
            // 统计数据
            totalRecords: document.getElementById('totalRecords'),
            uniqueUrls: document.getElementById('uniqueUrls'),
            syncCount: document.getElementById('syncCount'),
            lastSync: document.getElementById('lastSync'),
            
            // 搜索控件
            searchInput: document.getElementById('searchInput'),
            limitSelect: document.getElementById('limitSelect'),
            searchBtn: document.getElementById('searchBtn'),
            
            // 按钮
            refreshBtn: document.getElementById('refreshBtn'),
            exportBtn: document.getElementById('exportBtn'),
            deleteBtn: document.getElementById('deleteBtn'),
            
            // 显示区域
            historyTableBody: document.getElementById('historyTableBody'),
            topSites: document.getElementById('topSites'),
            loadingIndicator: document.getElementById('loadingIndicator'),
            noDataIndicator: document.getElementById('noDataIndicator'),
            
            // 图表
            visitTrendChart: document.getElementById('visitTrendChart'),

            // Onboarding & Summary
            onboardingCard: document.getElementById('onboardingCard'),
            onboardingMsg: document.getElementById('onboardingMsg'),
            aiDetectBtn: document.getElementById('aiDetectBtn'),
            runAnalysisBtn: document.getElementById('runAnalysisBtn'),
            aiStatusText: document.getElementById('aiStatusText'),
            summaryCard: document.getElementById('summaryCard'),
            summaryMeta: document.getElementById('summaryMeta'),
            summaryContent: document.getElementById('summaryContent'),
            refreshSummaryBtn: document.getElementById('refreshSummaryBtn'),

            // Create content modal
            createContentBtn: document.getElementById('createContentBtn'),
            selectAllRows: document.getElementById('selectAllRows'),
            createModal: document.getElementById('createModal'),
            createModalClose: document.getElementById('createModalClose'),
            createModalCancel: document.getElementById('createModalCancel'),
            createModalConfirm: document.getElementById('createModalConfirm'),
            createStyle: document.getElementById('createStyle'),
            createAudience: document.getElementById('createAudience'),
            createLength: document.getElementById('createLength'),

            // Tasks
            tasksCard: document.getElementById('tasksCard'),
            tasksContainer: document.getElementById('tasksContainer'),
            refreshTasksBtn: document.getElementById('refreshTasksBtn'),
            taskResultModal: document.getElementById('taskResultModal'),
            taskResultTitle: document.getElementById('taskResultTitle'),
            taskResultBody: document.getElementById('taskResultBody'),
            taskResultClose: document.getElementById('taskResultClose'),

            // Bookmarks stats/actions
            bookmarksCard: document.getElementById('bookmarksCard'),
            bmTotal: document.getElementById('bmTotal'),
            bmUnclassified: document.getElementById('bmUnclassified'),
            bmRefreshBtn: document.getElementById('bmRefreshBtn'),
            bmClassifyBtn: document.getElementById('bmClassifyBtn'),
        };
    }
    
    bindEvents() {
        this.elements.refreshBtn.addEventListener('click', () => this.loadData());
        this.elements.searchBtn.addEventListener('click', () => this.searchHistory());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteAllData());

        // Onboarding events
        if (this.elements.aiDetectBtn) {
            this.elements.aiDetectBtn.addEventListener('click', () => this.autodetectAI());
        }
        if (this.elements.runAnalysisBtn) {
            this.elements.runAnalysisBtn.addEventListener('click', () => this.runAnalysis());
        }
        if (this.elements.refreshSummaryBtn) {
            this.elements.refreshSummaryBtn.addEventListener('click', () => this.loadSummary());
        }
        if (this.elements.refreshTasksBtn) {
            this.elements.refreshTasksBtn.addEventListener('click', () => this.loadTasks());
        }
        if (this.elements.taskResultClose) {
            this.elements.taskResultClose.addEventListener('click', () => this.toggleTaskResult(false));
        }
        if (this.elements.bmRefreshBtn) {
            this.elements.bmRefreshBtn.addEventListener('click', () => this.loadBookmarksStats());
        }
        if (this.elements.bmClassifyBtn) {
            this.elements.bmClassifyBtn.addEventListener('click', () => this.classifyBookmarks());
        }

        // Create content actions
        if (this.elements.createContentBtn) {
            this.elements.createContentBtn.addEventListener('click', () => this.openCreateModal());
        }
        if (this.elements.createModalClose) {
            this.elements.createModalClose.addEventListener('click', () => this.toggleCreateModal(false));
        }
        if (this.elements.createModalCancel) {
            this.elements.createModalCancel.addEventListener('click', () => this.toggleCreateModal(false));
        }
        if (this.elements.createModalConfirm) {
            this.elements.createModalConfirm.addEventListener('click', () => this.confirmCreate());
        }
        if (this.elements.selectAllRows) {
            this.elements.selectAllRows.addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        }
        
        // 回车搜索
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchHistory();
            }
        });
        
        // 限制数量变化时重新搜索
        this.elements.limitSelect.addEventListener('change', () => {
            if (this.elements.searchInput.value) {
                this.searchHistory();
            } else {
                this.loadHistory();
            }
        });
    }

    async bootstrapOnboarding() {
        try {
            // 获取引导状态
            const resp = await fetch(`${this.apiBase}/onboarding/state`);
            if (!resp.ok) throw new Error('引导状态检查失败');
            const result = await resp.json();
            const { has_history, has_active_ai } = result.data || {};

            // 控制引导卡片显示
            const needOnboarding = !has_history || !has_active_ai;
            this.elements.onboardingCard.classList.toggle('hidden', !needOnboarding);

            if (!has_active_ai) {
                this.elements.aiStatusText.textContent = '未连接';
            } else {
                this.elements.aiStatusText.textContent = '已连接';
            }

            // 加载摘要卡
            await this.loadSummary();

            // 加载任务卡
            await this.loadTasks();
            await this.loadBookmarksStats();
        } catch (e) {
            console.warn(e);
        }
    }

    async autodetectAI() {
        try {
            this.elements.aiDetectBtn.disabled = true;
            this.elements.aiDetectBtn.textContent = '检测中...';

            // 调用探测接口
            const resp = await fetch(`${this.apiBase}/ai/autodetect`, { method: 'POST' });
            const result = await resp.json();
            if (!resp.ok || !result.success) throw new Error(result.detail || result.message || '探测失败');

            const models = result.data?.available_models || [];
            const model = models[0] || 'llama2';

            // 保存一个默认配置（若已存在会报错忽略）
            await fetch(`${this.apiBase}/ai/configs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Ollama默认配置',
                    type: 'ollama',
                    base_url: 'http://localhost:11434',
                    model: model,
                    max_tokens: 1024,
                    temperature: 0.7,
                    is_active: true
                })
            }).catch(() => {});

            this.elements.aiStatusText.textContent = '已连接';
            alert('AI 已连接，可开始分析');
        } catch (e) {
            alert('AI 自动连接失败：' + e.message);
        } finally {
            this.elements.aiDetectBtn.disabled = false;
            this.elements.aiDetectBtn.textContent = '一键连接AI';
        }
    }

    async loadBookmarksStats() {
        try {
            const resp = await fetch(`${this.apiBase}/bookmarks/stats`);
            if (!resp.ok) return;
            const result = await resp.json();
            const data = result.data || {};
            this.elements.bmTotal.textContent = (data.total || 0).toLocaleString();
            this.elements.bmUnclassified.textContent = (data.unclassified || 0).toLocaleString();
        } catch (e) {
            console.warn('加载书签统计失败', e);
        }
    }

    async classifyBookmarks() {
        try {
            this.elements.bmClassifyBtn.disabled = true;
            this.elements.bmClassifyBtn.textContent = '分类中...';
            const resp = await fetch(`${this.apiBase}/bookmarks/ai-classify`, { method: 'POST' });
            const result = await resp.json();
            if (!resp.ok || !result.success) throw new Error(result.detail || result.message || '分类失败');
            await this.loadBookmarksStats();
            alert(`已分类 ${result.data.classified || 0} 条书签`);
        } catch (e) {
            alert('分类失败：' + e.message);
        } finally {
            this.elements.bmClassifyBtn.disabled = false;
            this.elements.bmClassifyBtn.textContent = '一键分类';
        }
    }

    async runAnalysis() {
        try {
            this.elements.runAnalysisBtn.disabled = true;
            this.elements.runAnalysisBtn.textContent = '分析中...';
            const resp = await fetch(`${this.apiBase}/analyze/run`, { method: 'POST' });
            const result = await resp.json();
            if (!resp.ok || !result.success) throw new Error(result.detail || result.message || '分析失败');
            await this.loadSummary();
            alert('分析完成');
        } catch (e) {
            alert('分析失败：' + e.message);
        } finally {
            this.elements.runAnalysisBtn.disabled = false;
            this.elements.runAnalysisBtn.textContent = '运行首次分析';
        }
    }

    async loadSummary() {
        try {
            const resp = await fetch(`${this.apiBase}/analyze/summary`);
            if (!resp.ok) return;
            const result = await resp.json();
            if (!result.data) {
                this.elements.summaryCard.classList.add('hidden');
                return;
            }
            this.elements.summaryCard.classList.remove('hidden');
            this.elements.summaryMeta.textContent = `基于 ${result.data.records_used} 条记录 · 生成于 ${new Date(result.data.created_at).toLocaleString('zh-CN')}`;
            // 简单转成段落
            this.elements.summaryContent.textContent = result.data.summary;
        } catch (e) {
            console.warn('加载摘要失败', e);
        }
    }
    
    async loadData() {
        console.log('开始加载数据...');
        this.showLoading(true);
        
        try {
            // 并行加载统计数据和历史记录
            const [statsResponse, historyResponse] = await Promise.all([
                this.fetchStats(),
                this.loadHistory()
            ]);
            
            // 更新统计数据
            this.updateStats(statsResponse);
            
            // 加载图表和热门网站
            await Promise.all([
                this.loadChart(),
                this.loadTopSites()
            ]);
            
            console.log('数据加载完成');
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('加载数据失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    async fetchStats() {
        const response = await fetch(`${this.apiBase}/stats`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result.data;
    }
    
    async loadHistory(search = '', limit = 100, offset = 0) {
        const params = new URLSearchParams({
            limit: limit.toString(),
            offset: offset.toString()
        });
        
        if (search) {
            params.append('search', search);
        }
        
        const response = await fetch(`${this.apiBase}/history?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        this.currentData = result.data.records;
        this.renderHistoryTable(this.currentData);
        
        return result.data;
    }
    
    async searchHistory() {
        const search = this.elements.searchInput.value.trim();
        const limit = parseInt(this.elements.limitSelect.value);
        
        console.log('搜索历史记录:', { search, limit });
        this.showLoading(true);
        
        try {
            await this.loadHistory(search, limit);
        } catch (error) {
            console.error('搜索失败:', error);
            this.showError('搜索失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }
    
    updateStats(stats) {
        console.log('更新统计数据:', stats);
        
        // 动画更新数字
        this.animateCounter(this.elements.totalRecords, stats.total_records || 0);
        this.animateCounter(this.elements.uniqueUrls, stats.unique_urls || 0);
        this.animateCounter(this.elements.syncCount, stats.sync_count || 0);
        
        // 更新最后同步时间
        if (stats.last_sync_time) {
            const date = new Date(stats.last_sync_time);
            this.elements.lastSync.textContent = date.toLocaleString('zh-CN');
        } else {
            this.elements.lastSync.textContent = '暂未同步';
        }
    }
    
    animateCounter(element, target) {
        const current = parseInt(element.textContent) || 0;
        const increment = Math.ceil((target - current) / 30);
        
        if (current < target) {
            element.textContent = Math.min(current + increment, target);
            setTimeout(() => this.animateCounter(element, target), 50);
        } else {
            element.textContent = target.toLocaleString();
        }
    }
    
    renderHistoryTable(data) {
        console.log('渲染历史记录表格:', data.length, '条记录');
        
        if (!data || data.length === 0) {
            this.elements.historyTableBody.innerHTML = '';
            this.showNoData(true);
            return;
        }
        
        this.showNoData(false);
        
        const rows = data.map((item, idx) => {
            const visitTime = new Date(item.visitTime).toLocaleString('zh-CN');
            const domain = this.extractDomain(item.url);
            const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" class="row-select rounded" data-url="${this.escapeHtml(item.url)}">
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <img src="${favicon}" alt="" class="w-4 h-4 mr-2" onerror="this.style.display='none'">
                            <div class="text-sm">
                                <div class="font-medium text-gray-900 truncate max-w-xs" title="${this.escapeHtml(domain)}">
                                    ${this.escapeHtml(domain)}
                                </div>
                                <div class="text-gray-500 text-xs truncate max-w-xs" title="${this.escapeHtml(item.url)}">
                                    ${this.escapeHtml(item.url)}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900 truncate max-w-md" title="${this.escapeHtml(item.title || '无标题')}">
                            ${this.escapeHtml(item.title || '无标题')}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${visitTime}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ${item.visitCount || 1}次
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.elements.historyTableBody.innerHTML = rows;
    }

    toggleSelectAll(checked) {
        this.elements.historyTableBody.querySelectorAll('.row-select').forEach(cb => {
            cb.checked = checked;
        });
    }

    openCreateModal() {
        const selected = this.getSelectedUrls();
        if (selected.length === 0) {
            alert('请先勾选至少一个链接');
            return;
        }
        this.toggleCreateModal(true);
    }

    toggleCreateModal(show) {
        this.elements.createModal.classList.toggle('hidden', !show);
        this.elements.createModal.classList.toggle('flex', show);
    }

    getSelectedUrls() {
        const urls = [];
        this.elements.historyTableBody.querySelectorAll('.row-select:checked').forEach(cb => {
            const url = cb.getAttribute('data-url');
            if (url) urls.push(url);
        });
        return urls;
    }

    async confirmCreate() {
        try {
            const urls = this.getSelectedUrls();
            if (urls.length === 0) {
                alert('未选择链接');
                return;
            }
            this.elements.createModalConfirm.disabled = true;
            this.elements.createModalConfirm.textContent = '创建中...';
            const payload = {
                task_name: `网页内容创作-${new Date().toISOString().slice(0,16).replace('T',' ')}`,
                source_urls: urls.slice(0, 20), // 限制一次最多20条，避免太慢
                agent_type: 'content_creation',
                content_style: this.elements.createStyle.value,
                target_audience: this.elements.createAudience.value.trim(),
                content_length: this.elements.createLength.value
            };
            const resp = await fetch(`${this.apiBase}/content/batch-generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await resp.json();
            if (!resp.ok || !result.success) throw new Error(result.detail || result.message || '创建失败');
            this.toggleCreateModal(false);
            alert('已创建生成任务，可在AI助手或后台查看');
            this.loadTasks();
        } catch (e) {
            alert('创建失败：' + e.message);
        } finally {
            this.elements.createModalConfirm.disabled = false;
            this.elements.createModalConfirm.textContent = '开始生成';
        }
    }

    async loadTasks() {
        try {
            const resp = await fetch(`${this.apiBase}/content/tasks`);
            if (!resp.ok) return;
            const result = await resp.json();
            const tasks = result.data?.tasks || [];
            if (tasks.length === 0) {
                this.elements.tasksCard.classList.add('hidden');
                return;
            }
            this.elements.tasksCard.classList.remove('hidden');
            const html = tasks.map(t => {
                const progress = Math.min(100, Math.max(0, t.progress || 0));
                const statusColor = t.status === 'completed' ? 'bg-green-600' : t.status === 'failed' ? 'bg-red-600' : 'bg-indigo-600';
                return `
                    <div class="border rounded-lg p-4">
                        <div class="flex items-center justify-between">
                            <div class="font-medium text-gray-900">${this.escapeHtml(t.task_name)}</div>
                            <div class="text-xs text-gray-500">${this.escapeHtml(t.status)} · ${new Date(t.updated_at || t.created_at).toLocaleString('zh-CN')}</div>
                        </div>
                        <div class="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div class="h-2 rounded-full ${statusColor}" style="width: ${progress}%"></div>
                        </div>
                        <div class="mt-2 text-xs text-gray-600">进度：${progress}%</div>
                        <div class="mt-3">
                            <button data-task-id="${t.id}" class="view-task btn-view px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50">查看结果</button>
                        </div>
                    </div>
                `;
            }).join('');
            this.elements.tasksContainer.innerHTML = html;
            this.elements.tasksContainer.querySelectorAll('.btn-view').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-task-id');
                    this.viewTaskResult(id);
                });
            });
        } catch (e) {
            console.warn('加载任务失败', e);
        }
    }

    async viewTaskResult(taskId) {
        try {
            const resp = await fetch(`${this.apiBase}/content/tasks/${taskId}/results`);
            if (!resp.ok) throw new Error('获取结果失败');
            const result = await resp.json();
            const list = result.data?.results || [];
            this.elements.taskResultTitle.textContent = `任务结果 #${taskId}`;
            const html = list.length === 0 ? '<div class="text-gray-500">暂无结果</div>' : list.map((r, idx) => {
                const content = (r.content || '').replace(/\n/g, '<br>');
                const statusTag = r.status === 'success' ? '<span class="text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">成功</span>' : '<span class="text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs">失败</span>';
                return `
                    <div class="border rounded p-3">
                        <div class="flex items-center justify-between mb-2">
                            <div class="text-sm text-gray-600 truncate max-w-[60%]" title="${this.escapeHtml(r.url)}">${this.escapeHtml(r.url)}</div>
                            <div>${statusTag}</div>
                        </div>
                        <div class="prose max-w-none text-sm">${content}</div>
                    </div>
                `;
            }).join('');
            this.elements.taskResultBody.innerHTML = html;
            this.toggleTaskResult(true);
        } catch (e) {
            alert('查看结果失败：' + e.message);
        }
    }

    toggleTaskResult(show) {
        this.elements.taskResultModal.classList.toggle('hidden', !show);
        this.elements.taskResultModal.classList.toggle('flex', show);
    }
    
    async loadChart() {
        try {
            // 获取最近7天的访问数据
            const response = await fetch(`${this.apiBase}/analytics/daily-visits`);
            if (!response.ok) return;
            
            const result = await response.json();
            const data = result.data.daily_visits || [];
            
            if (this.chart) {
                this.chart.destroy();
            }
            
            const ctx = this.elements.visitTrendChart.getContext('2d');
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.map(item => item.date),
                    datasets: [{
                        label: '访问次数',
                        data: data.map(item => item.visits),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        } catch (error) {
            console.error('加载图表失败:', error);
        }
    }
    
    async loadTopSites() {
        try {
            const response = await fetch(`${this.apiBase}/analytics/top-sites`);
            if (!response.ok) return;
            
            const result = await response.json();
            const sites = result.data.top_sites || [];
            
            const html = sites.map((site, index) => {
                const favicon = `https://www.google.com/s2/favicons?domain=${site.domain}&sz=16`;
                return `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div class="flex items-center">
                            <span class="text-sm font-bold text-gray-400 w-6">${index + 1}</span>
                            <img src="${favicon}" alt="" class="w-4 h-4 mx-2" onerror="this.style.display='none'">
                            <div>
                                <div class="text-sm font-medium text-gray-900 truncate max-w-32" title="${this.escapeHtml(site.domain)}">
                                    ${this.escapeHtml(site.domain)}
                                </div>
                                <div class="text-xs text-gray-500">${site.visit_count}次访问</div>
                            </div>
                        </div>
                        <div class="w-12 bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(site.visit_count / sites[0].visit_count * 100, 100)}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            this.elements.topSites.innerHTML = html || '<p class="text-gray-500 text-center">暂无数据</p>';
        } catch (error) {
            console.error('加载热门网站失败:', error);
        }
    }
    
    async exportData() {
        try {
            console.log('开始导出数据...');
            const search = this.elements.searchInput.value.trim();
            const limit = 10000; // 导出更多数据
            
            const params = new URLSearchParams({ limit: limit.toString() });
            if (search) params.append('search', search);
            
            const response = await fetch(`${this.apiBase}/history?${params}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            const data = result.data.records;
            
            // 生成CSV
            const csv = this.generateCSV(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            // 下载文件
            const a = document.createElement('a');
            a.href = url;
            a.download = `browser_history_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert(`导出成功！共导出 ${data.length} 条记录`);
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败: ' + error.message);
        }
    }
    
    generateCSV(data) {
        const header = '标题,网址,访问时间,访问次数\n';
        const rows = data.map(item => {
            return [
                this.escapeCSV(item.title || '无标题'),
                this.escapeCSV(item.url),
                this.escapeCSV(new Date(item.visitTime).toLocaleString('zh-CN')),
                item.visitCount || 1
            ].join(',');
        }).join('\n');
        
        return '\ufeff' + header + rows; // 添加BOM
    }
    
    async deleteAllData() {
        if (!confirm('确定要清空所有历史记录数据吗？此操作不可恢复！')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/clear-all`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            alert('数据清空成功！');
            this.loadData(); // 重新加载数据
        } catch (error) {
            console.error('清空数据失败:', error);
            alert('清空数据失败: ' + error.message);
        }
    }
    
    showLoading(show) {
        this.elements.loadingIndicator.classList.toggle('hidden', !show);
    }
    
    showNoData(show) {
        this.elements.noDataIndicator.classList.toggle('hidden', !show);
    }
    
    showError(message) {
        alert(message);
    }
    
    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeCSV(value) {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HistoryManager();
});