# 元炁源流健康评估系统 - 后端API部署指南

## 一、快速开始

### 1.1 系统要求

- **Node.js**: v18.0.0 或更高版本
- **MySQL**: 5.7 或 8.0+
- **Nginx**: 1.18+（可选，用于生产环境）
- **操作系统**: Linux / macOS / Windows

### 1.2 快速安装（3步启动）

```bash
# 步骤1: 安装依赖
npm install express mysql2 cors jsonwebtoken bcryptjs multer pdf-lib puppeteer

# 步骤2: 创建数据库
mysql -u root -p < database_schema.sql

# 步骤3: 配置环境变量并启动
cp .env.example .env
node backend-api-server.js
```

---

## 二、详细安装步骤

### 步骤1: 安装Node.js

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### macOS
```bash
brew install node

# 验证安装
node --version
npm --version
```

#### Windows
下载并安装 Node.js: https://nodejs.org/

---

### 步骤2: 安装MySQL

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install -y mysql-server

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation
```

#### macOS
```bash
brew install mysql

# 启动MySQL服务
brew services start mysql
```

#### Windows
下载并安装 MySQL: https://dev.mysql.com/downloads/mysql/

---

### 步骤3: 创建数据库

```bash
# 登录MySQL
mysql -u root -p

# 或直接执行SQL文件
mysql -u root -p < database_schema.sql
```

数据库创建后，会显示：
```
默认管理员账号: admin / admin123
默认调理师账号: practitioner1 / admin123
```

**注意**: 首次登录后请立即修改默认密码！

---

### 步骤4: 安装项目依赖

```bash
# 在项目根目录执行
npm install express mysql2 cors jsonwebtoken bcryptjs multer pdf-lib puppeteer
```

---

### 步骤5: 配置环境变量

创建 `.env` 文件：

```bash
cp .env.example .env
nano .env
```

**.env 文件内容**：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=yuanqi_health

# JWT配置
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=86400

# CORS配置
CORS_ORIGIN=https://yuanqiyuanliu.com

# 文件上传配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# PDF生成配置
PDF_DIR=./uploads/pdfs
```

---

### 步骤6: 启动服务

```bash
# 开发模式（带日志）
NODE_ENV=development node backend-api-server.js

# 生产模式
NODE_ENV=production node backend-api-server.js

# 使用PM2（推荐）
npm install -g pm2
pm2 start backend-api-server.js --name yuanqi-backend
pm2 save
pm2 startup
```

---

## 三、API接口文档

### 基础信息

```
基础URL: http://localhost:3000
数据格式: JSON
字符编码: UTF-8
```

---

### 3.1 用户认证API

#### 3.1.1 用户注册

**接口**: `POST /api/auth/register`

**请求示例**：
```json
{
  "username": "user123",
  "password": "password123",
  "real_name": "张三",
  "phone": "13800138000",
  "email": "user@example.com",
  "role": "customer"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user_id": 123,
    "username": "user123",
    "real_name": "张三",
    "role": "customer",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 3.1.2 用户登录

**接口**: `POST /api/auth/login`

**请求示例**：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "user_id": 1,
    "username": "admin",
    "real_name": "系统管理员",
    "phone": "13800000000",
    "email": "admin@yuanqiyuanliu.com",
    "role": "admin",
    "avatar_url": null,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 86400
  }
}
```

---

### 3.2 评估数据API

#### 3.2.1 创建新评估

**接口**: `POST /api/assessments`

**请求头**：
```
Authorization: Bearer {token}
```

