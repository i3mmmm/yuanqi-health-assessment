// 管理后台前端改造 - 从API获取数据
// 将此代码插入到 health_assessment_backend_complete.html 中

// ==================== 后台API配置 ====================
const AdminAPIConfig = {
    baseURL: 'http://localhost:3000', // 生产环境改为实际API域名
    endpoints: {
        login: '/api/auth/login',
        assessments: '/api/assessments',
        assessmentDetail: '/api/assessments/',
        reports: '/api/reports',
        reportsGenerate: '/api/reports/generate/',
        analysis: '/api/analysis/',
        users: '/api/users',
        stats: '/api/stats'
    }
};

// ==================== 后台Token管理 ====================
const AdminTokenManager = {
    saveToken(token, userInfo) {
        try {
            localStorage.setItem('yuanqi_admin_token', token);
            localStorage.setItem('yuanqi_admin_user_info', JSON.stringify(userInfo));
            
            // 解析token保存过期时间
            const payload = this.parseToken(token);
            if (payload && payload.exp) {
                localStorage.setItem('yuanqi_admin_token_expires', payload.exp * 1000);
            }
        } catch (e) {
            console.error('保存Token失败:', e);
        }
    },

    getToken() {
        return localStorage.getItem('yuanqi_admin_token');
    },

    removeToken() {
        localStorage.removeItem('yuanqi_admin_token');
        localStorage.removeItem('yuanqi_admin_user_info');
        localStorage.removeItem('yuanqi_admin_token_expires');
    },

    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        const expires = localStorage.getItem('yuanqi_admin_token_expires');
        if (!expires) return true;

        return Date.now() > parseInt(expires);
    },

    parseToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('解析Token失败:', e);
            return null;
        }
    },

    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`
        };
    },

    getUserInfo() {
        const userInfo = localStorage.getItem('yuanqi_admin_user_info');
        if (userInfo) {
            try {
                return JSON.parse(userInfo);
            } catch (e) {
                console.error('解析用户信息失败:', e);
            }
        }
        return null;
    }
};

// ==================== 后台API请求 ====================
const AdminAPI = {
    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...AdminTokenManager.getAuthHeaders()
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${AdminAPIConfig.baseURL}${url}`, mergedOptions);
            const data = await response.json();

            // Token过期，自动跳转登录
            if (data.code === 401) {
                AdminTokenManager.removeToken();
                window.location.href = '/admin/login.html?redirect=' + encodeURIComponent(window.location.href);
                return null;
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            return {
                code: 500,
                message: '网络错误，请检查连接后重试'
            };
        }
    },

    /**
     * 管理员登录
     */
    async login(username, password) {
        const result = await this.request(AdminAPIConfig.endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (result && result.code === 200) {
            // 检查权限
            if (result.data.role !== 'admin' && result.data.role !== 'therapist') {
                return {
                    code: 403,
                    message: '无管理权限'
                };
            }
            AdminTokenManager.saveToken(result.data.token, result.data);
        }

        return result;
    },

    /**
     * 获取评估列表
     */
    async getAssessments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${AdminAPIConfig.endpoints.assessments}?${queryString}`);
    },

    /**
     * 获取评估详情
     */
    async getAssessmentDetail(assessmentId) {
        return this.request(`${AdminAPIConfig.endpoints.assessmentDetail}${assessmentId}`);
    },

    /**
     * 生成PDF报告
     */
    async generateReport(assessmentId) {
        return this.request(`${AdminAPIConfig.endpoints.reportsGenerate}${assessmentId}`, {
            method: 'POST'
        });
    },

    /**
     * 下载报告
     */
    downloadReport(reportUrl) {
        const token = AdminTokenManager.getToken();
        const a = document.createElement('a');
        a.href = `${AdminAPIConfig.baseURL}${reportUrl}?token=${token}`;
        a.download = `assessment_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    /**
     * 获取统计数据
     */
    async getStats() {
        return this.request(AdminAPIConfig.endpoints.stats);
    },

    /**
     * 获取用户列表
     */
    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${AdminAPIConfig.endpoints.users}?${queryString}`);
    },

    /**
     * 重新分析评估
     */
    async reanalyze(assessmentId) {
        return this.request(`${AdminAPIConfig.endpoints.analysis}${assessmentId}`, {
            method: 'POST'
        });
    }
};

// ==================== UI组件 ====================
const AdminUI = {
    showLoading(message = '加载中...') {
        const existingLoading = document.getElementById('admin-loading');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loading = document.createElement('div');
        loading.id = 'admin-loading';
        loading.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 8px; text-align: center; min-width: 200px;">
                    <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #d4af37; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <div style="color: #333; font-size: 16px;">${message}</div>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loading);
    },

    hideLoading() {
        const loading = document.getElementById('admin-loading');
        if (loading) {
            loading.remove();
        }
    },

    showSuccess(message) {
        this.showToast(message, 'success');
    },

    showError(message) {
        this.showToast(message, 'error');
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.id = 'admin-toast';

        const bgColor = type === 'success' ? '#4caf50' : (type === 'error' ? '#f44336' : '#2196f3');
        const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

        toast.innerHTML = `
            <div style="position: fixed; top: 80px; right: 20px; z-index: 10000; background: ${bgColor}; color: white; padding: 15px 25px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 18px;">${icon}</span>
                <span style="font-size: 14px;">${message}</span>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    showConfirm(message, onConfirm, onCancel) {
        const confirm = document.createElement('div');
        confirm.id = 'admin-confirm';
        confirm.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 8px; text-align: center; min-width: 300px;">
                    <div style="color: #333; font-size: 16px; margin-bottom: 20px;">${message}</div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button id="confirmYes" style="padding: 10px 20px; background: #d4af37; color: white; border: none; border-radius: 4px; cursor: pointer;">确认</button>
                        <button id="confirmNo" style="padding: 10px 20px; background: #f5f5f5; color: #333; border: none; border-radius: 4px; cursor: pointer;">取消</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(confirm);

        confirm.querySelector('#confirmYes').addEventListener('click', () => {
            confirm.remove();
            if (onConfirm) onConfirm();
        });

        confirm.querySelector('#confirmNo').addEventListener('click', () => {
            confirm.remove();
            if (onCancel) onCancel();
        });
    }
};

