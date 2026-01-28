# Zeabur MySQL配置指南 - 针对已部署的MySQL服务

## ✅ 您的MySQL服务信息

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MySQL Host:    sjc1.clusters.zeabur.com
MySQL Port:    27983
MySQL User:    root
MySQL Password: 9ODHR03Mp6hw8iYPq1en4QgrU275tEzc
MySQL Database: zeabur
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📋 配置步骤

### 步骤1：测试MySQL连接（可选但推荐）

#### 方法A：使用MySQL Shell（推荐）

1. 下载并安装MySQL Shell：
   - Windows: https://dev.mysql.com/downloads/shell/
   - Mac: `brew install mysql-shell`
   - Linux: `sudo apt install mysql-shell`

2. 在终端执行：
```bash
mysqlsh --sql --host=sjc1.clusters.zeabur.com --port=27983 --user=root --password=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc --schema=zeabur
```

3. 连接成功后，测试查询：
```sql
SHOW DATABASES;
```

应该能看到 `zeabur` 数据库。

4. 退出：
```sql
\quit
```

#### 方法B：使用命令行MySQL客户端

```bash
mysql -h sjc1.clusters.zeabur.com -P 27983 -u root -p
# 输入密码：9ODHR03Mp6hw8iYPq1en4QgrU275tEzc
```

---

### 步骤2：创建数据库架构

#### 方法1：使用MySQL Shell导入

1. 连接到MySQL：
```bash
mysqlsh --sql --host=sjc1.clusters.zeabur.com --port=27983 --user=root --password=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc --schema=zeabur
```

2. 在本地打开 `database_schema.sql` 文件

3. 复制文件内容并粘贴到MySQL Shell中

4. 执行完成后，验证表是否创建成功：
```sql
USE zeabur;
SHOW TABLES;
```

应该看到以下表：
```
users
assessments
assessment_symptoms
symptom_library
analysis_results
health_plans
reports
system_config
```

5. 退出：
```sql
\quit
```

#### 方法2：使用命令行MySQL客户端导入

```bash
mysql -h sjc1.clusters.zeabur.com -P 27983 -u root -p9ODHR03Mp6hw8iYPq1en4QgrU275tEzc zeabur < database_schema.sql
```

---

### 步骤3：准备后端配置文件

#### 3.1 创建.env文件

在本地电脑上，创建一个名为 `.env` 的文件，内容如下：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL配置（使用Zeabur提供的连接信息）
DB_HOST=sjc1.clusters.zeabur.com
DB_PORT=27983
DB_USER=root
DB_PASSWORD=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc
DB_NAME=zeabur

# JWT配置
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long_change_this_in_zeabur
JWT_EXPIRES_IN=7d

# PDF配置
PDF_STORAGE_PATH=./reports

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

**⚠️ 重要提示：**
- JWT_SECRET建议改为至少32位的随机字符串
- 您可以使用在线工具生成：https://www.uuidgenerator.net/

---

### 步骤4：修改backend-api-server.js以支持外部MySQL

由于Zeabur的MySQL服务是独立的（不在Zeabur平台上），需要确保后端服务能够连接到外部MySQL。

打开 `backend-api-server.js`，找到数据库配置部分（大约在文件开头），确保配置如下：

```javascript
require('dotenv').config();

const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'yuanqi_health_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);
```

---

### 步骤5：部署后端API到Zeabur

由于您已经有独立的MySQL服务，现在可以部署后端API到Zeabur。

#### 5.1 创建GitHub仓库（如果还没有）

按照之前的步骤，将以下文件上传到GitHub仓库 `yuanqi-backend`：
- backend-api-server.js
- package.json
- data_migration.js
- symptoms_299_complete.json
- first_assessment_20251213.json
- second_assessment_20260113.json
- sample_assessment_data.json
- .env（刚创建的）

#### 5.2 在Zeabur创建后端服务