**请求示例**：
```json
{
  "user_id": 123,
  "real_name": "温麟湘",
  "age": 53,
  "gender": "male",
  "height": 158,
  "weight": 50.3,
  "waist_circumference": 72,
  "blood_sugar": null,
  "systolic_pressure": null,
  "diastolic_pressure": null,
  "remarks": "12月1日开始眼睛出现重影，伴随左边头疼",
  "symptoms": [
    {
      "symptom_id": 1,
      "symptom_name": "头疼",
      "side": "left",
      "intensity": 19,
      "severity": "moderate",
      "cause_labels": ["微循环", "肝"]
    },
    {
      "symptom_id": 2,
      "symptom_name": "白发",
      "side": "left",
      "intensity": 15,
      "severity": "moderate",
      "cause_labels": ["衰老", "肾"]
    }
  ]
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "评估创建成功",
  "data": {
    "assessment_id": 456,
    "assessment_code": "YA2026012700123",
    "assessment_date": "2026-01-27T20:44:04.000Z",
    "status": "analyzed"
  }
}
```

---

#### 3.2.2 获取评估详情

**接口**: `GET /api/assessments/:assessment_id`

**请求头**：
```
Authorization: Bearer {token}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "assessment": {
      "id": 456,
      "assessment_code": "YA2026012700123",
      "real_name": "温麟湘",
      "age": 53,
      "gender": "male",
      "height": 158,
      "weight": 50.3,
      "waist_circumference": 72,
      "blood_sugar": null,
      "systolic_pressure": null,
      "diastolic_pressure": null,
      "remarks": "12月1日开始眼睛出现重影，伴随左边头疼",
      "total_symptoms": 2,
      "total_score": 34,
      "avg_score": 17.00,
      "status": "analyzed",
      "assessment_date": "2026-01-27T20:44:04.000Z"
    },
    "symptoms": [
      {
        "id": 1,
        "assessment_id": 456,
        "symptom_id": 1,
        "symptom_name": "头疼",
        "side": "left",
        "intensity": 19,
        "severity": "moderate",
        "cause_labels": ["微循环", "肝"]
      },
      {
        "id": 2,
        "assessment_id": 456,
        "symptom_id": 2,
        "symptom_name": "白发",
        "side": "left",
        "intensity": 15,
        "severity": "moderate",
        "cause_labels": ["衰老", "肾"]
      }
    ],
    "analysis": {
      "id": 1,
      "assessment_id": 456,
      "cause_analysis": {
        "微循环": 19,
        "体质": 0,
        "毒素": 0,
        "习惯": 0,
        "营养": 0,
        "内分泌": 0,
        "免疫力": 0,
        "气血": 0
      },
      "organ_analysis": {
        "肝": 19,
        "胃": 0,
        "肾": 15,
        "脾": 0,
        "综合": 0
      },
      "constitution_analysis": {
        "血虚": 0,
        "寒凉": 0,
        "气虚": 0,
        "阳虚": 0,
        "阴虚": 0,
        "血瘀": 9,
        "气郁": 0,
        "湿热": 0,
        "痰湿": 0
      },
      "precautions": {},
      "taboos": {},
      "emotion_analysis": {
        "怒": 0,
        "压力过大": 5,
        "思": 0,
        "抑郁": 0,
        "紧张": 3,
        "心情不好": 0,
        "哀": 0,
        "焦虑": 3,
        "激动": 0,
        "恐": 0,
        "情志失调": 0,
        "惊": 0,
        "精神": 0
      },
      "health_trends": {
        "外伤": 0,
        "遗传": 0,
        "高血压": 7,
        "失眠": 0,
        "糖尿病": 0,
        "青光眼": 0,
        "感冒": 0,
        "颈椎病": 5,
        "肿瘤": 0,
        "甲亢": 0,
        "消化不良": 0,
        "营养不良": 0
      },
      "lifestyle_habits": {
        "熬夜": 0,
        "用眼过度": 0,
        "过劳": 0,
        "运动过少": 0,
        "贪凉": 0,
        "辐射": 0,
        "作息不规律": 0,
        "饮水过少": 0,
        "久坐": 0
      },
      "mineral_deficiency": {
        "钙": 0,
        "锌": 7,
        "硒": 0,
        "镁": 0,
        "铬": 0,
        "锰": 0,
        "铁": 0,
        "磷": 0
      },
      "vitamin_deficiency": {
        "A": 0,
        "C": 0,
        "E": 7,
        "B1": 0,
        "B2": 0,
        "B3": 0,
        "B5": 0,
        "B6": 0,
        "B7": 0,
        "B9": 0,
        "B12": 0,
        "B1_": 0,
        "D_": 0,
        "F": 0,
        "M": 0,
        "P": 0
      },
      "overall_health_score": 85.25,
      "health_level": "good",
      "primary_issues": [
        {
          "type": "cause",
          "name": "微循环",
          "score": 19
        }
      ],
      "recommendations": "建议进行适量有氧运动，如散步、太极，改善血液循环。\n肝功能偏弱，建议少熬夜，避免生气，多食用绿色蔬菜。\n肾气不足，建议节制房事，多食用黑色食物如黑豆、芝麻。"
    }
  }
}
```

