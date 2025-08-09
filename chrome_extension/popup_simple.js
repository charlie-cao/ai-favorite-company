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
            exportBtn: document.getElementById('exportBtn')
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
        
        // 时间范围和页面大小变化
        this.elements.timeRange.addEventListener('change', () => {
            this.timeRange = parseInt(this.elements.timeRange.value);
            this.currentPage = 1;
            this.loadHistory();
        });
        
        this.elements.pageSize.addEventListener('change', () => {
            this.pageSize = parseInt(this.elements.pageSize.value);
            this.currentPage = 1;
            this.renderPage();
        });
        
        // 分页按钮
        this.elements.prevBtn.addEventListener('click', () => this.previousPage());
        this.elements.nextBtn.addEventListener('click', () => this.nextPage());
        
        // 导出按钮
        this.elements.exportBtn.addEventListener('click', () => this.simpleExport());
    }
    
    async loadHistory() {
        this.showLoading();
        
        try {
            const endTime = Date.now();
            const startTime = this.timeRange === 0 ? 0 : endTime - (this.timeRange * 24 * 60 * 60 * 1000);
            
            const historyItems = await chrome.history.search({
                text: '',
                startTime: startTime,
                endTime: endTime,
                maxResults: 10000
            });
            
            this.allHistory = historyItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
            this.applyFilters();
            this.renderPage();
            
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.showError('加载历史记录失败');
        }
    }
    
    performSearch() {
        this.searchQuery = this.elements.searchInput.value.trim();
        this.currentPage = 1;
        this.applyFilters();
        this.renderPage();
    }
    
    applyFilters() {
        let filtered = [...this.allHistory];
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                (item.title && item.title.toLowerCase().includes(query)) ||
                item.url.toLowerCase().includes(query)
            );
        }
        
        this.filteredHistory = filtered;
        this.totalItems = filtered.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        if (this.currentPage > this.totalPages) {
            this.currentPage = Math.max(1, this.totalPages);
        }
    }
    
    renderPage() {
        if (this.filteredHistory.length === 0) {
            this.showEmpty();
            return;
        }
        
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        const pageItems = this.filteredHistory.slice(startIndex, endIndex);
        
        const historyHTML = pageItems.map(item => this.createHistoryItemHTML(item)).join('');
        
        this.elements.historyList.innerHTML = historyHTML;
        this.updatePagination();
    }
    
    createHistoryItemHTML(item) {
        const timeStr = this.formatTime(item.lastVisitTime);
        const domain = new URL(item.url).hostname;
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
        
        return `
            <div class="history-item">
                <img src="${favicon}" alt="" class="favicon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkMyMC4yIDIgMjYuMiA4IDI2LjIgMTZTMjAuMiAzMCAxMiAzMFMtMi4yIDI0IC0yLjIgMTZTMy44IDIgMTIgMloiIHN0cm9rZT0iIzk0YTNiOCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+'">
                <div class="history-content">
                    <div class="history-title">
                        <a href="${item.url}" target="_blank" title="${this.escapeHtml(item.title)}">
                            ${this.escapeHtml(item.title) || '无标题'}
                        </a>
                    </div>
                    <div class="history-url">${this.escapeHtml(item.url)}</div>
                    <div class="history-meta">
                        <span class="visit-time">${timeStr}</span>
                        <span class="visit-count">${item.visitCount}次访问</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    updatePagination() {
        this.elements.totalCount.textContent = `共 ${this.totalItems} 条记录`;
        this.elements.currentPage.textContent = this.currentPage;
        this.elements.totalPages.textContent = this.totalPages;
        
        this.elements.prevBtn.disabled = this.currentPage <= 1;
        this.elements.nextBtn.disabled = this.currentPage >= this.totalPages;
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage();
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPage();
        }
    }
    
    showLoading() {
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <div class="loading-spinner">
                        <svg fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <div class="status-title">正在加载历史记录...</div>
                </div>
            </div>
        `;
    }
    
    showError(message) {
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <div class="status-title" style="color: #ef4444;">${message}</div>
                </div>
            </div>
        `;
    }
    
    showEmpty() {
        this.elements.historyList.innerHTML = `
            <div class="status-container">
                <div class="status-content">
                    <div class="status-title">没有找到匹配的历史记录</div>
                </div>
            </div>
        `;
        this.updatePagination();
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 如果是今天
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // 如果是昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // 如果是最近7天
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            return `周${days[date.getDay()]} ${date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }
        
        // 超过7天
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async simpleExport() {
        try {
            const data = this.filteredHistory.map(item => ({
                title: item.title || '无标题',
                url: item.url,
                visitTime: new Date(item.lastVisitTime).toLocaleString('zh-CN'),
                visitCount: item.visitCount || 0
            }));
            
            const csv = this.generateCSV(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `browser_history_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('导出成功！');
        } catch (error) {
            console.error('导出失败:', error);
            alert('导出失败，请重试');
        }
    }
    
    generateCSV(data) {
        const header = '标题,网址,访问时间,访问次数\n';
        const rows = data.map(item => {
            return [
                this.escapeCSV(item.title),
                this.escapeCSV(item.url),
                this.escapeCSV(item.visitTime),
                item.visitCount
            ].join(',');
        }).join('\n');
        
        return '\ufeff' + header + rows; // 添加BOM以支持Excel正确显示中文
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
    new HistoryViewer();
});