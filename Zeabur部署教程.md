# 元炁源流健康评估系统 - Zeabur部署教程

## 🎯 Zeabur平台特点

- ✅ 免费方案支持Node.js和MySQL
- ✅ 自动配置HTTPS
- ✅ 自动生成域名（如：931.zeabur.app）
- ✅ 可视化部署界面
- ✅ 一键部署，无需复杂配置
- ✅ 自动扩展

---

## 📋 部署准备清单

### 第一步：准备文件

从您的文件列表中，需要准备以下文件：

#### 后端文件（用于Zeabur服务）
```
backend-api-server.js          # 后端API服务
database_schema.sql            # 数据库架构
data_migration.js               # 数据迁移脚本
package.json                   # 依赖配置（需要创建）
```

#### 前端文件（用于静态托管）
```
health_assessment_final_fixed.html          # 评估页面
health_assessment_backend_complete.html      # 管理后台
frontend-api-integration.js                 # 前端API集成
admin-api-integration.js                    # 后台API集成
```

#### 数据文件（用于初始化）
```
symptoms_299_complete.json
first_assessment_20251213.json
second_assessment_20260113.json
sample_assessment_data.json
```

#### 品牌图片
```
元炁源流横版金色.png
元炁源流横版黑红色.png
元炁源流竖版金色.png
元炁源流竖版黑红色.png
```

---

## 🚀 部署步骤（详细）

### 步骤1：注册Zeabur账户

1. 访问：https://zeabur.com/
2. 点击"Get Started Free"
3. 注册账户（支持GitHub、GitLab、Email）
4. 验证邮箱

### 步骤2：创建项目

1. 登录Zeabur控制台
2. 点击"Create Project"
3. 项目名称：`yuanqi-health-assessment`
4. 选择区域：推荐选择"Hong Kong"或"Singapore"（访问速度较快）
5. 点击"Create"

### 步骤3：创建MySQL数据库

#### 3.1 添加MySQL服务

1. 在项目页面，点击"Add Service"
2. 选择"Marketplace"
3. 搜索"MySQL"或找到"MySQL"图标
4. 点击"MySQL"
5. 选择版本：推荐`8.0`
6. 选择计划：选择免费计划（Free Plan）
7. 点击"Deploy"

#### 3.2 获取数据库连接信息

1. 等待MySQL服务部署完成（约2-3分钟）
2. 点击MySQL服务
3. 在"Variables"标签页，查看以下信息：
   - `MYSQL_HOST`：数据库主机地址
   - `MYSQL_PORT`：端口（通常是3306）
   - `MYSQL_DATABASE`：数据库名称
   - `MYSQL_USERNAME`：用户名
   - `MYSQL_PASSWORD`：密码

**⚠️ 重要：请复制保存这些信息！**

### 步骤4：准备后端代码

#### 4.1 创建package.json文件

创建一个名为`package.json`的文件，内容如下：

```json
{
  "name": "yuanqi-health-assessment-api",
  "version": "1.0.0",
  "description": "元炁源流健康评估系统 - 后端API",
  "main": "backend-api-server.js",
  "scripts": {
    "start": "node backend-api-server.js",
    "init-db": "node data_migration.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "winston": "^3.10.0",
    "html-pdf": "^3.0.1",
    "ejs": "^3.1.9",
    "dotenv": "^16.3.1"
  },
  "engines": {
    "node": ">=14.x"
  }
}
```

#### 4.2 创建.env文件

创建一个名为`.env`的文件，内容如下（稍后需要填入实际值）：

```env
PORT=3000
NODE_ENV=production

# 数据库配置（从Zeabur获取）
DB_HOST=${MYSQL_HOST}
DB_PORT=${MYSQL_PORT}
DB_USER=${MYSQL_USERNAME}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}

# JWT配置
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# PDF配置
PDF_STORAGE_PATH=./reports

# 日志配置
LOG_LEVEL=info
```

**说明：**
- Zeabur会自动替换 `${MYSQL_HOST}` 等变量为实际值
- JWT_SECRET可以自己生成，或在部署后修改
- 这个文件需要和backend-api-server.js一起上传

#### 4.3 修改data_migration.js以适配Zeabur

由于Zeabur的MySQL连接方式特殊，需要对data_migration.js做小修改：

在文件开头，找到数据库配置部分，修改为：

```javascript
// 数据库配置（Zeabur会自动注入环境变量）
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yuanqi_health_db',
    multipleStatements: true
};
```

### 步骤5：部署后端API到Zeabur

