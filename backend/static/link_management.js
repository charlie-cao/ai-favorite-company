class LinkManager {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 100;
        this.selectedItems = new Set();
        this.currentData = [];
        this.categories = [];
        
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // 搜索和筛选
        document.getElementById('searchInput').addEventListener('input', () => this.debounce(() => this.loadData(), 300));
        document.getElementById('categoryFilter').addEventListener('change', () => this.loadData());
        document.getElementById('sortBy').addEventListener('change', () => this.loadData());
        document.getElementById('sortOrder').addEventListener('change', () => this.loadData());
        document.getElementById('showHidden').addEventListener('change', () => this.loadData());
        document.getElementById('showInvalid').addEventListener('change', () => this.loadData());

        // 批量操作
        document.getElementById('selectAll').addEventListener('click', () => this.selectAll());
        document.getElementById('selectAllCheckbox').addEventListener('change', (e) => this.toggleSelectAll(e.target.checked));
        document.getElementById('sendToAgent').addEventListener('click', () => this.sendToAgentStudio());
        document.getElementById('batchHide').addEventListener('click', () => this.batchOperation('hide'));
        document.getElementById('batchInvalid').addEventListener('click', () => this.batchOperation('mark_invalid'));
        document.getElementById('batchCategorize').addEventListener('click', () => this.showCategorizeModal());
        document.getElementById('deduplicateBtn').addEventListener('click', () => this.deduplicate());

        // 分页
        document.getElementById('prevPage').addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPage').addEventListener('click', () => this.changePage(1));
        document.getElementById('pageSize').addEventListener('change', (e) => {
            this.pageSize = parseInt(e.target.value);
            this.currentPage = 1;
            this.loadData();
        });

        // 模态框
        document.getElementById('modalCancel').addEventListener('click', () => this.hideModal());
        document.getElementById('modalConfirm').addEventListener('click', () => this.confirmModalAction());
    }

    async loadData() {
        this.showLoading();
        try {
            const params = new URLSearchParams({
                limit: this.pageSize,
                offset: (this.currentPage - 1) * this.pageSize,
                search: document.getElementById('searchInput').value,
                category: document.getElementById('categoryFilter').value,
                show_hidden: document.getElementById('showHidden').checked,
                show_invalid: document.getElementById('showInvalid').checked,
                sort_by: document.getElementById('sortBy').value,
                sort_order: document.getElementById('sortOrder').value
            });

            const response = await fetch(`/api/links/enhanced?${params}`);
            const result = await response.json();

            if (result.success) {
                this.currentData = result.data.records;
                this.categories = result.data.categories;
                this.updateTable();
                this.updateCategories();
                this.updatePagination();
                this.selectedItems.clear();
                this.updateSelectedCount();
            } else {
                this.showError('加载数据失败: ' + result.message);
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            this.showError('网络错误，请重试');
        } finally {
            this.hideLoading();
        }
    }

    updateTable() {
        const tbody = document.getElementById('linkTableBody');
        tbody.innerHTML = '';

        this.currentData.forEach(item => {
            const row = this.createTableRow(item);
            tbody.appendChild(row);
        });
    }

    createTableRow(item) {
        const row = document.createElement('tr');
        row.className = `hover:bg-gray-50 ${item.isHidden ? 'bg-yellow-50' : ''} ${item.isInvalid ? 'bg-red-50' : ''}`;
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" class="row-checkbox rounded" data-id="${item.id}">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex space-x-1">
                    ${item.isHidden ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">隐藏</span>' : ''}
                    ${item.isInvalid ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">无效</span>' : ''}
                    ${!item.isHidden && !item.isInvalid ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">正常</span>' : ''}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900 truncate max-w-xs" title="${item.title || '无标题'}">
                    ${item.title || '无标题'}
                </div>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm text-blue-600 truncate max-w-xs">
                    <a href="${item.url}" target="_blank" class="hover:underline" title="${item.url}">
                        ${item.url}
                    </a>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    ${item.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${item.visitCount}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${this.formatDate(item.lastVisitTime)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex space-x-2">
                    <button class="text-green-600 hover:text-green-900" onclick="linkManager.sendSingleToAgent('${item.url}')" title="发送到Agent工作台">
                        🚀
                    </button>
                    <button class="text-blue-600 hover:text-blue-900" onclick="linkManager.toggleHide(${item.id}, ${item.isHidden})">
                        ${item.isHidden ? '显示' : '隐藏'}
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="linkManager.toggleInvalid(${item.id}, ${item.isInvalid})">
                        ${item.isInvalid ? '标记有效' : '标记无效'}
                    </button>
                    <button class="text-purple-600 hover:text-purple-900" onclick="linkManager.editCategory(${item.id}, '${item.category}')">
                        编辑分类
                    </button>
                </div>
            </td>
        `;

        // 添加复选框事件监听
        const checkbox = row.querySelector('.row-checkbox');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.selectedItems.add(parseInt(e.target.dataset.id));
            } else {
                this.selectedItems.delete(parseInt(e.target.dataset.id));
            }
            this.updateSelectedCount();
        });

        return row;
    }

    updateCategories() {
        const categoryFilter = document.getElementById('categoryFilter');
        const currentValue = categoryFilter.value;
        
        categoryFilter.innerHTML = '<option value="">全部分类</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            if (category === currentValue) {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });
    }

    updatePagination() {
        const currentStart = (this.currentPage - 1) * this.pageSize + 1;
        const currentEnd = Math.min(this.currentPage * this.pageSize, this.currentData.length);
        
        document.getElementById('currentStart').textContent = currentStart;
        document.getElementById('currentEnd').textContent = currentEnd;
        document.getElementById('totalRecords').textContent = this.currentData.length;
        document.getElementById('pageInfo').textContent = `第 ${this.currentPage} 页`;
        
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = currentEnd >= this.currentData.length;
    }

    changePage(direction) {
        const newPage = this.currentPage + direction;
        if (newPage >= 1) {
            this.currentPage = newPage;
            this.loadData();
        }
    }

    selectAll() {
        this.selectedItems.clear();
        this.currentData.forEach(item => this.selectedItems.add(item.id));
        
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });
        
        this.updateSelectedCount();
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.selectAll();
        } else {
            this.selectedItems.clear();
            document.querySelectorAll('.row-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            this.updateSelectedCount();
        }
    }

    updateSelectedCount() {
        document.getElementById('selectedCount').textContent = this.selectedItems.size;
    }

    sendToAgentStudio() {
        if (this.selectedItems.size === 0) {
            this.showError('请先选择要发送的链接');
            return;
        }

        // 获取选中的链接URLs
        const selectedUrls = [];
        this.currentData.forEach(item => {
            if (this.selectedItems.has(item.id)) {
                selectedUrls.push(item.url);
            }
        });

        if (selectedUrls.length === 0) {
            this.showError('没有找到有效的链接');
            return;
        }

        this._sendUrlsToAgent(selectedUrls);
    }

    sendSingleToAgent(url) {
        // 发送单个链接到Agent工作台
        this._sendUrlsToAgent([url]);
    }

    _sendUrlsToAgent(urls) {
        // 将URLs存储到localStorage，以便Agent工作台读取
        const linkData = {
            urls: urls,
            timestamp: Date.now(),
            source: 'link_management'
        };
        
        localStorage.setItem('pendingAgentUrls', JSON.stringify(linkData));
        
        // 显示确认信息并跳转
        this.showSuccess(`已选择 ${urls.length} 个链接，正在跳转到Agent工作台...`);
        
        // 延迟跳转，让用户看到成功消息
        setTimeout(() => {
            window.open('/studio', '_blank');
        }, 1000);
    }

    async batchOperation(action) {
        if (this.selectedItems.size === 0) {
            this.showError('请先选择要操作的链接');
            return;
        }

        const actionNames = {
            'hide': '隐藏',
            'show': '显示',
            'mark_invalid': '标记为无效',
            'mark_valid': '标记为有效'
        };

        if (confirm(`确定要${actionNames[action]}选中的 ${this.selectedItems.size} 个链接吗？`)) {
            try {
                const response = await fetch('/api/links/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url_ids: Array.from(this.selectedItems),
                        action: action
                    })
                });

                const result = await response.json();
                if (result.success) {
                    this.showSuccess(result.message);
                    this.loadData();
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('批量操作失败:', error);
                this.showError('操作失败，请重试');
            }
        }
    }

    async toggleHide(id, isCurrentlyHidden) {
        const action = isCurrentlyHidden ? 'show' : 'hide';
        await this.singleOperation(id, action);
    }

    async toggleInvalid(id, isCurrentlyInvalid) {
        const action = isCurrentlyInvalid ? 'mark_valid' : 'mark_invalid';
        await this.singleOperation(id, action);
    }

    async singleOperation(id, action) {
        try {
            const response = await fetch('/api/links/manage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url_ids: [id],
                    action: action
                })
            });

            const result = await response.json();
            if (result.success) {
                this.loadData();
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            console.error('操作失败:', error);
            this.showError('操作失败，请重试');
        }
    }

    showCategorizeModal() {
        if (this.selectedItems.size === 0) {
            this.showError('请先选择要分类的链接');
            return;
        }

        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = '批量分类';
        modalContent.innerHTML = `
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    选择分类（已选择 ${this.selectedItems.size} 个链接）
                </label>
                <select id="batchCategorySelect" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
                    <option value="">选择现有分类...</option>
                    ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    或创建新分类
                </label>
                <input type="text" id="newCategoryInput" placeholder="输入新分类名称..." 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500">
            </div>
        `;

        this.currentModalAction = 'categorize';
        this.showModal();
    }

    async editCategory(id, currentCategory) {
        const newCategory = prompt('请输入新的分类名称:', currentCategory);
        if (newCategory !== null && newCategory.trim() !== '') {
            try {
                const response = await fetch('/api/links/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url_ids: [id],
                        action: 'categorize',
                        value: newCategory.trim()
                    })
                });

                const result = await response.json();
                if (result.success) {
                    this.loadData();
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('分类操作失败:', error);
                this.showError('操作失败，请重试');
            }
        }
    }

    async deduplicate() {
        if (confirm('确定要删除所有重复的链接吗？此操作不可撤销。')) {
            this.showLoading();
            try {
                const response = await fetch('/api/links/deduplicate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();
                if (result.success) {
                    this.showSuccess(`成功去重，删除了 ${result.data.removed_count} 条重复记录`);
                    this.loadData();
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('去重失败:', error);
                this.showError('去重失败，请重试');
            } finally {
                this.hideLoading();
            }
        }
    }

    async confirmModalAction() {
        if (this.currentModalAction === 'categorize') {
            const selectElement = document.getElementById('batchCategorySelect');
            const inputElement = document.getElementById('newCategoryInput');
            
            const selectedCategory = selectElement.value;
            const newCategory = inputElement.value.trim();
            
            const category = newCategory || selectedCategory;
            
            if (!category) {
                this.showError('请选择或输入分类名称');
                return;
            }

            try {
                const response = await fetch('/api/links/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url_ids: Array.from(this.selectedItems),
                        action: 'categorize',
                        value: category
                    })
                });

                const result = await response.json();
                if (result.success) {
                    this.showSuccess(result.message);
                    this.hideModal();
                    this.loadData();
                } else {
                    this.showError(result.message);
                }
            } catch (error) {
                console.error('分类操作失败:', error);
                this.showError('操作失败，请重试');
            }
        }
    }

    showModal() {
        document.getElementById('batchModal').classList.remove('hidden');
        document.getElementById('batchModal').classList.add('flex');
    }

    hideModal() {
        document.getElementById('batchModal').classList.add('hidden');
        document.getElementById('batchModal').classList.remove('flex');
    }

    formatDate(timestamp) {
        if (!timestamp) return '未知';
        const date = new Date(timestamp);
        return date.toLocaleString('zh-CN');
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
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    debounce(func, wait) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(func, wait);
    }
}

// 初始化链接管理器
const linkManager = new LinkManager();