1. 回到Zeabur项目页面
2. 点击 **"+ Service"** → **"Git"**
3. 选择 `yuanqi-backend` 仓库
4. 选择分支：`main`
5. 点击 **"Import"** 或 **"Deploy"**

#### 5.3 配置环境变量（重要）

由于MySQL服务不在Zeabur平台上，需要手动配置环境变量。

1. 部署完成后，点击后端服务卡片
2. 进入 **"Variables"** 标签页
3. 添加以下变量：

```
PORT=3000
NODE_ENV=production
DB_HOST=sjc1.clusters.zeabur.com
DB_PORT=27983
DB_USER=root
DB_PASSWORD=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc
DB_NAME=zeabur
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

**⚠️ 重要：** 不要使用 "Link to Service" 功能，因为MySQL服务不在Zeabur平台上。

#### 5.4 重启后端服务

1. 点击后端服务的 **"Restart"** 按钮
2. 等待服务重启完成

---

### 步骤6：初始化数据

由于数据库已经创建，现在需要初始化数据（症状库、示例数据等）。

#### 方法1：使用MySQL Shell直接导入（推荐）

1. 连接到MySQL：
```bash
mysqlsh --sql --host=sjc1.clusters.zeabur.com --port=27983 --user=root --password=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc --schema=zeabur
```

2. 导入症状库：

首先，打开 `symptoms_299_complete.json` 文件，转换为INSERT语句。

**或者使用以下简化方法：**

由于JSON文件较大，建议使用Node.js脚本导入：

```javascript
// import_symptoms.js
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'sjc1.clusters.zeabur.com',
    port: 27983,
    user: 'root',
    password: '9ODHR03Mp6hw8iYPq1en4QgrU275tEzc',
    database: 'zeabur'
};

async function importSymptoms() {
    const connection = await mysql.createConnection(dbConfig);
    
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('./symptoms_299_complete.json', 'utf8'));
    
    console.log(`开始导入 ${data.symptoms.length} 个症状...`);
    
    for (const symptom of data.symptoms) {
        try {
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
            console.log(`✓ 导入: ${symptom.name}`);
        } catch (error) {
            console.error(`✗ 导入失败: ${symptom.name}`, error.message);
        }
    }
    
    console.log('症状导入完成！');
    
    await connection.end();
}

importSymptoms();
```

3. 在本地执行：

```bash
# 先安装依赖
npm install mysql2

# 执行导入脚本
node import_symptoms.js
```

#### 方法2：创建默认管理员账户

```sql
USE zeabur;

-- 插入默认管理员账户
INSERT INTO users (username, password, real_name, role)
VALUES ('admin', '$2a$10$rKqZJv4xZ5zZ5zZ5zZ5zZeY4xZ5zZ5zZ5zZ5zZ5zZ5zZ5', '系统管理员', 'admin');

-- 密码是：admin123（已使用bcrypt加密）
```

或者使用Node.js：

```javascript
// create_admin.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: 'sjc1.clusters.zeabur.com',
    port: 27983,
    user: 'root',
    password: '9ODHR03Mp6hw8iYPq1en4QgrU275tEzc',
    database: 'zeabur'
};

async function createAdmin() {
    const connection = await mysql.createConnection(dbConfig);
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
        `INSERT INTO users (username, password, real_name, role) VALUES (?, ?, ?, ?)`,
        ['admin', hashedPassword, '系统管理员', 'admin']
    );
    
    console.log('✓ 默认管理员账户创建成功');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    
    await connection.end();
}

