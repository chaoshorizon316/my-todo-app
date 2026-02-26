// 待办清单应用 - 核心逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 状态管理
    const state = {
        tasks: JSON.parse(localStorage.getItem('todoTasks')) || [],
        filter: 'all' // all, active, completed
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
        filterButtons: document.querySelectorAll('.filter-btn')
    };

    // 初始化应用
    function init() {
        loadTasks();
        updateStats();
        setupEventListeners();
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

        const newTask = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString()
        };

        state.tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();

        // 清空输入框并聚焦
        elements.taskInput.value = '';
        elements.taskInput.focus();

        showNotification('任务添加成功', 'success');
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

    // 添加示例任务
    function addExampleTasks() {
        const exampleTasks = [
            { text: '完成项目报告', completed: false },
            { text: '学习JavaScript高级概念', completed: true },
            { text: '健身30分钟', completed: false },
            { text: '阅读30页书籍', completed: false },
            { text: '整理工作桌面', completed: true }
        ];

        exampleTasks.forEach(taskData => {
            const newTask = {
                id: Date.now() + Math.random(),
                text: taskData.text,
                completed: taskData.completed,
                createdAt: new Date().toISOString()
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

    // 加载任务
    function loadTasks() {
        renderTasks();
    }

    // 渲染任务列表
    function renderTasks() {
        // 根据筛选条件过滤任务
        let filteredTasks = state.tasks;
        if (state.filter === 'active') {
            filteredTasks = state.tasks.filter(t => !t.completed);
        } else if (state.filter === 'completed') {
            filteredTasks = state.tasks.filter(t => t.completed);
        }

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

    // 创建任务元素
    function createTaskElement(task) {
        const taskEl = document.createElement('div');
        taskEl.className = `task-item bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-all duration-200 ${task.completed ? 'opacity-75' : ''}`;
        taskEl.dataset.id = task.id;

        const date = new Date(task.createdAt);
        const dateStr = date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

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
                    <div class="task-content cursor-pointer ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}"
                        title="点击标记为${task.completed ? '未完成' : '完成'}">
                        ${escapeHtml(task.text)}
                    </div>
                    <div class="text-xs text-gray-400 mt-2">
                        <i class="far fa-clock mr-1"></i> ${dateStr}
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