---

#### 3.2.3 获取用户评估列表

**接口**: `GET /api/assessments?user_id=123&page=1&limit=20`

**请求头**：
```
Authorization: Bearer {token}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "assessments": [
      {
        "id": 456,
        "user_id": 123,
        "assessment_code": "YA2026012700123",
        "assessment_date": "2026-01-27T20:44:04.000Z",
        "real_name": "温麟湘",
        "age": 53,
        "gender": "male",
        "total_symptoms": 2,
        "total_score": 34,
        "avg_score": 17.00,
        "status": "analyzed"
      }
    ]
  }
}
```

---

### 3.3 症状库API

#### 3.3.1 获取症状库

**接口**: `GET /api/symptoms?page=1&limit=50&organ=肝&search=头疼`

**请求头**：
```
Authorization: Bearer {token}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 299,
    "page": 1,
    "limit": 50,
    "symptoms": [
      {
        "id": 1,
        "name": "头疼",
        "color_region": "red",
        "organ": "心、小肠",
        "causes": [
          {
            "label": "营养",
            "detail": "头颈部外伤"
          },
          {
            "label": "免疫力",
            "detail": "头颈部外伤"
          },
          {
            "label": "毒素",
            "detail": "心脑血管疾病、动脉硬化、长期服用药物、中毒如酒精CO铅汞农药、过度劳累睡眠不足熬夜、压力情绪冷热刺激精神紧张、受寒感冒鼻炎、颈椎病、经期更年期、食物气候环境"
          }
        ],
        "warnings": [
          "注意肾脏疾病"
        ],
        "taboos": [
          "忌肥肉油腻",
          "少吃寒凉食物"
        ],
        "severity": "moderate",
        "is_active": true
      }
    ]
  }
}
```

---

### 3.4 评估对比API

#### 3.4.1 评估对比分析

**接口**: `POST /api/assessments/compare`

**请求头**：
```
Authorization: Bearer {token}
```

**请求示例**：
```json
{
  "assessment_ids": [456, 457]
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "对比分析成功",
  "data": {
    "comparison": {
      "assessment_a": {
        "id": 456,
        "assessment_code": "YA2026012700123",
        "assessment_date": "2026-01-27T20:44:04.000Z",
        "total_score": 34,
        "avg_score": 17.00
      },
      "assessment_b": {
        "id": 457,
        "assessment_code": "YA2026022700456",
        "assessment_date": "2026-02-27T20:44:04.000Z",
        "total_score": 28,
        "avg_score": 14.00
      },
      "symptom_changes": {
        "improved": [
          {
            "name": "头疼",
            "before": 19,
            "after": 15,
            "change": -4
          }
        ],
        "worsened": [],
        "new": [],
        "resolved": []
      },
      "score_changes": {
        "total_score": {
          "before": 34,
          "after": 28,
          "change": -6,
          "percentage": -17.65
        },
        "avg_score": {
          "before": 17.00,
          "after": 14.00,
          "change": -3.00
        }
      },
      "health_trend": "improving"
    }
  }
}
```

---

### 3.5 报告生成API