#### 5.1 上传后端代码到GitHub（推荐）

**方法A：使用Git上传（推荐）**

1. 在本地创建项目目录：
   ```bash
   mkdir yuanqi-api
   cd yuanqi-api
   ```

2. 复制以下文件到该目录：
   - backend-api-server.js
   - database_schema.sql
   - data_migration.js
   - package.json（刚创建的）
   - .env（刚创建的）
   - symptoms_299_complete.json
   - first_assessment_20251213.json
   - second_assessment_20260113.json
   - sample_assessment_data.json

3. 初始化Git仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. 在GitHub创建新仓库：
   - 访问：https://github.com/new
   - 仓库名：`yuanqi-health-assessment-api`
   - 设为Public或Private（Private更安全）
   - 点击"Create repository"

5. 推送到GitHub：
   ```bash
   git remote add origin https://github.com/yourusername/yuanqi-health-assessment-api.git
   git branch -M main
   git push -u origin main
   ```

#### 5.2 在Zeabur部署后端

1. 回到Zeabur项目页面
2. 点击"Add Service"
3. 选择"Git Service"
4. 授权Zeabur访问您的GitHub账户
5. 选择刚创建的仓库：`yuanqi-health-assessment-api`
6. 选择分支：`main`
7. 点击"Deploy"

#### 5.3 配置环境变量

1. 等待后端服务部署完成
2. 点击后端服务
3. 在"Variables"标签页，添加以下变量：

**必需变量：**
- `PORT` = `3000`
- `NODE_ENV` = `production`
- `JWT_SECRET` = `your_jwt_secret_key_at_least_32_characters_long`
- `JWT_EXPIRES_IN` = `7d`

**自动变量（Zeabur自动注入）：**
- `MYSQL_HOST`（自动关联MySQL服务）
- `MYSQL_PORT`（自动关联MySQL服务）
- `MYSQL_USERNAME`（自动关联MySQL服务）
- `MYSQL_PASSWORD`（自动关联MySQL服务）
- `MYSQL_DATABASE`（自动关联MySQL服务）

**关联MySQL服务：**
1. 在"Variables"页面，点击"Add Variable"
2. 名称：`MYSQL_HOST`
3. 值：点击"Link to Service"，选择之前创建的MySQL服务
4. 重复以上步骤，关联其他MySQL变量

#### 5.4 修改backend-api-server.js以支持Zeabur

在backend-api-server.js中，找到数据库配置部分，确保使用环境变量：

```javascript
// 在文件开头
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USERNAME || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'yuanqi_health_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};
```

#### 5.5 初始化数据库

1. 在Zeabur控制台，点击后端服务
2. 点击"Logs"标签页
3. 点击"Restart"按钮
4. 等待服务重启

**重要：Zeabur首次部署时，data_migration.js不会自动执行，需要手动执行一次。**

方法1：使用Zeabur的Terminal（如果支持）
- 在服务页面找到"Terminal"或"Console"
- 执行：`node data_migration.js`

方法2：在代码中添加自动初始化
修改backend-api-server.js，在服务器启动时检查并初始化数据库：

```javascript
// 在app.listen之前添加
async function initializeDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // 检查症状库是否为空
        const [symptoms] = await connection.execute('SELECT COUNT(*) as count FROM symptom_library');
        
        if (symptoms[0].count === 0) {
            console.log('初始化数据库...');
            await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
            
            // 导入database_schema.sql
            const schema = fs.readFileSync('./database_schema.sql', 'utf8');
            await connection.query(schema);
            
            // 执行数据迁移（简化版，只导入症状库）
            const symptomsData = JSON.parse(fs.readFileSync('./symptoms_299_complete.json', 'utf8'));
            for (const symptom of symptomsData.symptoms) {
                await connection.execute(
                    `INSERT INTO symptom_library (name, color_region, organ, severity, causes, warnings, taboos, side, description) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        symptom.name,
                        symptom.colorRegion || null,
                        symptom.organ || null,
                        symptom.severity || 'moderate',
                        symptom.causes ? JSON.stringify(symptom.causes) : null,
                        symptom.warnings ? JSON.stringify(symptom.warnings) : null,
                        symptom.taboos ? JSON.stringify(symptom.taboos) : null,
                        symptom.side || 'both',
                        symptom.description || null
                    ]
                );
            }
            
            // 创建默认管理员
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.execute(
                `INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)`,
                ['admin', hashedPassword, '系统管理员', 'admin']
            );
            
            await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
            console.log('数据库初始化完成');
        }
        
        await connection.end();
    } catch (error) {
        console.error('数据库初始化失败:', error);
    }
}

