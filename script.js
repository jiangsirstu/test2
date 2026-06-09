// 學習歷程記錄應用

// 數據管理
const LearningApp = {
    storageKey: 'learningRecords',
    editingId: null,

    // 初始化應用
    init() {
        this.setupEventListeners();
        this.setDefaultDate();
        this.render();
    },

    // 設置事件監聽
    setupEventListeners() {
        document.getElementById('learningForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRecord();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cancelEdit();
        });

        document.getElementById('searchInput').addEventListener('input', () => {
            this.render();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.render();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAll();
        });
    },

    // 設置默認日期為今天
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    },

    // 獲取所有記錄
    getRecords() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    },

    // 保存記錄到 LocalStorage
    setRecords(records) {
        localStorage.setItem(this.storageKey, JSON.stringify(records));
    },

    // 獲取表單數據
    getFormData() {
        return {
            subject: document.getElementById('subject').value.trim(),
            topic: document.getElementById('topic').value.trim(),
            hours: parseFloat(document.getElementById('hours').value),
            date: document.getElementById('date').value,
            difficulty: document.getElementById('difficulty').value,
            notes: document.getElementById('notes').value.trim(),
            completed: document.getElementById('completed').checked,
            id: this.editingId || Date.now().toString(),
            createdAt: this.editingId ? this.findRecordById(this.editingId).createdAt : new Date().toISOString()
        };
    },

    // 清空表單
    clearForm() {
        document.getElementById('learningForm').reset();
        this.setDefaultDate();
        document.getElementById('completed').checked = false;
    },

    // 保存記錄
    saveRecord() {
        const data = this.getFormData();

        // 驗證
        if (!data.subject || !data.topic || !data.hours) {
            alert('請填寫所有必填項目');
            return;
        }

        if (data.hours <= 0) {
            alert('學習時數必須大於 0');
            return;
        }

        const records = this.getRecords();

        if (this.editingId) {
            // 編輯現有記錄
            const index = records.findIndex(r => r.id === this.editingId);
            if (index !== -1) {
                records[index] = data;
            }
            this.cancelEdit();
        } else {
            // 添加新記錄
            records.push(data);
        }

        this.setRecords(records);
        this.clearForm();
        this.render();
        this.showNotification('✅ 記錄已保存');
    },

    // 編輯記錄
    editRecord(id) {
        const record = this.findRecordById(id);
        if (!record) return;

        this.editingId = id;

        document.getElementById('subject').value = record.subject;
        document.getElementById('topic').value = record.topic;
        document.getElementById('hours').value = record.hours;
        document.getElementById('date').value = record.date;
        document.getElementById('difficulty').value = record.difficulty;
        document.getElementById('notes').value = record.notes;
        document.getElementById('completed').checked = record.completed;

        // 顯示取消按鈕
        document.getElementById('cancelBtn').style.display = 'block';

        // 滾動到表單
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    },

    // 取消編輯
    cancelEdit() {
        this.editingId = null;
        this.clearForm();
        document.getElementById('cancelBtn').style.display = 'none';
    },

    // 刪除記錄
    deleteRecord(id) {
        if (!confirm('確定要刪除此記錄嗎？')) {
            return;
        }

        const records = this.getRecords();
        const filteredRecords = records.filter(r => r.id !== id);
        this.setRecords(filteredRecords);
        this.render();
        this.showNotification('🗑️ 記錄已刪除');
    },

    // 查找記錄
    findRecordById(id) {
        return this.getRecords().find(r => r.id === id);
    },

    // 清空所有記錄
    clearAll() {
        if (!confirm('確定要清空所有學習記錄嗎？此操作無法撤銷！')) {
            return;
        }

        localStorage.removeItem(this.storageKey);
        this.cancelEdit();
        this.render();
        this.showNotification('🗑️ 已清空所有記錄');
    },

    // 篩選和排序記錄
    getFilteredAndSortedRecords() {
        let records = this.getRecords();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const sortBy = document.getElementById('sortBy').value;

        // 篩選
        if (searchTerm) {
            records = records.filter(r =>
                r.subject.toLowerCase().includes(searchTerm) ||
                r.topic.toLowerCase().includes(searchTerm) ||
                r.notes.toLowerCase().includes(searchTerm)
            );
        }

        // 排序
        switch (sortBy) {
            case 'date-asc':
                records.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'subject':
                records.sort((a, b) => a.subject.localeCompare(b.subject, 'zh-TW'));
                break;
            case 'hours-desc':
                records.sort((a, b) => b.hours - a.hours);
                break;
            case 'hours-asc':
                records.sort((a, b) => a.hours - b.hours);
                break;
            case 'date-desc':
            default:
                records.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return records;
    },

    // 計算統計信息
    calculateStats() {
        const records = this.getRecords();

        const stats = {
            totalRecords: records.length,
            totalHours: records.reduce((sum, r) => sum + r.hours, 0),
            uniqueSubjects: new Set(records.map(r => r.subject)).size,
            completedTasks: records.filter(r => r.completed).length
        };

        return stats;
    },

    // 計算科目進度
    calculateSubjectProgress() {
        const records = this.getRecords();
        const subjectMap = {};

        records.forEach(record => {
            if (!subjectMap[record.subject]) {
                subjectMap[record.subject] = {
                    subject: record.subject,
                    totalRecords: 0,
                    totalHours: 0,
                    completedCount: 0,
                    difficulties: { 簡單: 0, 中等: 0, 困難: 0 }
                };
            }

            subjectMap[record.subject].totalRecords++;
            subjectMap[record.subject].totalHours += record.hours;
            if (record.completed) {
                subjectMap[record.subject].completedCount++;
            }
            subjectMap[record.subject].difficulties[record.difficulty]++;
        });

        return Object.values(subjectMap).sort((a, b) => b.totalHours - a.totalHours);
    },

    // 渲染整個應用
    render() {
        this.updateStats();
        this.renderRecords();
        this.renderProgress();
    },

    // 更新統計信息
    updateStats() {
        const stats = this.calculateStats();

        document.getElementById('totalRecords').textContent = stats.totalRecords;
        document.getElementById('totalHours').textContent = stats.totalHours.toFixed(1);
        document.getElementById('uniqueSubjects').textContent = stats.uniqueSubjects;
        document.getElementById('completedTasks').textContent = stats.completedTasks;
    },

    // 渲染記錄列表
    renderRecords() {
        const records = this.getFilteredAndSortedRecords();
        const recordsList = document.getElementById('recordsList');

        if (records.length === 0) {
            recordsList.innerHTML = `
                <div class="empty-state">
                    <p>還沒有學習記錄</p>
                    <p class="empty-hint">開始新增第一條學習記錄吧！</p>
                </div>
            `;
            return;
        }

        recordsList.innerHTML = records.map(record => {
            const formattedDate = new Date(record.date).toLocaleDateString('zh-TW');

            return `
                <div class="record-item ${record.completed ? 'completed' : ''}">
                    <div class="record-header">
                        <div class="record-title">
                            <div class="record-subject">
                                ${record.subject}
                                ${record.completed ? '<span class="completed-badge">✓ 已完成</span>' : ''}
                            </div>
                            <div class="record-topic">${record.topic}</div>
                        </div>
                    </div>
                    <div class="record-meta">
                        <span class="meta-item">📅 ${formattedDate}</span>
                        <span class="meta-item">⏱️ ${record.hours} 小時</span>
                        <span class="difficulty-badge ${record.difficulty}">${record.difficulty}</span>
                    </div>
                    ${record.notes ? `<div class="record-notes">📝 ${this.escapeHtml(record.notes)}</div>` : ''}
                    <div class="record-actions">
                        <button class="btn-edit" onclick="LearningApp.editRecord('${record.id}')">✏️ 編輯</button>
                        <button class="btn-delete" onclick="LearningApp.deleteRecord('${record.id}')">🗑️ 刪除</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 渲染進度統計
    renderProgress() {
        const progressData = this.calculateSubjectProgress();
        const progressList = document.getElementById('progressList');

        if (progressData.length === 0) {
            progressList.innerHTML = `
                <div class="empty-state">
                    <p>還沒有進度數據</p>
                </div>
            `;
            return;
        }

        progressList.innerHTML = progressData.map(item => {
            const completionRate = ((item.completedCount / item.totalRecords) * 100).toFixed(0);

            return `
                <div class="progress-item">
                    <div class="progress-subject">
                        <span>${item.subject}</span>
                        <span style="font-size: 0.9em; color: var(--text-light); font-weight: normal;">
                            完成度: ${completionRate}%
                        </span>
                    </div>
                    <div class="progress-stats">
                        <div class="progress-stat">
                            <div class="progress-stat-value">${item.totalHours.toFixed(1)}</div>
                            <div class="progress-stat-label">總時數</div>
                        </div>
                        <div class="progress-stat">
                            <div class="progress-stat-value">${item.totalRecords}</div>
                            <div class="progress-stat-label">學習次數</div>
                        </div>
                        <div class="progress-stat">
                            <div class="progress-stat-value">${item.completedCount}</div>
                            <div class="progress-stat-label">已完成</div>
                        </div>
                        <div class="progress-stat">
                            <div class="progress-stat-value" style="color: var(--warning-color); font-size: 1em;">
                                🟢${item.difficulties['簡單']} 🟡${item.difficulties['中等']} 🔴${item.difficulties['困難']}
                            </div>
                            <div class="progress-stat-label">難度分布</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 顯示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--secondary-color);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    },

    // 轉義 HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// 頁面加載時初始化應用
document.addEventListener('DOMContentLoaded', () => {
    LearningApp.init();
});
