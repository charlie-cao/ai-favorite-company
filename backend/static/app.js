// 浏览器历史记录管理系统前端JS
class HistoryManager {
    constructor() {
        this.apiBase = '/api';
        this.currentData = [];
        this.chart = null;
        
        this.initializeElements();
        this.bindEvents();
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
            visitTrendChart: document.getElementById('visitTrendChart')
        };
    }
    
    bindEvents() {
        this.elements.refreshBtn.addEventListener('click', () => this.loadData());
        this.elements.searchBtn.addEventListener('click', () => this.searchHistory());
        this.elements.exportBtn.addEventListener('click', () => this.exportData());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteAllData());
        
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
        
        const rows = data.map(item => {
            const visitTime = new Date(item.visitTime).toLocaleString('zh-CN');
            const domain = this.extractDomain(item.url);
            const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
            
            return `
                <tr class="hover:bg-gray-50">
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