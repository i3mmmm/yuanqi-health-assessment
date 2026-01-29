// 前端表单改造 - 修改提交逻辑
// 将此代码插入到 health_assessment_final_fixed.html 中

// ==================== 全局配置 ====================
const API_CONFIG = {
   baseURL: window.location.origin, // 使用当前域名作为API基础地址  
    endpoints: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        submit: '/api/assessments',
        getAssessment: '/api/assessments/',
        symptoms: '/api/symptoms'
    }
};

// ==================== JWT Token 管理 ====================
const TokenManager = {
    /**
     * 保存Token
     */
    saveToken(token) {
        try {
            localStorage.setItem('yuanqi_token', token);
            // 解析token保存过期时间
            const payload = this.parseToken(token);
            if (payload && payload.exp) {
                localStorage.setItem('yuanqi_token_expires', payload.exp * 1000);
            }
        } catch (e) {
            console.error('保存Token失败:', e);
        }
    },

    /**
     * 获取Token
     */
    getToken() {
        return localStorage.getItem('yuanqi_token');
    },

    /**
     * 删除Token（登出）
     */
    removeToken() {
        localStorage.removeItem('yuanqi_token');
        localStorage.removeItem('yuanqi_token_expires');
        localStorage.removeItem('yuanqi_user_info');
    },

    /**
     * 检查Token是否过期
     */
    isTokenExpired() {
        const token = this.getToken();
        if (!token) return true;

        const expires = localStorage.getItem('yuanqi_token_expires');
        if (!expires) return true;

        return Date.now() > parseInt(expires);
    },

    /**
     * 解析Token（不验证签名）
     */
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

    /**
     * 获取请求头
     */
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            return {};
        }
        return {
            'Authorization': `Bearer ${token}`
        };
    }
};