// 在app.listen之前调用
initializeDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
```

重新部署后端服务，自动初始化数据库。

### 步骤6：获取后端API地址

1. 在Zeabur控制台，点击后端服务
2. 在"Domains"标签页，可以看到自动生成的域名
3. 复制域名，例如：`https://yuanqi-api.zeabur.app` 或 `https://931.zeabur.app`

**记录这个域名，后续配置前端时需要用到。**

### 步骤7：部署前端（静态网站）

#### 7.1 创建GitHub仓库存放前端代码

1. 在本地创建目录：
   ```bash
   mkdir yuanqi-frontend
   cd yuanqi-frontend
   ```

2. 复制以下文件到该目录：
   - health_assessment_final_fixed.html
   - health_assessment_backend_complete.html
   - frontend-api-integration.js
   - admin-api-integration.js
   - 元炁源流横版金色.png
   - 元炁源流横版黑红色.png
   - 元炁源流竖版金色.png
   - 元炁源流竖版黑红色.png

3. 初始化Git仓库：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

4. 在GitHub创建新仓库：
   - 仓库名：`yuanqi-health-assessment-frontend`
   - 点击"Create repository"

5. 推送到GitHub：
   ```bash
   git remote add origin https://github.com/yourusername/yuanqi-health-assessment-frontend.git
   git branch -M main
   git push -u origin main
   ```

#### 7.2 在Zeabur部署前端

1. 回到Zeabur项目页面
2. 点击"Add Service"
3. 选择"Git Service"
4. 选择刚创建的前端仓库：`yuanqi-health-assessment-frontend`
5. 选择分支：`main`
6. 点击"Deploy"

#### 7.3 配置前端服务

1. 等待前端服务部署完成
2. 在"Domains"标签页，可以看到自动生成的域名
3. 复制域名，例如：`https://yuanqi-frontend.zeabur.app`

#### 7.4 修改前端配置文件

由于Zeabur会自动生成域名，需要修改前端配置以适应。有两种方法：

**方法1：在部署前修改配置**

修改`frontend-api-integration.js`：

```javascript
const API_CONFIG = {
    baseURL: 'https://931.zeabur.app',  // 改为后端的Zeabur域名
    endpoints: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        submit: '/api/assessments',
        getAssessment: '/api/assessments/',
        symptoms: '/api/symptoms'
    }
};
```

同样修改`admin-api-integration.js`：

```javascript
const AdminAPIConfig = {
    baseURL: 'https://931.zeabur.app',  // 改为后端的Zeabur域名
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
```

修改后，重新提交到GitHub：
```bash
git add .
git commit -m "Update API URL"
git push
```

**方法2：在部署后通过环境变量配置**

创建一个`config.js`文件：

```javascript
// config.js
const API_CONFIG = {
    baseURL: process.env.API_BASE_URL || 'https://931.zeabur.app',
    // ...
};

const AdminAPIConfig = {
    baseURL: process.env.API_BASE_URL || 'https://931.zeabur.app',
    // ...
};

// 导出到全局
if (typeof window !== 'undefined') {
    window.API_CONFIG = API_CONFIG;
    window.AdminAPIConfig = AdminAPIConfig;
}
```

在HTML文件中引入：
```html
<script src="config.js"></script>
<script src="frontend-api-integration.js"></script>
```

在Zeabur前端服务的"Variables"中添加：
- `API_BASE_URL` = `https://931.zeabur.app`

### 步骤8：测试部署

#### 8.1 测试后端API

1. 在浏览器访问：`https://931.zeabur.app/api/stats`
2. 应该返回JSON格式的统计数据

或使用curl测试：
```bash
curl https://931.zeabur.app/api/stats
```

#### 8.2 测试前端页面

1. 在浏览器访问：`https://yuanqi-frontend.zeabur.app/health_assessment_final_fixed.html`
2. 应该可以看到评估表单

#### 8.3 测试管理后台

1. 在浏览器访问：`https://yuanqi-frontend.zeabur.app/health_assessment_backend_complete.html`
2. 登录：
   - 用户名：`admin`
   - 密码：`admin123`

### 步骤9：配置自定义域名（可选）

如果您有自己的域名，可以配置自定义域名。

#### 9.1 配置后端自定义域名

1. 在Zeabur控制台，点击后端服务
2. 在"Domains"标签页，点击"Generate Domain"或"Add Custom Domain"
3. 输入您的域名，例如：`api.yourdomain.com`
4. Zeabur会自动配置SSL证书