#### 3.5.1 生成PDF报告

**接口**: `POST /api/reports/generate`

**请求头**：
```
Authorization: Bearer {token}
```

**请求示例**：
```json
{
  "assessment_id": 456,
  "report_type": "assessment"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "报告生成成功",
  "data": {
    "report_url": "/uploads/健康评估报告_YA2026012700123_1706387044123.pdf",
    "file_name": "健康评估报告_YA2026012700123_1706387044123.pdf",
    "file_size": 1524288
  }
}
```

---

### 3.6 后台管理API

#### 3.6.1 获取所有评估（管理员/调理师）

**接口**: `GET /api/admin/assessments?page=1&limit=50&status=analyzed&start_date=2026-01-01&end_date=2026-01-31`

**请求头**：
```
Authorization: Bearer {token}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "statistics": {
      "total_assessments": 150,
      "today_assessments": 5,
      "pending_analyses": 0,
      "completed_reports": 145
    },
    "assessments": [
      {
        "id": 456,
        "user_id": 123,
        "assessment_code": "YA2026012700123",
        "assessment_date": "2026-01-27T20:44:04.000Z",
        "real_name": "温麟湘",
        "age": 53,
        "gender": "male",
        "total_symptoms": 2,
        "total_score": 34,
        "avg_score": 17.00,
        "status": "analyzed",
        "username": "user123",
        "phone": "13800138000"
      }
    ]
  }
}
```

---

### 3.7 健康检查API

#### 3.7.1 服务健康检查

**接口**: `GET /api/health`

**响应示例**：
```json
{
  "code": 200,
  "message": "服务正常运行",
  "timestamp": "2026-01-27T20:44:04.000Z"
}
```

---

## 四、前端改造指南

### 4.1 修改前端表单提交逻辑

**原来的逻辑（下载JSON文件）**：
```javascript
function submitAssessment() {
    const formData = collectFormData();
    const jsonData = JSON.stringify(formData, null, 2);
    downloadFile(jsonData, `health_assessment_${Date.now()}.json`);
}
```

**新的逻辑（发送到API）**：
```javascript
async function submitAssessment() {
    const formData = collectFormData();
    
    try {
        // 显示加载提示
        showLoading('正在提交评估数据...');
        
        // 发送到后端API
        const response = await fetch('http://localhost:3000/api/assessments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            // 提交成功
            hideLoading();
            showSuccess('评估提交成功！');
            
            // 自动跳转到报告页面
            window.location.href = `/unified_health_assessment_comparison.html?assessment_id=${result.data.assessment_id}`;
        } else {
            // 提交失败
            hideLoading();
            showError(result.message || '提交失败，请重试');
        }
    } catch (error) {
        hideLoading();
        showError('网络错误，请检查连接后重试');
        console.error('提交评估失败:', error);
    }
}
```

---

### 4.2 修改管理后台数据加载逻辑

**原来的逻辑（读取本地JSON文件）**：
```javascript
async function loadAssessmentData() {
    try {
        const response = await fetch('first_assessment_20251213.json');
        const data = await response.json();
        renderAssessment(data);
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}
```

**新的逻辑（从API获取数据）**：
```javascript
async function loadAssessmentData(assessmentId) {
    try {
        showLoading('正在加载数据...');
        
        const response = await fetch(`http://localhost:3000/api/assessments/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`
            }
        });
        
        const result = await response.json();
        
        if (result.code === 200) {
            hideLoading();
            renderAssessment(result.data);
        } else {
            hideLoading();
            showError(result.message || '加载数据失败');
        }
    } catch (error) {
        hideLoading();
        showError('网络错误，请重试');
        console.error('加载数据失败:', error);
    }
}
```

---

### 4.3 JWT Token管理

```javascript
// 保存Token
function saveToken(token) {
    localStorage.setItem('yuanqi_token', token);
}

// 获取Token
function getAuthToken() {
    return localStorage.getItem('yuanqi_token');
}

