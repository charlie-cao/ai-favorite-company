class HistoryViewer {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 20;
        this.totalItems = 0;
        this.totalPages = 1;
        this.allHistory = [];
        this.filteredHistory = [];
        this.searchQuery = '';
        this.timeRange = 30;
        
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
        this.initializeExport();
    }
    
    initializeElements() {
        this.elements = {
            historyList: document.getElementById('historyList'),
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            timeRange: document.getElementById('timeRange'),
            pageSize: document.getElementById('pageSize'),
            totalCount: document.getElementById('totalCount'),
            currentPage: document.getElementById('currentPage'),
            totalPages: document.getElementById('totalPages'),
            prevBtn: document.getElementById('prevBtn'),
            nextBtn: document.getElementById('nextBtn'),
            pagination: document.getElementById('pagination'),
            
            // 导出相关元素
            exportBtn: document.getElementById('exportBtn'),
            exportModal: document.getElementById('exportModal'),
            closeModal: document.getElementById('closeModal'),
            startExport: document.getElementById('startExport'),
            cancelExport: document.getElementById('cancelExport'),
            exportProgress: document.getElementById('exportProgress'),
            progressText: document.getElementById('progressText'),
            progressPercent: document.getElementById('progressPercent'),
            progressFill: document.getElementById('progressFill'),
            processedCount: document.getElementById('processedCount'),
            totalExportCount: document.getElementById('totalExportCount')
        };
    }
    
    bindEvents() {
        // 搜索功能
        this.elements.searchBtn.addEventListener('click', () => this.performSearch());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });
        
        // 时间范围过滤
        this.elements.timeRange.addEventListener('change', () => {
            this.timeRange = parseInt(this.elements.timeRange.value);
            this.loadHistory();
        });
        
        // 每页显示数量
        this.elements.pageSize.addEventListener('change', () => {
            this.pageSize = parseInt(this.elements.pageSize.value);
            this.currentPage = 1;
            this.renderPage();
        });
        
        // 分页按钮
        this.elements.prevBtn.addEventListener('click', () => this.goToPreviousPage());
        this.elements.nextBtn.addEventListener('click', () => this.goToNextPage());
    }
    
    async loadHistory() {
        try {
            this.showLoading();
            
            // 计算时间范围
            const startTime = this.getStartTime();
            
            // 获取历史记录
            const historyItems = await chrome.history.search({
                text: '',
                startTime: startTime,
                maxResults: 10000 // 获取大量结果
            });
            
            this.allHistory = historyItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
            this.applyFilters();
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showError('加载历史记录失败，请重试');
        }
    }
    
    getStartTime() {
        if (this.timeRange === 0) return 0; // 全部时间
        
        const now = new Date();
        const daysAgo = new Date(now.getTime() - (this.timeRange * 24 * 60 * 60 * 1000));
        return daysAgo.getTime();
    }
    
    applyFilters() {
        let filtered = [...this.allHistory];
        
        // 应用搜索过滤
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.url.toLowerCase().includes(query)
            );
        }
        
        this.filteredHistory = filtered;
        this.totalItems = this.filteredHistory.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.currentPage = 1;
        
        this.updateStats();
        this.renderPage();
    }
    
    performSearch() {
        this.searchQuery = this.elements.searchInput.value.trim();
        this.applyFilters();
    }
    
    renderPage() {
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalItems);
        const pageItems = this.filteredHistory.slice(startIndex, endIndex);
        
        if (pageItems.length === 0) {
            this.showEmpty();
            return;
        }
        
        const html = pageItems.map(item => this.createHistoryItemHTML(item)).join('');
        this.elements.historyList.innerHTML = html;
        
        this.updatePagination();
    }
    
    createHistoryItemHTML(item) {
        const visitTime = new Date(item.lastVisitTime);
        const timeStr = this.formatTime(visitTime);
        const favicon = `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=16`;
        
        return `
            <div class="history-item">
                <div class="favicon-container">
                    <img src="${favicon}" 
                         alt="" 
                         class="favicon" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMEMzLjU4IDAgMCAzLjU4IDAgOEM0IDEyLjQyIDcuNTggMTYgOCAxNkMxMi40MiAxNiAxNiAxMi40MiAxNiA4QzE2IDMuNTggMTIuNDIgMCA4IDBaTTggMTQuNEM2LjIgMTQuNCA0LjggMTMgNC44IDExLjJINy4yVjEyLjhIOC44VjExLjJIMTEuMkMxMS4yIDEzIDkuOCAxNC40IDggMTQuNFpNMTEuMiA5LjZINC44VjhIMTEuMlY5LjZaIiBmaWxsPSIjOTk5Ii8+Cjwvc3ZnPgo='">
                </div>
                <div class="history-content">
                    <div class="history-title">
                        <a href="${item.url}" 
                           target="_blank" 
                           title="${item.title}">
                            ${this.escapeHtml(item.title) || '无标题'}
                        </a>
                    </div>
                    <div class="history-url">
                        ${this.escapeHtml(item.url)}
                    </div>
                    <div class="history-meta">
                        <span class="visit-time">${timeStr}</span>
                        <span class="visit-count">
                            ${item.visitCount}次访问
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 7) return `${diffDays}天前`;
        
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    updateStats() {
        this.elements.totalCount.textContent = `共 ${this.totalItems} 条记录`;
    }
    
    updatePagination() {
        this.elements.currentPage.textContent = this.currentPage;
        this.elements.totalPages.textContent = this.totalPages;
        
        this.elements.prevBtn.disabled = this.currentPage <= 1;
        this.elements.nextBtn.disabled = this.currentPage >= this.totalPages;
        
        // 如果只有一页，隐藏分页控件
        this.elements.pagination.style.display = this.totalPages <= 1 ? 'none' : 'flex';
    }
    
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage();
        }
    }
    
    goToNextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPage();
        }
    }
    
    showLoading() {
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <svg class="loading-spinner" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <div class="status-title loading-title">正在加载历史记录...</div>
                </div>
            </div>
        `;
    }
    
    showError(message) {
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                    <div class="status-title error-title">加载失败</div>
                    <div class="status-message">${message}</div>
                </div>
            </div>
        `;
    }
    
    showEmpty() {
        const message = this.searchQuery ? 
            `没有找到包含 "${this.searchQuery}" 的历史记录` : 
            '没有历史记录';
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div class="status-title empty-title">暂无数据</div>
                    <div class="status-message">${message}</div>
                </div>
            </div>
        `;
        this.elements.pagination.style.display = 'none';
    }
    
    initializeExport() {
        this.isExporting = false;
        this.exportCancelled = false;
        
        // 绑定导出相关事件
        this.elements.exportBtn.addEventListener('click', () => this.openExportModal());
        this.elements.closeModal.addEventListener('click', () => this.closeExportModal());
        this.elements.cancelExport.addEventListener('click', () => this.closeExportModal());
        this.elements.startExport.addEventListener('click', () => this.startExportProcess());
        
        // 点击模态框外部关闭
        this.elements.exportModal.addEventListener('click', (e) => {
            if (e.target === this.elements.exportModal) {
                this.closeExportModal();
            }
        });
        
        // 绑定自定义选项交互
        this.bindModalInteractions();
    }
    
    bindModalInteractions() {
        // 格式选择
        document.querySelectorAll('[data-format]').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('[data-format]').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                const input = item.querySelector('input[type="radio"]');
                if (input) input.checked = true;
                this.updateRadioIndicator(item);
            });
        });
        
        // 范围选择
        document.querySelectorAll('[data-range]').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('[data-range]').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');
                const input = item.querySelector('input[type="radio"]');
                if (input) input.checked = true;
                this.updateRadioIndicator(item);
            });
        });
        
        // 字段选择
        document.querySelectorAll('[data-field]').forEach(item => {
            item.addEventListener('click', () => {
                const input = item.querySelector('input[type="checkbox"]');
                if (input) {
                    input.checked = !input.checked;
                    if (input.checked) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                    this.updateCheckboxIndicator(item);
                }
            });
        });
    }
    
    updateRadioIndicator(item) {
        const indicator = item.querySelector('.radio-indicator');
        const dot = indicator.querySelector('.radio-dot');
        if (item.classList.contains('selected')) {
            dot.style.transform = 'scale(1)';
            indicator.style.borderColor = '#4F46E5';
        } else {
            dot.style.transform = 'scale(0)';
            indicator.style.borderColor = '#d1d5db';
        }
    }
    
    updateCheckboxIndicator(item) {
        const indicator = item.querySelector('.checkbox-indicator');
        const check = indicator.querySelector('.checkbox-check');
        if (item.classList.contains('selected')) {
            check.style.transform = 'scale(1)';
            indicator.style.backgroundColor = '#4F46E5';
            indicator.style.borderColor = '#4F46E5';
        } else {
            check.style.transform = 'scale(0)';
            indicator.style.backgroundColor = 'transparent';
            indicator.style.borderColor = '#d1d5db';
        }
    }
    
    openExportModal() {
        this.elements.exportModal.style.display = 'flex';
        this.resetExportModal();
    }
    
    closeExportModal() {
        if (this.isExporting) {
            this.exportCancelled = true;
        }
        this.elements.exportModal.style.display = 'none';
        this.resetExportModal();
    }
    
    resetExportModal() {
        this.elements.exportProgress.style.display = 'none';
        this.elements.startExport.style.display = 'inline-block';
        this.elements.startExport.disabled = false;
        this.isExporting = false;
        this.exportCancelled = false;
    }
    
    async startExportProcess() {
        try {
            // 获取用户选择的导出选项
            const options = this.getExportOptions();
            
            if (options.fields.length === 0) {
                alert('请至少选择一个字段进行导出');
                return;
            }
            
            this.isExporting = true;
            this.exportCancelled = false;
            this.elements.startExport.style.display = 'none';
            this.elements.exportProgress.style.display = 'block';
            
            // 准备导出数据
            const dataToExport = await this.prepareExportData(options);
            
            if (this.exportCancelled) return;
            
            // 执行分批导出
            await this.performBatchExport(dataToExport, options);
            
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        } finally {
            this.isExporting = false;
        }
    }
    
    getExportOptions() {
        const format = document.querySelector('input[name="format"]:checked').value;
        const range = document.querySelector('input[name="range"]:checked').value;
        const fieldInputs = document.querySelectorAll('input[name="fields"]:checked');
        const fields = Array.from(fieldInputs).map(input => input.value);
        
        return { format, range, fields };
    }
    
    async prepareExportData(options) {
        this.updateProgress('准备导出数据...', 0);
        
        let dataToExport;
        
        if (options.range === 'current') {
            // 导出当前筛选结果
            dataToExport = [...this.filteredHistory];
        } else {
            // 导出全部历史记录
            this.updateProgress('获取全部历史记录...', 10);
            
            const allHistoryItems = await chrome.history.search({
                text: '',
                startTime: 0,
                maxResults: 0 // 获取所有记录
            });
            
            dataToExport = allHistoryItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
        }
        
        this.elements.totalExportCount.textContent = dataToExport.length;
        return dataToExport;
    }
    
    async performBatchExport(data, options) {
        const batchSize = 1000; // 每批处理1000条记录
        const totalBatches = Math.ceil(data.length / batchSize);
        let processedRecords = 0;
        let exportContent = '';
        
        // 根据格式添加文件头
        if (options.format === 'csv') {
            exportContent += this.generateCSVHeader(options.fields);
        } else if (options.format === 'json') {
            exportContent += '[\n';
        }
        
        // 分批处理数据
        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            if (this.exportCancelled) return;
            
            const start = batchIndex * batchSize;
            const end = Math.min(start + batchSize, data.length);
            const batch = data.slice(start, end);
            
            // 处理当前批次
            const batchContent = await this.processBatch(batch, options, batchIndex > 0);
            exportContent += batchContent;
            
            processedRecords += batch.length;
            const progress = Math.round((processedRecords / data.length) * 90) + 10; // 10-100%
            
            this.updateProgress(`正在处理数据... (${batchIndex + 1}/${totalBatches})`, progress);
            this.elements.processedCount.textContent = processedRecords;
            
            // 让浏览器有时间更新UI
            await this.sleep(10);
        }
        
        // 根据格式添加文件尾
        if (options.format === 'json') {
            exportContent = exportContent.slice(0, -2) + '\n]'; // 移除最后的逗号
        }
        
        if (!this.exportCancelled) {
            this.updateProgress('生成下载文件...', 95);
            this.downloadFile(exportContent, options.format);
            this.updateProgress('导出完成！', 100);
            
            setTimeout(() => {
                this.closeExportModal();
            }, 1500);
        }
    }
    
    async processBatch(batch, options, isNotFirstBatch) {
        let content = '';
        
        for (let i = 0; i < batch.length; i++) {
            const item = batch[i];
            
            if (options.format === 'csv') {
                content += this.generateCSVRow(item, options.fields);
            } else if (options.format === 'json') {
                if (isNotFirstBatch || i > 0) content += ',\n';
                content += this.generateJSONRow(item, options.fields);
            } else if (options.format === 'txt') {
                content += this.generateTXTRow(item, options.fields);
            }
        }
        
        return content;
    }
    
    generateCSVHeader(fields) {
        const headers = {
            title: '标题',
            url: '网址',
            visitTime: '访问时间',
            visitCount: '访问次数'
        };
        
        return fields.map(field => `"${headers[field]}"`).join(',') + '\n';
    }
    
    generateCSVRow(item, fields) {
        const values = [];
        
        fields.forEach(field => {
            switch (field) {
                case 'title':
                    values.push(`"${this.escapeCSV(item.title || '无标题')}"`);
                    break;
                case 'url':
                    values.push(`"${this.escapeCSV(item.url)}"`);
                    break;
                case 'visitTime':
                    values.push(`"${new Date(item.lastVisitTime).toLocaleString('zh-CN')}"`);
                    break;
                case 'visitCount':
                    values.push(`"${item.visitCount}"`);
                    break;
            }
        });
        
        return values.join(',') + '\n';
    }
    
    generateJSONRow(item, fields) {
        const obj = {};
        
        fields.forEach(field => {
            switch (field) {
                case 'title':
                    obj.title = item.title || '无标题';
                    break;
                case 'url':
                    obj.url = item.url;
                    break;
                case 'visitTime':
                    obj.visitTime = new Date(item.lastVisitTime).toISOString();
                    break;
                case 'visitCount':
                    obj.visitCount = item.visitCount;
                    break;
            }
        });
        
        return '  ' + JSON.stringify(obj);
    }
    
    generateTXTRow(item, fields) {
        let content = '';
        
        fields.forEach(field => {
            switch (field) {
                case 'title':
                    content += `标题: ${item.title || '无标题'}\n`;
                    break;
                case 'url':
                    content += `网址: ${item.url}\n`;
                    break;
                case 'visitTime':
                    content += `访问时间: ${new Date(item.lastVisitTime).toLocaleString('zh-CN')}\n`;
                    break;
                case 'visitCount':
                    content += `访问次数: ${item.visitCount}\n`;
                    break;
            }
        });
        
        return content + '\n' + '-'.repeat(50) + '\n\n';
    }
    
    escapeCSV(text) {
        return text.replace(/"/g, '""');
    }
    
    downloadFile(content, format) {
        const blob = new Blob(['\ufeff' + content], { 
            type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8'
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const extensions = { csv: 'csv', json: 'json', txt: 'txt' };
        link.download = `browser-history-${timestamp}.${extensions[format]}`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    updateProgress(text, percent) {
        this.elements.progressText.textContent = text;
        this.elements.progressPercent.textContent = percent + '%';
        this.elements.progressFill.style.width = percent + '%';
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 当弹窗加载完成时初始化
document.addEventListener('DOMContentLoaded', () => {
    new HistoryViewer();
});