#### 9.2 配置前端自定义域名

1. 在Zeabur控制台，点击前端服务
2. 在"Domains"标签页，添加自定义域名
3. 输入您的域名，例如：`www.yourdomain.com`

#### 9.3 配置DNS解析

在您的域名注册商处，添加DNS记录：

```
Type: CNAME
Name: api
Value: your-zeabur-domain.zeabur.app

Type: CNAME
Name: www
Value: your-zeabur-domain.zeabur.app
```

---

## 🎉 部署完成！

### 访问地址

根据您的部署情况，您可能有以下访问地址：

**评估页面：**
- Zeabur自动域名：`https://yuanqi-frontend.zeabur.app/health_assessment_final_fixed.html`
- 或自定义域名：`https://www.yourdomain.com/health_assessment_final_fixed.html`

**管理后台：**
- Zeabur自动域名：`https://yuanqi-frontend.zeabur.app/health_assessment_backend_complete.html`
- 或自定义域名：`https://www.yourdomain.com/health_assessment_backend_complete.html`

**后端API：**
- Zeabur自动域名：`https://931.zeabur.app/`
- 或自定义域名：`https://api.yourdomain.com/`

---

## 📊 Zeabur服务架构

```
┌─────────────────────────────────────────┐
│         Zeabur Project                  │
├──────────────────┬──────────────────────┤
│  MySQL Service   │  Backend API Service │
│  (Free Plan)     │  (Free Plan)         │
│                  │                      │
│  Database:       │  backend-api-server.js│
│  yuanqi_health_db│  Port: 3000          │
│                  │  Domain:             │
│  - users         │  931.zeabur.app      │
│  - assessments   │                      │
│  - symptoms      │                      │
│  - analysis      │                      │
└──────────────────┴──────────────────────┘
                    ↓
         ┌──────────────────┐
         │ Frontend Service │
         │  (Free Plan)     │
         │                  │
         │  Static Files:   │
         │  - HTML          │
         │  - JS            │
         │  - Images        │
         │                  │
         │  Domain:         │
         │  yuanqi-frontend │
         │  .zeabur.app     │
         └──────────────────┘
```

---

## ⚠️ 常见问题

### Q1: Zeabur免费方案有什么限制？

**A:** Zeabur免费方案的限制：
- 内存：512MB
- CPU：0.1 vCPU
- 带宽：100GB/月
- 数据库：MySQL（2GB存储）
- 端口：仅支持HTTP(S)

对于小型健康评估系统来说，免费方案足够使用。

### Q2: 如何监控服务状态？

**A:** 在Zeabur控制台：
- 查看服务状态（Running/Stopped/Error）
- 查看日志（Logs标签页）
- 查看资源使用情况（Metrics标签页）
- 设置告警（Alerts标签页）

### Q3: 如何备份数据？

**A:** Zeabur提供自动备份功能：
1. 进入MySQL服务
2. 在"Backups"标签页
3. 创建手动备份
4. 或配置自动备份策略

### Q4: 如何更新代码？

**A:** 只需推送到GitHub：
```bash
git add .
git commit -m "Update code"
git push
```
Zeabur会自动检测并重新部署。

### Q5: 部署失败怎么办？

**A:** 查看日志：
1. 在Zeabur控制台，点击失败的服务
2. 进入"Logs"标签页
3. 查看错误信息
4. 根据错误信息修复代码
5. 重新部署

### Q6: 如何查看数据库内容？

**A:** 使用Zeabur提供的MySQL客户端：
1. 进入MySQL服务
2. 点击"Connect"按钮
3. 会提供一个连接命令，可以在本地执行：
```bash
mysql -h <host> -P <port> -u <user> -p <database>
```

或者使用图形化工具（如MySQL Workbench、phpMyAdmin）连接。

---

## 🔧 高级配置

### 配置日志

在backend-api-server.js中，使用Winston记录日志：

```javascript
const winston = require('winston');
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'logs/app.log' })
    ]
});

// 使用日志
logger.info('Server started');
logger.error('Database connection failed');
```

### 配置健康检查

在backend-api-server.js中添加健康检查端点：

```javascript
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});
```

在Zeabur服务配置中，设置健康检查URL为`/health`。

---

## 📞 需要帮助？

如果部署过程中遇到问题，请提供：
1. 错误信息（截图或文字）
2. Zeabur控制台的日志
3. 您执行到哪一步

我会帮您解决问题！

祝您部署顺利！🚀