// ==================== 数据渲染 ====================
const DataRenderer = {
    /**
     * 渲染评估列表
     */
    renderAssessmentList(assessments) {
        const container = document.getElementById('assessmentListContainer');
        if (!container) {
            console.error('找不到评估列表容器');
            return;
        }

        if (!assessments || assessments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                    <div>暂无评估记录</div>
                </div>
            `;
            return;
        }

        container.innerHTML = assessments.map(assessment => `
            <div class="assessment-item" data-assessment-id="${assessment.assessment_id}" data-status="${assessment.status}">
                <div class="assessment-header">
                    <div class="assessment-name">${assessment.real_name || '未知'}</div>
                    <div class="assessment-date">${this.formatDate(assessment.assessment_date)}</div>
                    <div class="assessment-status status-${assessment.status}">${this.getStatusText(assessment.status)}</div>
                </div>
                <div class="assessment-body">
                    <div class="assessment-info">
                        <span>年龄: ${assessment.age}</span>
                        <span>性别: ${assessment.gender === 'male' ? '男' : '女'}</span>
                        <span>症状: ${assessment.symptom_count || 0}</span>
                        <span>评分: ${assessment.health_score || '-'}</span>
                    </div>
                    <div class="assessment-actions">
                        <button class="btn-view" onclick="viewAssessmentDetail(${assessment.assessment_id})">查看详情</button>
                        <button class="btn-report" onclick="generateReport(${assessment.assessment_id})" ${!assessment.report_url ? '' : 'disabled'}>
                            ${assessment.report_url ? '已生成' : '生成报告'}
                        </button>
                        <button class="btn-download" onclick="downloadAssessmentReport('${assessment.report_url}')" ${!assessment.report_url ? 'disabled style="display:none;"' : ''}>
                            下载报告
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // 更新统计数字
        this.updateStats(assessments);
    },

    /**
     * 渲染评估详情
     */
    renderAssessmentDetail(detail) {
        const container = document.getElementById('assessmentDetailContainer');
        if (!container) {
            console.error('找不到评估详情容器');
            return;
        }

        const basicInfo = detail.basic_info || {};
        const symptoms = detail.symptoms || [];
        const analysis = detail.analysis || {};
        const plan = detail.health_plan || {};

        container.innerHTML = `
            <div class="detail-section">
                <h3>基本信息</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <label>姓名</label>
                        <span>${basicInfo.real_name || '未知'}</span>
                    </div>
                    <div class="info-item">
                        <label>年龄</label>
                        <span>${basicInfo.age || '-'}</span>
                    </div>
                    <div class="info-item">
                        <label>性别</label>
                        <span>${basicInfo.gender === 'male' ? '男' : '女'}</span>
                    </div>
                    <div class="info-item">
                        <label>身高</label>
                        <span>${basicInfo.height || '-'} cm</span>
                    </div>
                    <div class="info-item">
                        <label>体重</label>
                        <span>${basicInfo.weight || '-'} kg</span>
                    </div>
                    <div class="info-item">
                        <label>腰围</label>
                        <span>${basicInfo.waist_circumference || '-'} cm</span>
                    </div>
                </div>
                ${basicInfo.remarks ? `<div class="info-remarks"><label>备注</label><p>${basicInfo.remarks}</p></div>` : ''}
            </div>

            <div class="detail-section">
                <h3>症状数据 (${symptoms.length})</h3>
                <div class="symptoms-list">
                    ${symptoms.map(symptom => `
                        <div class="symptom-item">
                            <span class="symptom-name">${symptom.symptom_name}</span>
                            <span class="symptom-intensity intensity-${symptom.severity}">
                                ${symptom.intensity} (${this.getSeverityText(symptom.severity)})
                            </span>
                            <span class="symptom-side">${symptom.side === 'both' ? '双侧' : (symptom.side === 'left' ? '左侧' : '右侧')}</span>
                            ${symptom.cause_labels && symptom.cause_labels.length > 0 ? `
                                <span class="symptom-causes">
                                    原因: ${symptom.cause_labels.join(', ')}
                                </span>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="detail-section">
                <h3>分析结果</h3>
                ${this.renderAnalysisResult(analysis)}
            </div>

            ${plan.recommendations || plan.diet_advice || plan.lifestyle_advice ? `
                <div class="detail-section">
                    <h3>调理方案</h3>
                    ${plan.recommendations ? `<div class="plan-section"><h4>建议</h4><p>${plan.recommendations}</p></div>` : ''}
                    ${plan.diet_advice ? `<div class="plan-section"><h4>饮食建议</h4><p>${plan.diet_advice}</p></div>` : ''}
                    ${plan.lifestyle_advice ? `<div class="plan-section"><h4>生活方式</h4><p>${plan.lifestyle_advice}</p></div>` : ''}
                </div>
            ` : ''}
        `;
    },

    /**
     * 渲染分析结果
     */
    renderAnalysisResult(analysis) {
        if (!analysis || Object.keys(analysis).length === 0) {
            return '<div class="no-analysis">暂无分析结果</div>';
        }

        let html = '';

        // 病因分析
        if (analysis.cause_analysis) {
            html += `<div class="analysis-group"><h4>病因分析</h4>`;
            html += this.renderAnalysisChart(analysis.cause_analysis, 'cause');
            html += `</div>`;
        }

        // 脏腑分析
        if (analysis.organ_analysis) {
            html += `<div class="analysis-group"><h4>脏腑分析</h4>`;
            html += this.renderAnalysisChart(analysis.organ_analysis, 'organ');
            html += `</div>`;
        }

        // 体质分析
        if (analysis.constitution_analysis) {
            html += `<div class="analysis-group"><h4>体质分析</h4>`;
            html += this.renderAnalysisChart(analysis.constitution_analysis, 'constitution');
            html += `</div>`;
        }

        // 矿物质缺乏
        if (analysis.mineral_deficiency && Object.keys(analysis.mineral_deficiency).length > 0) {
            html += `<div class="analysis-group"><h4>矿物质缺乏</h4>`;
            html += `<div class="analysis-tags">`;
            Object.entries(analysis.mineral_deficiency).forEach(([name, value]) => {
                html += `<span class="tag">${name}: ${value}</span>`;
            });
            html += `</div></div>`;
        }

        // 维生素缺乏
        if (analysis.vitamin_deficiency && Object.keys(analysis.vitamin_deficiency).length > 0) {
            html += `<div class="analysis-group"><h4>维生素缺乏</h4>`;
            html += `<div class="analysis-tags">`;
            Object.entries(analysis.vitamin_deficiency).forEach(([name, value]) => {
                html += `<span class="tag">${name}: ${value}</span>`;
            });
            html += `</div></div>`;
        }

        // 健康趋势
        if (analysis.health_trend) {
            html += `<div class="analysis-group"><h4>健康趋势</h4>`;
            html += `<div class="analysis-tags">`;
            Object.entries(analysis.health_trend).forEach(([name, value]) => {
                html += `<span class="tag trend-${value}">${name}: ${value > 0 ? '风险增加' : (value < 0 ? '风险降低' : '稳定')}</span>`;
            });
            html += `</div></div>`;
        }

        return html;
    },

    /**
     * 渲染分析图表（简单条形图）
     */
    renderAnalysisChart(data, type) {
        const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
        const maxValue = Math.max(...entries.map(e => e[1]));

        return `
            <div class="chart-container">
                ${entries.map(([name, value]) => {
                    const percentage = (value / maxValue) * 100;
                    return `
                        <div class="chart-item">
                            <div class="chart-label">${name}</div>
                            <div class="chart-bar-bg">
                                <div class="chart-bar" style="width: ${percentage}%;"></div>
                            </div>
                            <div class="chart-value">${value}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * 渲染统计数据
     */
    renderStats(stats) {
        const totalEl = document.getElementById('statTotal');
        const todayEl = document.getElementById('statToday');
        const symptomsEl = document.getElementById('statSymptoms');
        const scoreEl = document.getElementById('statScore');

        if (totalEl) totalEl.textContent = stats.total_assessments || 0;
        if (todayEl) todayEl.textContent = stats.today_assessments || 0;
        if (symptomsEl) symptomsEl.textContent = stats.total_symptoms || 299;
        if (scoreEl) scoreEl.textContent = stats.avg_score || '-';
    },

    /**
     * 更新统计信息
     */
    updateStats(assessments) {
        const total = assessments.length;
        const today = assessments.filter(a => {
            const today = new Date();
            const assessmentDate = new Date(a.assessment_date);
            return assessmentDate.toDateString() === today.toDateString();
        }).length;
        const totalSymptoms = assessments.reduce((sum, a) => sum + (a.symptom_count || 0), 0);
        const avgScore = assessments.length > 0 
            ? Math.round(assessments.reduce((sum, a) => sum + (a.health_score || 0), 0) / assessments.length)
            : '-';

        this.renderStats({
            total_assessments: total,
            today_assessments: today,
            total_symptoms: totalSymptoms,
            avg_score: avgScore
        });
    },

    /**
     * 格式化日期
     */
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}`;
    },

    /**
     * 获取状态文本
     */
    getStatusText(status) {
        const statusMap = {
            'pending': '待分析',
            'analyzed': '已分析',
            'completed': '已完成'
        };
        return statusMap[status] || status;
    },

    /**
     * 获取严重程度文本
     */
    getSeverityText(severity) {
        const severityMap = {
            'mild': '轻度',
            'moderate': '中度',
            'severe': '重度'
        };
        return severityMap[severity] || severity;
    }
};

// ==================== 页面逻辑 ====================
class AdminPage {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentAssessmentId = null;
        this.init();
    }

    async init() {
        // 检查登录状态
        if (AdminTokenManager.isTokenExpired()) {
            this.showLoginModal();
            return;
        }

        // 显示用户信息
        this.showUserInfo();

        // 加载统计数据
        await this.loadStats();

        // 加载评估列表
        await this.loadAssessments();

        // 绑定事件
        this.bindEvents();
    }

    showUserInfo() {
        const userInfo = AdminTokenManager.getUserInfo();
        if (userInfo) {
            const userNameEl = document.getElementById('adminUserName');
            if (userNameEl) {
                userNameEl.textContent = userInfo.real_name || userInfo.username;
            }
        }
    }

    async loadStats() {
        const result = await AdminAPI.getStats();
        if (result && result.code === 200) {
            DataRenderer.renderStats(result.data);
        }
    }

    async loadAssessments(params = {}) {
        AdminUI.showLoading('加载评估数据...');

        const requestParams = {
            page: this.currentPage,
            size: this.pageSize,
            ...params
        };

        const result = await AdminAPI.getAssessments(requestParams);

        AdminUI.hideLoading();

        if (result && result.code === 200) {
            const { assessments, total, page, size } = result.data;
            DataRenderer.renderAssessmentList(assessments);
            this.renderPagination(total, page, size);
        } else {
            AdminUI.showError(result?.message || '加载数据失败');
        }
    }

    async viewAssessmentDetail(assessmentId) {
        AdminUI.showLoading('加载评估详情...');

        const result = await AdminAPI.getAssessmentDetail(assessmentId);

        AdminUI.hideLoading();

        if (result && result.code === 200) {
            this.currentAssessmentId = assessmentId;
            DataRenderer.renderAssessmentDetail(result.data);
            
            // 显示详情模态框
            const modal = document.getElementById('detailModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        } else {
            AdminUI.showError(result?.message || '加载详情失败');
        }
    }

    async generateReport(assessmentId) {
        AdminUI.showConfirm('确认生成报告吗？', async () => {
            AdminUI.showLoading('正在生成报告...');

            const result = await AdminAPI.generateReport(assessmentId);

            AdminUI.hideLoading();

            if (result && result.code === 200) {
                AdminUI.showSuccess('报告生成成功！');
                await this.loadAssessments(); // 刷新列表
            } else {
                AdminUI.showError(result?.message || '生成报告失败');
            }
        });
    }

    downloadAssessmentReport(reportUrl) {
        if (!reportUrl) {
            AdminUI.showError('报告不存在');
            return;
        }
        AdminAPI.downloadReport(reportUrl);
    }

    async reanalyze(assessmentId) {
        AdminUI.showConfirm('确认重新分析吗？', async () => {
            AdminUI.showLoading('正在重新分析...');

            const result = await AdminAPI.reanalyze(assessmentId);

            AdminUI.hideLoading();

            if (result && result.code === 200) {
                AdminUI.showSuccess('重新分析成功！');
                await this.loadAssessments(); // 刷新列表
            } else {
                AdminUI.showError(result?.message || '重新分析失败');
            }
        });
    }

    renderPagination(total, page, size) {
        const paginationEl = document.getElementById('pagination');
        if (!paginationEl) return;

        const totalPages = Math.ceil(total / size);

        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        let html = `<div class="pagination">`;

        // 上一页
        html += `<button class="page-btn" ${page === 1 ? 'disabled' : ''} onclick="adminPage.goToPage(${page - 1})">上一页</button>`;

        // 页码
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="adminPage.goToPage(${i})">${i}</button>`;
            } else if (i === page - 3 || i === page + 3) {
                html += `<span class="page-ellipsis">...</span>`;
            }
        }

        // 下一页
        html += `<button class="page-btn" ${page === totalPages ? 'disabled' : ''} onclick="adminPage.goToPage(${page + 1})">下一页</button>`;

        html += `</div>`;
        paginationEl.innerHTML = html;
    }

    goToPage(page) {
        this.currentPage = page;
        this.loadAssessments();
    }

    bindEvents() {
        // 搜索按钮
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.handleSearch();
            });
        }

        // 搜索输入框回车
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }

        // 状态筛选
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.handleSearch();
            });
        }

        // 详情模态框关闭
        const closeDetailBtn = document.getElementById('closeDetailBtn');
        if (closeDetailBtn) {
            closeDetailBtn.addEventListener('click', () => {
                const modal = document.getElementById('detailModal');
                if (modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadAssessments();
                this.loadStats();
            });
        }

        // 登出按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    handleSearch() {
        const keyword = document.getElementById('searchInput')?.value?.trim() || '';
        const status = document.getElementById('statusFilter')?.value || '';

        const params = {};
        if (keyword) {
            params.keyword = keyword;
        }
        if (status) {
            params.status = status;
        }

        this.currentPage = 1;
        this.loadAssessments(params);
    }

    handleLogout() {
        AdminUI.showConfirm('确认退出登录吗？', () => {
            AdminTokenManager.removeToken();
            window.location.href = '/admin/login.html';
        });
    }

    showLoginModal() {
        // 创建登录模态框
        const loginModal = document.createElement('div');
        loginModal.id = 'loginModal';
        loginModal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 40px; border-radius: 8px; text-align: center; min-width: 350px;">
                    <h2 style="color: #d4af37; margin-bottom: 30px;">元炁源流管理后台</h2>
                    <div style="margin-bottom: 20px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; color: #333;">用户名</label>
                        <input type="text" id="loginUsername" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <div style="margin-bottom: 30px; text-align: left;">
                        <label style="display: block; margin-bottom: 5px; color: #333;">密码</label>
                        <input type="password" id="loginPassword" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                    </div>
                    <button id="loginSubmitBtn" style="width: 100%; padding: 12px; background: #d4af37; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">登录</button>
                </div>
            </div>
        `;

        document.body.appendChild(loginModal);

        // 绑定登录事件
        loginModal.querySelector('#loginSubmitBtn').addEventListener('click', async () => {
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                AdminUI.showError('请输入用户名和密码');
                return;
            }

            AdminUI.showLoading('登录中...');

            const result = await AdminAPI.login(username, password);

            AdminUI.hideLoading();

            if (result && result.code === 200) {
                AdminUI.showSuccess('登录成功！');
                loginModal.remove();
                this.init(); // 重新初始化页面
            } else {
                AdminUI.showError(result?.message || '登录失败');
            }
        });

        // 回车登录
        loginModal.querySelector('#loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginModal.querySelector('#loginSubmitBtn').click();
            }
        });
    }
}

// ==================== 页面初始化 ====================
let adminPage;

document.addEventListener('DOMContentLoaded', function() {
    adminPage = new AdminPage();
});

// ==================== 导出全局函数（供HTML调用）====================
window.viewAssessmentDetail = (id) => adminPage.viewAssessmentDetail(id);
window.generateReport = (id) => adminPage.generateReport(id);
window.downloadAssessmentReport = (url) => adminPage.downloadAssessmentReport(url);
window.reanalyze = (id) => adminPage.reanalyze(id);