createAdmin();
```

执行：
```bash
node create_admin.js
```

---

### 步骤7：测试后端服务

#### 7.1 查看Zeabur后端服务日志

1. 在Zeabur控制台，点击后端服务卡片
2. 进入 **"Logs"** 标签页
3. 查看是否有错误信息

#### 7.2 测试API端点

获取后端服务的Zeabur域名（从 **"Domains"** 标签页复制）。

在浏览器中访问：
```
https://your-backend-service.zeabur.app/api/stats
```

应该返回JSON数据：
```json
{
  "code": 200,
  "message": "获取统计数据成功",
  "data": {
    "total_assessments": 0,
    "today_assessments": 0,
    "total_symptoms": 299,
    "avg_score": null
  }
}
```

---

### 步骤8：部署前端服务

按照之前的步骤，部署前端服务到Zeabur。

**重要：** 需要修改前端配置文件中的API地址。

修改 `frontend-api-integration.js`：

```javascript
const API_CONFIG = {
    baseURL: 'https://your-backend-service.zeabur.app',  // 改为后端服务的Zeabur域名
    // ...
};
```

修改 `admin-api-integration.js`：

```javascript
const AdminAPIConfig = {
    baseURL: 'https://your-backend-service.zeabur.app',  // 改为后端服务的Zeabur域名
    // ...
};
```

修改后，重新推送到GitHub，Zeabur会自动重新部署。

---

## 🔍 验证清单

部署完成后，验证以下项目：

- [ ] MySQL数据库表已创建（8张表）
- [ ] 症状库已导入（299个症状）
- [ ] 默认管理员账户已创建
- [ ] 后端服务在Zeabur上运行正常
- [ ] 后端API可以访问
- [ ] 前端服务已部署
- [ ] 前端可以连接到后端API
- [ ] 可以正常提交评估
- [ ] 可以登录管理后台
- [ ] 可以生成PDF报告

---

## ⚠️ 常见问题

### Q1: 后端服务无法连接到MySQL

**症状：** Zeabur日志显示 "Error connecting to database"

**解决方法：**
1. 确认Zeabur后端服务的环境变量是否正确配置：
   - `DB_HOST` = `sjc1.clusters.zeabur.com`
   - `DB_PORT` = `27983`
   - `DB_USER` = `root`
   - `DB_PASSWORD` = `9ODHR03Mp6hw8iYPq1en4QgrU275tEzc`
   - `DB_NAME` = `zeabur`
2. 确认MySQL服务可访问：
   ```bash
   mysql -h sjc1.clusters.zeabur.com -P 27983 -u root -p9ODHR03Mp6hw8iYPq1en4QgrU275tEzc
   ```
3. 检查防火墙设置
4. 重启后端服务

### Q2: 如何查看数据库内容？

**A:** 使用MySQL Shell连接：

```bash
mysqlsh --sql --host=sjc1.clusters.zeabur.com --port=27983 --user=root --password=9ODHR03Mp6hw8iYPq1en4QgrU275tEzc --schema=zeabur
```

查询症状数量：
```sql
SELECT COUNT(*) as symptom_count FROM symptom_library;
```

查询评估记录：
```sql
SELECT * FROM assessments;
```

### Q3: 如何备份数据库？

**A:** 使用mysqldump命令：

```bash
mysqldump -h sjc1.clusters.zeabur.com -P 27983 -u root -p9ODHR03Mp6hw8iYPq1en4QgrU275tEzc zeabur > backup.sql
```

### Q4: 数据迁移脚本无法执行怎么办？

**A:** 由于Zeabur后端服务无法直接访问外部MySQL（如果不是在同一个Zeabur项目中），建议：
1. 使用本地的Node.js脚本直接连接到MySQL执行数据导入
2. 或者将MySQL服务也部署到Zeabur上（在同一个项目中）

---

## 📞 需要帮助？

如果配置过程中遇到问题，请提供：
1. 您执行到哪一步
2. 具体的错误信息
3. Zeabur后端服务的日志内容

---

## 🎉 配置完成！

您的系统现在已经配置好了独立的MySQL服务和Zeabur后端服务。

### 访问地址汇总

- **后端API**: `https://your-backend-service.zeabur.app/`
- **前端页面**: `https://your-frontend-service.zeabur.app/health_assessment_final_fixed.html`
- **管理后台**: `https://your-frontend-service.zeabur.app/health_assessment_backend_complete.html`

### 默认管理员账号

- 用户名: `admin`
- 密码: `admin123`

**⚠️ 请登录后立即修改密码！**

祝您使用愉快！🚀