// ==================== API 请求封装 ====================
const API = {
    /**
     * 通用请求方法
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...TokenManager.getAuthHeaders()
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
            const response = await fetch(`${API_CONFIG.baseURL}${url}`, mergedOptions);
            const data = await response.json();

            // Token过期，自动跳转登录
            if (data.code === 401 && !url.includes('/api/auth/login')) {
                TokenManager.removeToken();
                window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
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
     * 用户注册
     */
    async register(userData) {
        return this.request(API_CONFIG.endpoints.register, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    /**
     * 用户登录
     */
    async login(username, password) {
        const result = await this.request(API_CONFIG.endpoints.login, {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (result && result.code === 200) {
            TokenManager.saveToken(result.data.token);
            localStorage.setItem('yuanqi_user_info', JSON.stringify(result.data));
        }

        return result;
    },

    /**
     * 提交评估
     */
    async submitAssessment(assessmentData) {
        return this.request(API_CONFIG.endpoints.submit, {
            method: 'POST',
            body: JSON.stringify(assessmentData)
        });
    },

    /**
     * 获取评估详情
     */
    async getAssessment(assessmentId) {
        return this.request(`${API_CONFIG.endpoints.getAssessment}${assessmentId}`);
    },

    /**
     * 获取症状库
     */
    async getSymptoms(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`${API_CONFIG.endpoints.symptoms}?${queryString}`);
    }
};

// ==================== UI 交互工具 ====================
const UI = {
    /**
     * 显示加载提示
     */
    showLoading(message = '加载中...') {
        // 移除已存在的loading
        const existingLoading = document.getElementById('global-loading');
        if (existingLoading) {
            existingLoading.remove();
        }

        const loading = document.createElement('div');
        loading.id = 'global-loading';
        loading.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 8px; text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d4af37; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
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

    /**
     * 隐藏加载提示
     */
    hideLoading() {
        const loading = document.getElementById('global-loading');
        if (loading) {
            loading.remove();
        }
    },

    /**
     * 显示成功提示
     */
    showSuccess(message, duration = 3000) {
        this.showToast(message, 'success', duration);
    },

    /**
     * 显示错误提示
     */
    showError(message, duration = 5000) {
        this.showToast(message, 'error', duration);
    },

    /**
     * 显示Toast提示
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.id = 'global-toast';

        const bgColor = type === 'success' ? '#4caf50' : (type === 'error' ? '#f44336' : '#2196f3');
        const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');

        toast.innerHTML = `
            <div style="position: fixed; top: 20px; right: 20px; z-index: 10000; background: ${bgColor}; color: white; padding: 15px 25px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease-out; display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: bold; font-size: 18px;">${icon}</span>
                <span style="font-size: 14px;">${message}</span>
            </div>
            <style>
                @keyframes slideIn {
                    from { transform: translateX(400px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(400px); opacity: 0; }
                }
            </style>
        `;

        document.body.appendChild(toast);

        // 自动移除
        setTimeout(() => {
            toast.querySelector('div').style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// ==================== 数据收集 ====================
const DataCollector = {
    /**
     * 收集表单基础信息
     */
    collectBasicInfo() {
        return {
            user_id: this.getUserId(),
            real_name: document.getElementById('realName').value.trim(),
            age: parseInt(document.getElementById('age').value),
            gender: document.querySelector('input[name="gender"]:checked')?.value,
            height: document.getElementById('height').value ? parseFloat(document.getElementById('height').value) : null,
            weight: document.getElementById('weight').value ? parseFloat(document.getElementById('weight').value) : null,
            waist_circumference: document.getElementById('waistCircumference').value ? parseInt(document.getElementById('waistCircumference').value) : null,
            blood_sugar: document.getElementById('bloodSugar').value ? parseFloat(document.getElementById('bloodSugar').value) : null,
            systolic_pressure: document.getElementById('systolicPressure').value ? parseInt(document.getElementById('systolicPressure').value) : null,
            diastolic_pressure: document.getElementById('diastolicPressure').value ? parseInt(document.getElementById('diastolicPressure').value) : null,
            remarks: document.getElementById('remarks').value.trim()
        };
    },

    /**
     * 收集选中的症状
     */
    collectSymptoms() {
        const symptoms = [];
        const selectedSymptoms = document.querySelectorAll('.symptom-card.selected');

        selectedSymptoms.forEach(card => {
            const symptomName = card.querySelector('.symptom-name')?.textContent.trim();
            const symptomId = parseInt(card.dataset.symptomId);
            const intensity = parseInt(card.querySelector('.intensity-slider')?.value) || 1;
            const severity = intensity <= 6 ? 'mild' : (intensity <= 13 ? 'moderate' : 'severe');
            
            // 获取原因标签
            const causeLabels = this.getCauseLabels(card);

            // 获取位置信息（从卡片数据属性获取）
            const side = card.dataset.side || 'both';

            symptoms.push({
                symptom_id: symptomId,
                symptom_name: symptomName,
                side: side,
                intensity: intensity,
                severity: severity,
                cause_labels: causeLabels
            });
        });

        return symptoms;
    },

    /**
     * 获取原因标签
     */
    getCauseLabels(card) {
        // 从卡片的数据属性中获取，或者从symptom_library获取
        const causesData = card.dataset.causes;
        if (causesData) {
            try {
                const causes = JSON.parse(causesData);
                return causes.map(c => c.label);
            } catch (e) {
                console.error('解析原因标签失败:', e);
            }
        }
        return [];
    },

    /**
     * 获取用户ID
     */
    getUserId() {
        const userInfo = localStorage.getItem('yuanqi_user_info');
        if (userInfo) {
            try {
                return JSON.parse(userInfo).user_id;
            } catch (e) {
                console.error('解析用户信息失败:', e);
            }
        }
        // 如果没有用户ID，返回默认值或提示登录
        return 1; // 默认用户ID，实际使用时需要登录后获取
    },

    /**
     * 收集完整的评估数据
     */
    collectAssessmentData() {
        return {
            ...this.collectBasicInfo(),
            symptoms: this.collectSymptoms()
        };
    },

    /**
     * 验证表单数据
     */
    validate(data) {
        const errors = [];

        if (!data.real_name) {
            errors.push('请填写姓名');
        }

        if (!data.age || data.age < 1 || data.age > 120) {
            errors.push('请填写有效的年龄（1-120岁）');
        }

        if (!data.gender) {
            errors.push('请选择性别');
        }

        if (!data.symptoms || data.symptoms.length === 0) {
            errors.push('请至少选择一个症状');
        }

        return errors;
    }
};

// ==================== 提交逻辑（核心改造）====================
async function submitAssessment() {
    // 检查Token是否过期
    if (TokenManager.isTokenExpired()) {
        UI.showError('登录已过期，请重新登录');
        window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }

    // 收集表单数据
    const assessmentData = DataCollector.collectAssessmentData();

    // 验证数据
    const errors = DataCollector.validate(assessmentData);
    if (errors.length > 0) {
        UI.showError(errors[0]);
        return;
    }

    // 显示加载提示
    UI.showLoading('正在提交评估数据，请稍候...');

    try {
        // 调用API提交数据
        const result = await API.submitAssessment(assessmentData);

        if (result && result.code === 200) {
            // 提交成功
            UI.hideLoading();
            UI.showSuccess('评估提交成功！正在生成报告...');

            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
                // 跳转到报告页面
                const assessmentId = result.data.assessment_id;
                window.location.href = `unified_health_assessment_comparison.html?assessment_id=${assessmentId}`;
            }, 1500);

        } else {
            // 提交失败
            UI.hideLoading();
            UI.showError(result?.message || '提交失败，请重试');
            console.error('提交评估失败:', result);
        }

    } catch (error) {
        UI.hideLoading();
        UI.showError('网络错误，请检查连接后重试');
        console.error('提交评估失败:', error);
    }
}

// ==================== 降级方案：下载JSON文件（保留原有功能）====================
function downloadJSON() {
    const assessmentData = DataCollector.collectAssessmentData();
    const jsonData = JSON.stringify(assessmentData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_assessment_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 释放URL对象
    URL.revokeObjectURL(url);
    
    UI.showSuccess('JSON文件已下载');
}

// ==================== 页面初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 检查是否登录
    if (TokenManager.isTokenExpired()) {
        // 显示登录提示，但不强制登录，允许匿名提交
        console.log('未登录或Token已过期，将以匿名用户身份提交');
    }

    // 绑定提交按钮事件
    const submitButton = document.getElementById('submitAssessmentBtn');
    if (submitButton) {
        submitButton.addEventListener('click', submitAssessment);
    }

    // 绑定下载JSON按钮事件（降级方案）
    const downloadButton = document.getElementById('downloadJSONBtn');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadJSON);
    }

    // 初始化症状数据
    initSymptomsData();
});

