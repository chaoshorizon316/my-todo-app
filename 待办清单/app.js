// 待办清单应用 - 核心逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 状态管理
    const state = {
        tasks: JSON.parse(localStorage.getItem('todoTasks')) || [],
        filter: 'all', // all, active, completed
        // 新增状态
        searchQuery: '',
        sortBy: 'createdAt', // createdAt, dueDate, priority, text
        sortOrder: 'desc', // asc, desc
        viewMode: 'list' // list, grid, compact
    };

    // DOM 元素
    const elements = {
        taskInput: document.getElementById('taskInput'),
        addTaskBtn: document.getElementById('addTaskBtn'),
        tasksContainer: document.getElementById('tasksContainer'),
        emptyState: document.getElementById('emptyState'),
        totalTasks: document.getElementById('totalTasks'),
        completedTasks: document.getElementById('completedTasks'),
        clearCompletedBtn: document.getElementById('clearCompletedBtn'),
        clearAllBtn: document.getElementById('clearAllBtn'),
        addExampleBtn: document.getElementById('addExampleBtn'),
        filterStatus: document.getElementById('filterStatus'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        // 新增字段
        taskOptions: document.getElementById('taskOptions'),
        toggleOptionsBtn: document.getElementById('toggleOptionsBtn'),
        categoryButtons: document.querySelectorAll('.category-btn'),
        priorityButtons: document.querySelectorAll('.priority-btn'),
        dueDateInput: document.getElementById('dueDateInput'),
        tagsInput: document.getElementById('tagsInput'),
        notesInput: document.getElementById('notesInput'),
        // 搜索、筛选和排序元素
        searchInput: document.getElementById('searchInput'),
        filterToggleBtn: document.getElementById('filterToggleBtn'),
        filterDropdown: document.getElementById('filterDropdown'),
        categoryFilters: document.querySelectorAll('.category-filter'),
        priorityFilters: document.querySelectorAll('.priority-filter'),
        dueDateFilters: document.querySelectorAll('.due-date-filter'),
        sortSelect: document.getElementById('sortSelect'),
        viewToggleButtons: document.querySelectorAll('.view-toggle-btn')
    };

    // 初始化应用
    function init() {
        loadTasks();
        updateStats();
        setupEventListeners();
    }

    // 初始化任务选项
    function initTaskOptions() {
        // 设置分类按钮默认样式
        elements.categoryButtons.forEach(btn => {
            const isActive = btn.dataset.active === 'true';
            updateButtonStyle(btn, isActive);
        });

        // 设置优先级按钮默认样式
        elements.priorityButtons.forEach(btn => {
            const isActive = btn.dataset.active === 'true';
            updateButtonStyle(btn, isActive);
        });

        // 默认隐藏高级选项
        elements.taskOptions.classList.add('hidden');
    }

    // 设置事件监听器
    function setupEventListeners() {
        // 添加任务
        elements.addTaskBtn.addEventListener('click', addTask);
        elements.taskInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addTask();
        });

        // 筛选任务
        elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;
                setFilter(filter);
            });
        });

        // 清空操作
        elements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        elements.clearAllBtn.addEventListener('click', clearAllTasks);
        elements.addExampleBtn.addEventListener('click', addExampleTasks);

        // 任务选项按钮
        elements.categoryButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                elements.categoryButtons.forEach(b => {
                    b.dataset.active = 'false';
                    updateButtonStyle(b, false);
                });
                this.dataset.active = 'true';
                updateButtonStyle(this, true);
            });
        });

        elements.priorityButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                elements.priorityButtons.forEach(b => {
                    b.dataset.active = 'false';
                    updateButtonStyle(b, false);
                });
                this.dataset.active = 'true';
                updateButtonStyle(this, true);
            });
        });

        // 高级选项切换
        elements.toggleOptionsBtn.addEventListener('click', function() {
            const isHidden = elements.taskOptions.classList.contains('hidden');
            if (isHidden) {
                elements.taskOptions.classList.remove('hidden');
                this.innerHTML = '<i class="fas fa-cog mr-1"></i><span>隐藏选项</span>';
            } else {
                elements.taskOptions.classList.add('hidden');
                this.innerHTML = '<i class="fas fa-cog mr-1"></i><span>高级选项</span>';
            }
        });

        // 搜索功能
        elements.searchInput.addEventListener('input', function() {
            state.searchQuery = this.value.trim();
            renderTasks();
        });

        // 高级筛选切换
        if (elements.filterToggleBtn && elements.filterDropdown) {
            elements.filterToggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const isHidden = elements.filterDropdown.classList.contains('hidden');
                if (isHidden) {
                    elements.filterDropdown.classList.remove('hidden');
                    const icon = this.querySelector('i.fa-chevron-down, i.fa-chevron-up');
                    if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
                } else {
                    elements.filterDropdown.classList.add('hidden');
                    const icon = this.querySelector('i.fa-chevron-down, i.fa-chevron-up');
                    if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            });

            // 点击外部关闭筛选下拉框
            document.addEventListener('click', function(e) {
                if (elements.filterDropdown && elements.filterToggleBtn &&
                    !elements.filterDropdown.contains(e.target) && !elements.filterToggleBtn.contains(e.target)) {
                    elements.filterDropdown.classList.add('hidden');
                    const icon = elements.filterToggleBtn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
                    if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
                }
            });
        }

        // 分类筛选
        elements.categoryFilters.forEach(filter => {
            filter.addEventListener('change', function() {
                if (this.value === 'all' && this.checked) {
                    elements.categoryFilters.forEach(f => {
                        if (f.value !== 'all') f.checked = false;
                    });
                } else if (this.value !== 'all' && this.checked) {
                    const allCheckbox = document.querySelector('.category-filter[value="all"]');
                    if (allCheckbox) allCheckbox.checked = false;
                }
                renderTasks();
            });
        });

        // 优先级筛选
        elements.priorityFilters.forEach(filter => {
            filter.addEventListener('change', function() {
                if (this.value === 'all' && this.checked) {
                    elements.priorityFilters.forEach(f => {
                        if (f.value !== 'all') f.checked = false;
                    });
                } else if (this.value !== 'all' && this.checked) {
                    const allCheckbox = document.querySelector('.priority-filter[value="all"]');
                    if (allCheckbox) allCheckbox.checked = false;
                }
                renderTasks();
            });
        });

        // 截止日期筛选
        elements.dueDateFilters.forEach(filter => {
            filter.addEventListener('change', function() {
                renderTasks();
            });
        });

        // 排序选择
        elements.sortSelect.addEventListener('change', function() {
            const [sortBy, sortOrder] = this.value.split('-');
            state.sortBy = sortBy;
            state.sortOrder = sortOrder;
            renderTasks();
        });

        // 视图切换
        elements.viewToggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const viewMode = this.dataset.view;
                state.viewMode = viewMode;

                elements.viewToggleButtons.forEach(b => {
                    const isActive = b === this;
                    b.dataset.active = isActive ? 'true' : 'false';
                    if (isActive) {
                        b.classList.add('bg-blue-100', 'text-blue-700');
                        b.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
                    } else {
                        b.classList.remove('bg-blue-100', 'text-blue-700');
                        b.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
                    }
                });

                // 更新任务容器类
                elements.tasksContainer.className = 'space-y-4';
                if (viewMode === 'grid') {
                    elements.tasksContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
                } else if (viewMode === 'compact') {
                    elements.tasksContainer.className = 'space-y-2';
                }

                renderTasks();
            });
        });

        // 初始化任务选项
        initTaskOptions();

        // 输入框聚焦
        elements.taskInput.focus();
    }

    // 设置当前筛选状态
    function setFilter(filter) {
        state.filter = filter;

        // 更新按钮状态
        elements.filterButtons.forEach(btn => {
            const btnFilter = btn.dataset.filter;
            if (btnFilter === filter) {
                btn.classList.add('active', 'bg-blue-100', 'text-blue-700');
                btn.classList.remove('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            } else {
                btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
                btn.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            }
        });

        // 更新筛选状态文本
        const filterTexts = {
            all: '全部任务',
            active: '进行中任务',
            completed: '已完成任务'
        };
        elements.filterStatus.textContent = filterTexts[filter] || '全部任务';

        // 重新渲染任务列表
        renderTasks();
    }

    // 添加新任务
    function addTask() {
        const taskText = elements.taskInput.value.trim();

        if (!taskText) {
            showNotification('请输入任务内容', 'warning');
            elements.taskInput.focus();
            return;
        }

        // 获取选中的分类
        const activeCategoryBtn = document.querySelector('.category-btn[data-active="true"]');
        const category = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'personal';

        // 获取选中的优先级
        const activePriorityBtn = document.querySelector('.priority-btn[data-active="true"]');
        const priority = activePriorityBtn ? activePriorityBtn.dataset.priority : 'medium';

        // 获取截止日期
        const dueDate = elements.dueDateInput.value || null;

        // 获取标签并转换为数组
        const tagsText = elements.tagsInput.value.trim();
        const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        // 获取备注
        const notes = elements.notesInput.value.trim();

        const newTask = {
            id: Date.now() + Math.random(), // 更安全的唯一ID
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            // 新增字段
            category: category,
            tags: tags,
            priority: priority,
            dueDate: dueDate,
            notes: notes
        };

        state.tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();

        // 清空输入框并重置高级选项
        elements.taskInput.value = '';
        elements.tagsInput.value = '';
        elements.dueDateInput.value = '';
        elements.notesInput.value = '';

        // 重置分类和优先级到默认值
        resetTaskOptions();

        elements.taskInput.focus();

        showNotification('任务添加成功', 'success');
    }

    // 重置任务选项到默认值
    function resetTaskOptions() {
        // 重置分类按钮
        elements.categoryButtons.forEach(btn => {
            const isPersonal = btn.dataset.category === 'personal';
            btn.dataset.active = isPersonal ? 'true' : 'false';
            updateButtonStyle(btn, isPersonal);
        });

        // 重置优先级按钮
        elements.priorityButtons.forEach(btn => {
            const isMedium = btn.dataset.priority === 'medium';
            btn.dataset.active = isMedium ? 'true' : 'false';
            updateButtonStyle(btn, isMedium);
        });
    }

    // 更新按钮样式
    function updateButtonStyle(button, isActive) {
        // 通用样式类
        const baseClasses = 'px-3 py-1.5 rounded-lg text-sm font-medium transition duration-200';

        if (button.classList.contains('category-btn')) {
            // 移除所有可能的状态类
            button.classList.remove('bg-blue-100', 'text-blue-700', 'border', 'border-blue-300',
                                   'bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');

            // 添加基础类
            button.classList.add(...baseClasses.split(' '));

            if (isActive) {
                button.classList.add('bg-blue-100', 'text-blue-700', 'border', 'border-blue-300');
            } else {
                button.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            }
        } else if (button.classList.contains('priority-btn')) {
            const priority = button.dataset.priority;

            // 移除所有可能的状态类
            button.classList.remove('bg-red-100', 'text-red-700', 'border-red-300',
                                   'bg-yellow-100', 'text-yellow-700', 'border-yellow-300',
                                   'bg-green-100', 'text-green-700', 'border-green-300',
                                   'bg-gray-100', 'text-gray-700', 'hover:bg-gray-200', 'border');

            // 添加基础类
            button.classList.add(...baseClasses.split(' '));

            if (isActive) {
                button.classList.add('border');
                const priorityClasses = {
                    high: ['bg-red-100', 'text-red-700', 'border-red-300'],
                    medium: ['bg-yellow-100', 'text-yellow-700', 'border-yellow-300'],
                    low: ['bg-green-100', 'text-green-700', 'border-green-300']
                };
                button.classList.add(...(priorityClasses[priority] || priorityClasses.medium));
            } else {
                button.classList.add('bg-gray-100', 'text-gray-700', 'hover:bg-gray-200');
            }
        }
    }

    // 切换任务完成状态
    function toggleTaskCompletion(taskId) {
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            updateStats();

            const status = task.completed ? '完成' : '进行中';
            showNotification(`任务标记为${status}`, 'info');
        }
    }

    // 删除任务
    function deleteTask(taskId) {
        const taskIndex = state.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            const deletedTask = state.tasks[taskIndex];
            state.tasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
            updateStats();

            showNotification(`任务"${deletedTask.text}"已删除`, 'info');
        }
    }

    // 清空已完成任务
    function clearCompletedTasks() {
        const completedCount = state.tasks.filter(t => t.completed).length;

        if (completedCount === 0) {
            showNotification('没有已完成的任务', 'info');
            return;
        }

        if (confirm(`确定要删除 ${completedCount} 个已完成的任务吗？`)) {
            state.tasks = state.tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
            updateStats();

            showNotification(`已删除 ${completedCount} 个已完成任务`, 'success');
        }
    }

    // 清空所有任务
    function clearAllTasks() {
        if (state.tasks.length === 0) {
            showNotification('任务列表已经是空的', 'info');
            return;
        }

        if (confirm(`确定要删除全部 ${state.tasks.length} 个任务吗？此操作不可撤销！`)) {
            state.tasks = [];
            saveTasks();
            renderTasks();
            updateStats();

            showNotification('所有任务已清空', 'success');
        }
    }

    // 辅助函数：获取未来日期的字符串（YYYY-MM-DD格式）
    function getDateString(daysFromNow) {
        const date = new Date();
        date.setDate(date.getDate() + daysFromNow);
        return date.toISOString().split('T')[0];
    }

    // 添加示例任务
    function addExampleTasks() {
        const exampleTasks = [
            { text: '完成项目报告', completed: false, category: 'work', priority: 'high', tags: ['工作', '项目'], dueDate: getDateString(1) },
            { text: '学习JavaScript高级概念', completed: true, category: 'study', priority: 'medium', tags: ['学习', '编程'], dueDate: null },
            { text: '健身30分钟', completed: false, category: 'health', priority: 'medium', tags: ['健康', '运动'], dueDate: getDateString(0) },
            { text: '阅读30页书籍', completed: false, category: 'personal', priority: 'low', tags: ['阅读', '休闲'], dueDate: getDateString(7) },
            { text: '整理工作桌面', completed: true, category: 'personal', priority: 'low', tags: ['整理'], dueDate: null }
        ];

        exampleTasks.forEach(taskData => {
            const newTask = {
                id: Date.now() + Math.random(),
                text: taskData.text,
                completed: taskData.completed,
                createdAt: new Date().toISOString(),
                category: taskData.category,
                tags: taskData.tags,
                priority: taskData.priority,
                dueDate: taskData.dueDate,
                notes: ''
            };
            state.tasks.unshift(newTask);
        });

        saveTasks();
        renderTasks();
        updateStats();

        showNotification('示例任务添加成功', 'success');
        elements.taskInput.focus();
    }

    // 保存任务到本地存储
    function saveTasks() {
        localStorage.setItem('todoTasks', JSON.stringify(state.tasks));
    }

    // 加载任务并确保数据兼容性
    function loadTasks() {
        // 确保每个任务都有新的字段（向后兼容）
        state.tasks = state.tasks.map(task => {
            return {
                id: task.id || Date.now() + Math.random(),
                text: task.text || '',
                completed: task.completed || false,
                createdAt: task.createdAt || new Date().toISOString(),
                // 新增字段（如果不存在则使用默认值）
                category: task.category || 'personal',
                tags: task.tags || [],
                priority: task.priority || 'medium',
                dueDate: task.dueDate || null,
                notes: task.notes || ''
            };
        });
        renderTasks();
    }

    // 渲染任务列表
    function renderTasks() {
        // 应用所有筛选条件
        let filteredTasks = state.tasks.filter(task => {
            // 完成状态筛选
            if (state.filter === 'active' && task.completed) return false;
            if (state.filter === 'completed' && !task.completed) return false;

            // 搜索筛选
            if (state.searchQuery) {
                const query = state.searchQuery.toLowerCase();
                const inText = task.text.toLowerCase().includes(query);
                const inTags = task.tags.some(tag => tag.toLowerCase().includes(query));
                const inNotes = task.notes.toLowerCase().includes(query);
                if (!inText && !inTags && !inNotes) return false;
            }

            // 分类筛选
            const selectedCategories = Array.from(elements.categoryFilters)
                .filter(f => f.checked && f.value !== 'all')
                .map(f => f.value);
            if (selectedCategories.length > 0 && !selectedCategories.includes(task.category)) {
                return false;
            }

            // 优先级筛选
            const selectedPriorities = Array.from(elements.priorityFilters)
                .filter(f => f.checked && f.value !== 'all')
                .map(f => f.value);
            if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
                return false;
            }

            // 截止日期筛选
            const selectedDueDateFilter = document.querySelector('input[name="dueDateFilter"]:checked');
            if (selectedDueDateFilter && selectedDueDateFilter.value !== 'all') {
                const dueDateStatus = getDueDateStatus(task.dueDate);
                if (selectedDueDateFilter.value === 'overdue' && dueDateStatus !== 'overdue') return false;
                if (selectedDueDateFilter.value === 'upcoming' && dueDateStatus !== 'upcoming') return false;
                if (selectedDueDateFilter.value === 'future' && dueDateStatus !== 'future') return false;
                if (selectedDueDateFilter.value === 'none' && task.dueDate !== null) return false;
            }

            return true;
        });

        // 应用排序
        filteredTasks.sort((a, b) => {
            let aValue, bValue;

            // 获取比较值
            switch (state.sortBy) {
                case 'dueDate':
                    aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                    bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                    // 无截止日期的任务排在有截止日期的后面
                    if (!a.dueDate) aValue = Infinity;
                    if (!b.dueDate) bValue = Infinity;
                    break;
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    aValue = priorityOrder[a.priority] || 0;
                    bValue = priorityOrder[b.priority] || 0;
                    break;
                case 'text':
                    aValue = a.text.toLowerCase();
                    bValue = b.text.toLowerCase();
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
            }

            // 应用排序顺序
            if (state.sortOrder === 'asc') {
                if (typeof aValue === 'string') {
                    return aValue.localeCompare(bValue);
                }
                return aValue - bValue;
            } else {
                if (typeof aValue === 'string') {
                    return bValue.localeCompare(aValue);
                }
                return bValue - aValue;
            }
        });

        // 清空容器
        elements.tasksContainer.innerHTML = '';

        // 显示/隐藏空状态
        if (filteredTasks.length === 0) {
            elements.emptyState.style.display = 'block';
            elements.tasksContainer.appendChild(elements.emptyState);
            return;
        } else {
            elements.emptyState.style.display = 'none';
        }

        // 渲染每个任务
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            elements.tasksContainer.appendChild(taskElement);
        });
    }

    // 获取分类显示名称
    function getCategoryDisplayName(category) {
        const names = {
            personal: '个人',
            work: '工作',
            study: '学习',
            shopping: '购物',
            health: '健康'
        };
        return names[category] || category;
    }

    // 获取优先级显示名称
    function getPriorityDisplayName(priority) {
        const names = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return names[priority] || priority;
    }

    // 计算截止日期状态
    function getDueDateStatus(dueDate) {
        if (!dueDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return 'overdue';
        if (diffDays <= 3) return 'upcoming';
        return 'future';
    }

    // 格式化日期显示
    function formatDueDateDisplay(dueDate) {
        if (!dueDate) return null;

        const date = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            return date.toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
            });
        }
    }

    // 创建任务元素
    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 ${task.completed ? 'opacity-75' : ''}`;
        taskEl.dataset.id = task.id;

        // 创建时间显示
        const createdAt = new Date(task.createdAt);
        const createdStr = createdAt.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // 截止日期信息
        const dueDateStatus = getDueDateStatus(task.dueDate);
        const dueDateDisplay = formatDueDateDisplay(task.dueDate);
        let dueDateClass = 'due-date';
        let dueDateIcon = 'far fa-calendar';
        if (dueDateStatus === 'overdue') {
            dueDateClass += ' overdue';
            dueDateIcon = 'fas fa-exclamation-circle';
        } else if (dueDateStatus === 'upcoming') {
            dueDateClass += ' upcoming';
            dueDateIcon = 'fas fa-clock';
        }

        taskEl.innerHTML = `
            <div class="flex items-start">
                <!-- 完成状态复选框 -->
                <div class="mr-4 mt-1">
                    <button class="complete-btn w-6 h-6 rounded-full border-2 flex items-center justify-center transition duration-200 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'}"
                        title="${task.completed ? '标记为未完成' : '标记为完成'}">
                        ${task.completed ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                    </button>
                </div>

                <!-- 任务内容 -->
                <div class="flex-grow">
                    <div class="flex items-center flex-wrap gap-2 mb-2">
                        <!-- 分类徽章 -->
                        <span class="category-badge category-${task.category}">
                            <i class="fas ${getCategoryIcon(task.category)} mr-1"></i>
                            ${getCategoryDisplayName(task.category)}
                        </span>

                        <!-- 优先级指示器 -->
                        <span class="flex items-center text-xs font-medium">
                            <span class="priority-indicator priority-${task.priority}"></span>
                            ${getPriorityDisplayName(task.priority)}优先级
                        </span>

                        <!-- 截止日期 -->
                        ${task.dueDate ? `
                            <span class="${dueDateClass}">
                                <i class="${dueDateIcon} mr-1"></i>
                                ${dueDateDisplay}
                                ${dueDateStatus === 'overdue' ? ' (已过期)' : ''}
                            </span>
                        ` : ''}
                    </div>

                    <!-- 任务文本 -->
                    <div class="task-content cursor-pointer ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'} mb-2"
                        title="点击标记为${task.completed ? '未完成' : '完成'}">
                        ${escapeHtml(task.text)}
                    </div>

                    <!-- 标签列表 -->
                    ${task.tags && task.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mb-2">
                            ${task.tags.map(tag => `
                                <span class="tag-badge">
                                    <i class="fas fa-tag mr-1 text-xs"></i>${escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}

                    <!-- 备注 -->
                    ${task.notes ? `
                        <div class="text-sm text-gray-600 bg-gray-100 rounded p-2 mb-2">
                            <i class="far fa-sticky-note mr-2"></i>
                            ${escapeHtml(task.notes)}
                        </div>
                    ` : ''}

                    <!-- 元信息 -->
                    <div class="flex justify-between items-center text-xs text-gray-400">
                        <div>
                            <i class="far fa-clock mr-1"></i> ${createdStr}
                        </div>
                        ${task.dueDate ? `
                            <div class="${dueDateClass}">
                                <i class="far fa-calendar-alt mr-1"></i>
                                截止: ${task.dueDate}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- 删除按钮 -->
                <div class="ml-4">
                    <button class="delete-btn text-gray-400 hover:text-red-500 transition duration-200 p-2 rounded-full hover:bg-red-50"
                        title="删除任务">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        // 添加事件监听
        const completeBtn = taskEl.querySelector('.complete-btn');
        const taskContent = taskEl.querySelector('.task-content');
        const deleteBtn = taskEl.querySelector('.delete-btn');

        completeBtn.addEventListener('click', () => toggleTaskCompletion(task.id));
        taskContent.addEventListener('click', () => toggleTaskCompletion(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));

        return taskEl;
    }

    // 获取分类图标
    function getCategoryIcon(category) {
        const icons = {
            personal: 'fa-user',
            work: 'fa-briefcase',
            study: 'fa-graduation-cap',
            shopping: 'fa-shopping-cart',
            health: 'fa-heart'
        };
        return icons[category] || 'fa-folder';
    }

    // 更新统计信息
    function updateStats() {
        const total = state.tasks.length;
        const completed = state.tasks.filter(t => t.completed).length;

        elements.totalTasks.textContent = total;
        elements.completedTasks.textContent = completed;
    }

    // 显示通知
    function showNotification(message, type = 'info') {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 opacity-0 translate-y-2`;

        const typeClasses = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };

        notification.className += ` ${typeClasses[type] || typeClasses.info}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${getNotificationIcon(type)} mr-3"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // 显示动画
        requestAnimationFrame(() => {
            notification.classList.remove('opacity-0', 'translate-y-2');
            notification.classList.add('opacity-100', 'translate-y-0');
        });

        // 3秒后自动隐藏
        setTimeout(() => {
            notification.classList.remove('opacity-100', 'translate-y-0');
            notification.classList.add('opacity-0', 'translate-y-2');

            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // 获取通知图标
    function getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // HTML转义防止XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 启动应用
    init();
});