// 删除Token（登出）
function removeToken() {
    localStorage.removeItem('yuanqi_token');
}

// 检查Token是否过期
function isTokenExpired() {
    const token = getAuthToken();
    if (!token) return true;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}
```

---

## 五、Nginx反向代理配置

### 5.1 配置文件

创建配置文件 `/etc/nginx/sites-available/yuanqi-api`：

```nginx
upstream yuanqi_backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name api.yuanqiyuanliu.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yuanqiyuanliu.com;
    
    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/api.yuanqiyuanliu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yuanqiyuanliu.com/privkey.pem;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全配置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 请求大小限制
    client_max_body_size 10M;
    
    # 代理到后端
    location / {
        proxy_pass http://yuanqi_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 日志配置
    access_log /var/log/nginx/yuanqi-api-access.log;
    error_log /var/log/nginx/yuanqi-api-error.log;
}
```

---

### 5.2 启用配置

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/yuanqi-api /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

## 六、常见问题

### Q1: 连接数据库失败

**错误信息**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**解决方案**:
1. 检查MySQL服务是否启动：`sudo systemctl status mysql`
2. 检查数据库配置是否正确：`.env` 文件中的 `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`
3. 检查防火墙是否阻止了3306端口

---

### Q2: JWT Token验证失败

**错误信息**:
```
code: 403, message: '无效的认证令牌'
```

**解决方案**:
1. 检查Token格式：`Authorization: Bearer {token}`
2. 检查Token是否过期
3. 检查 `JWT_SECRET` 是否一致

---

### Q3: PDF生成失败

**错误信息**:
```
Error: Failed to launch the browser process
```

**解决方案**:
1. 确保已安装Puppeteer的依赖库
2. Ubuntu: `sudo apt-get install -y chromium-browser`
3. macOS: `brew install chromium`

---

### Q4: 文件上传失败

**错误信息**:
```
Error: File too large
```

**解决方案**:
1. 检查 `.env` 文件中的 `MAX_FILE_SIZE` 配置
2. 检查Nginx配置中的 `client_max_body_size`

---

## 七、生产环境建议

### 7.1 使用PM2管理进程

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start backend-api-server.js --name yuanqi-backend

# 开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs yuanqi-backend

# 重启应用
pm2 restart yuanqi-backend

# 停止应用
pm2 stop yuanqi-backend
```

---

### 7.2 数据库备份

```bash
# 创建备份脚本
cat > /usr/local/bin/backup-mysql.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
MYSQL_USER="root"
MYSQL_PASSWORD="your_password"
DATABASE="yuanqi_health"

mkdir -p $BACKUP_DIR
mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD $DATABASE | gzip > $BACKUP_DIR/yuanqi_health_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "yuanqi_health_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/backup-mysql.sh

# 添加到crontab（每天凌晨2点备份）
crontab -e
# 添加: 0 2 * * * /usr/local/bin/backup-mysql.sh
```

---

### 7.3 日志管理

```javascript
// 使用日志库（如winston）
const winston = require('winston');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
```

---

## 八、性能优化

### 8.1 数据库连接池

已在代码中配置：
```javascript
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,  // 连接池大小
    queueLimit: 0
});
```

---

### 8.2 Redis缓存（可选）

```bash
# 安装Redis
sudo apt-get install redis-server

# 启动Redis
sudo systemctl start redis-server
```

---

## 九、安全建议

1. **修改默认密码**: 首次部署后立即修改管理员密码
2. **使用HTTPS**: 生产环境必须使用SSL证书
3. **配置CORS**: 限制允许的域名
4. **输入验证**: 验证所有用户输入
5. **SQL注入防护**: 使用参数化查询
6. **XSS防护**: 对输出进行转义
7. **CSRF防护**: 实现CSRF令牌

---

## 十、支持与反馈

- **文档版本**: v1.0.0
- **最后更新**: 2026-01-27
- **技术支持**: support@yuanqiyuanliu.com

---

**祝你部署成功！**