// ==================== 初始化症状数据 ====================
async function initSymptomsData() {
    UI.showLoading('正在加载症状数据...');

    try {
        // 优先从API获取症状库
        const result = await API.getSymptoms({ limit: 300 });
        
        if (result && result.code === 200) {
            renderSymptoms(result.data.symptoms);
        } else {
            // 降级：从本地JSON文件加载
            console.warn('从API加载症状失败，使用本地数据');
            loadSymptomsFromLocal();
        }
    } catch (error) {
        console.error('加载症状数据失败:', error);
        // 降级：从本地JSON文件加载
        loadSymptomsFromLocal();
    } finally {
        UI.hideLoading();
    }
}

/**
 * 从本地JSON文件加载症状
 */
function loadSymptomsFromLocal() {
    fetch('/symptoms_299_complete.json')  
        .then(response => response.json())
        .then(data => {
            if (data && data.symptoms) {
                renderSymptoms(data.symptoms);
            }
        })
        .catch(error => {
            console.error('加载本地症状数据失败:', error);
            UI.showError('加载症状数据失败，请刷新页面重试');
        });
}

/**
 * 渲染症状卡片
 */
function renderSymptoms(symptoms) {
    const container = document.getElementById('symptomsContainer');
    if (!container) {
        console.error('找不到症状容器');
        return;
    }

    container.innerHTML = '';
    const selectedCount = document.getElementById('selectedCount');

    symptoms.forEach(symptom => {
        const card = createSymptomCard(symptom);
        container.appendChild(card);
    });

    // 更新症状总数
    updateSymptomCount();
}

/**
 * 创建症状卡片
 */
function createSymptomCard(symptom) {
    const card = document.createElement('div');
    card.className = 'symptom-card';
    card.dataset.symptomId = symptom.id;
    card.dataset.side = symptom.side || 'both';
    card.dataset.causes = JSON.stringify(symptom.causes || []);

    card.innerHTML = `
        <div class="symptom-name">${symptom.name}</div>
        <div class="symptom-organ">${symptom.organ || ''}</div>
        <div class="symptom-severity ${symptom.severity}"></div>
        <div class="intensity-control" style="display: none;">
            <div class="intensity-label">严重程度: <span class="intensity-value">1</span>/20</div>
            <input type="range" class="intensity-slider" min="1" max="20" value="1">
        </div>
    `;

    // 点击事件：选中/取消选中
    card.addEventListener('click', function(e) {
        if (e.target.classList.contains('intensity-slider')) return;

        card.classList.toggle('selected');
        const intensityControl = card.querySelector('.intensity-control');
        
        if (card.classList.contains('selected')) {
            intensityControl.style.display = 'block';
        } else {
            intensityControl.style.display = 'none';
            card.querySelector('.intensity-slider').value = 1;
            card.querySelector('.intensity-value').textContent = '1';
        }

        updateSymptomCount();
    });

    // 滑块事件：更新严重程度
    const slider = card.querySelector('.intensity-slider');
    const intensityValue = card.querySelector('.intensity-value');
    slider.addEventListener('input', function() {
        intensityValue.textContent = this.value;
    });

    return card;
}

/**
 * 更新症状计数
 */
function updateSymptomCount() {
    const selectedCount = document.getElementById('selectedCount');
    const totalCount = document.getElementById('totalCount');
    const selectedSymptoms = document.querySelectorAll('.symptom-card.selected');
    
    if (selectedCount) {
        selectedCount.textContent = selectedSymptoms.length;
    }
    
    if (totalCount) {
        totalCount.textContent = document.querySelectorAll('.symptom-card').length;
    }
}

// ==================== 导出全局变量（供HTML中使用）====================
window.TokenManager = TokenManager;
window.API = API;
window.UI = UI;
window.DataCollector = DataCollector;
window.submitAssessment = submitAssessment;
window.downloadJSON = downloadJSON;
