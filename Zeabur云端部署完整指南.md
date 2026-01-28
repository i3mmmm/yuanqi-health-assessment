# 🚀 元炁源流健康评估系统 - Zeabur 云端部署完整指南

## 📋 前置准备

在开始之前，请确保您已准备好：

- [ ] Zeabur 账号（免费注册）
- [ ] 已创建的 Zeabur MySQL 服务
- [ ] GitHub 账号（用于代码托管）
- [ ] 项目源代码文件

---

## 🎯 第一步：准备项目文件

### 1. 创建项目目录结构

在您的本地电脑上，创建以下目录结构：

```
yuanqi-health-assessment/
├── package.json                  # Node.js 依赖配置
├── backend-api-server.js         # 后端API服务
├── database_schema.sql           # 数据库表结构
├── data_migration.js             # 数据迁移脚本
├── symptoms_299_complete.json    # 症状数据
├── frontend/                     # 前端文件目录
│   ├── health_assessment_ultimate.html
│   ├── health_assessment_backend_complete.html
│   └── symptoms_299_complete.json
└── public/                       # 静态资源目录
    ├── 元炁源流横版金色.png
    ├── 元炁源流竖版金色.png
    └── 元炁源流横版黑红色.png
```

### 2. 创建 package.json

```json
{
  "name": "yuanqi-health-assessment",
  "version": "1.0.0",
  "description": "元炁源流健康评估系统",
  "main": "backend-api-server.js",
  "scripts": {
    "start": "node backend-api-server.js",
    "init-db": "node data_migration.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "cors": "^2.8.6",
    "jsonwebtoken": "^9.0.3",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.6.1",
    "multer": "^2.0.2",
    "pdf-lib": "^1.17.1",
    "winston": "^3.19.0"
  },
  "engines": {
    "node": ">=18.x"
  }
}
```

### 3. 创建 .zeaburignore 文件

```
node_modules/
.DS_Store
*.log
.env.local
.vscode/
.idea/
```

---

## 🔗 第二步：上传代码到 GitHub

### 1. 创建 GitHub 仓库

1. 登录 GitHub
2. 点击右上角 "+" → "New repository"
3. 仓库名称：`yuanqi-health-assessment`
4. 设置为 Public（Zeabur 免费版需要公开仓库）
5. 点击 "Create repository"

### 2. 上传代码

**方式A：使用 GitHub Desktop（推荐新手）**

1. 下载并安装 GitHub Desktop
2. Clone 您刚创建的仓库
3. 将项目文件复制到本地仓库目录
4. 在 GitHub Desktop 中提交更改
5. 点击 "Publish repository"

**方式B：使用 Git 命令行**

```bash
# 在项目目录下执行
cd yuanqi-health-assessment

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit"

# 关联远程仓库
git remote add origin https://github.com/您的用户名/yuanqi-health-assessment.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 第三步：在 Zeabur 部署后端服务

### 1. 登录 Zeabur

访问：https://zeabur.com/
使用 GitHub 账号登录

### 2. 创建新项目

1. 点击 "New Project"
2. 点击 "Deploy from GitHub"
3. 选择 `yuanqi-health-assessment` 仓库
4. 点击 "Import"

### 3. 配置后端服务

Zeabur 会自动检测到 package.json 并创建一个 Node.js 服务。

**配置以下内容：**

#### 3.1 设置环境变量

在服务配置页面，点击 "Variables" → "Add Variable"

添加以下环境变量：

```env
PORT=3000
NODE_ENV=production

# MySQL 数据库配置（稍后配置）
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

# JWT 密钥（生产环境必须修改）
JWT_SECRET=your_production_secret_key_here
JWT_EXPIRES_IN=7d

# PDF 存储路径
PDF_STORAGE_PATH=/app/reports
```

#### 3.2 配置数据库连接

**步骤A：查看 MySQL 连接信息**

1. 在 Zeabur 项目中，找到您的 MySQL 服务
2. 点击进入 MySQL 服务配置页面
3. 复制以下信息：
   - Host（主机地址）
   - Port（端口号）
   - Username（用户名）
   - Password（密码）
   - Database（数据库名）

**步骤B：更新环境变量**

回到后端服务配置页面，更新 DB_* 环境变量：

```env
DB_HOST=your-mysql-host.zeabur.com
DB_PORT=your-mysql-port
DB_USER=your-mysql-username
DB_PASSWORD=your-mysql-password
DB_NAME=your-mysql-database-name
```

### 4. 部署服务

1. 点击 "Deploy" 按钮
2. 等待部署完成（通常需要 2-5 分钟）
3. 部署成功后，您会获得一个后端服务的 URL，例如：
   ```
   https://yuanqi-api.zeabur.app
   ```

---

## 🌐 第四步：部署前端页面

### 1. 创建 Static Site 服务

1. 在 Zeabur 项目中，点击 "Create Service"
2. 选择 "Prebuilt Image"
3. 选择 "Nginx" 作为基础镜像
4. 点击 "Create"

### 2. 配置前端服务

#### 2.1 设置静态文件目录

在服务配置页面：
- Root Directory: `/app/frontend`
- Index File: `health_assessment_ultimate.html`

#### 2.2 配置反向代理（可选）

如果需要前端直接访问 API，配置 Nginx 反向代理：

```nginx
location /api/ {
    proxy_pass http://后端服务名称:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 3. 部署前端

1. 点击 "Deploy"
2. 等待部署完成
3. 获得前端服务的 URL，例如：
   ```
   https://yuanqi-frontend.zeabur.app
   ```

---

## 🔧 第五步：初始化数据库

### 1. 连接到 MySQL

有两种方式：

**方式A：使用 Zeabur 终端**

1. 在 MySQL 服务页面，点击 "Terminal"
2. 进入 MySQL 命令行

**方式B：使用本地 MySQL 客户端**

```bash
mysqlsh --sql --host=your-mysql-host.zeabur.com --port=your-mysql-port --user=your-mysql-username --password=your-mysql-password
```

### 2. 导入数据库表结构

```sql
-- 复制 database_schema.sql 的内容并执行
-- 或者使用 source 命令
source /app/database_schema.sql;
```

### 3. 运行数据迁移脚本

在 Zeabur 后端服务的 Terminal 中执行：

```bash
npm run init-db
```

或者在本地执行（使用 Zeabur 的数据库连接信息）：

```bash
node data_migration.js
```

---

## ✅ 第六步：验证部署

### 1. 测试后端 API

在浏览器中访问：

```bash
# 健康检查
https://yuanqi-api.zeabur.app/api/health

# 获取症状列表
https://yuanqi-api.zeabur.app/api/symptoms
```

**预期响应：**

```json
{
  "service": "health-assessment-api",
  "status": "running",
  "database": "connected",
  "timestamp": "2026-01-28T10:00:00.000Z"
}
```

### 2. 测试前端页面

访问前端服务 URL：

```
https://yuanqi-frontend.zeabur.app
```

应该能够看到健康自检评估页面。

### 3. 测试完整流程

1. 在前端页面选择症状
2. 填写调理方案
3. 提交评估
4. 在评估记录页面查看数据

---

## 🔒 第七步：配置自定义域名（可选）

### 1. 绑定后端域名

1. 在 Zeabur 后端服务配置页面
2. 点击 "Domains" → "Add Domain"
3. 输入您的域名（例如：api.yourdomain.com）
4. 按照提示配置 DNS 记录

### 2. 绑定前端域名

1. 在 Zeabur 前端服务配置页面
2. 点击 "Domains" → "Add Domain"
3. 输入您的域名（例如：www.yourdomain.com）
4. 按照提示配置 DNS 记录

### 3. 配置 SSL 证书

Zeabur 会自动为自定义域名配置 SSL 证书（HTTPS），无需额外操作。

---

## 📊 第八步：监控和维护

### 1. 查看日志

在 Zeabur 控制台中：
- 点击服务名称
- 点击 "Logs" 标签
- 实时查看服务运行日志

### 2. 设置监控

在服务配置页面：
- 点击 "Monitoring"
- 配置 CPU、内存、磁盘监控告警

### 3. 自动扩展

Zeabur 默认提供自动扩展功能：
- 当访问量增加时，自动增加实例
- 当访问量降低时，自动减少实例
- 按需付费，节省成本

---

## 🔄 第九步：更新部署

### 1. 修改代码

在本地修改代码后：

```bash
# 提交更改
git add .
git commit -m "更新功能"
git push
```

### 2. 自动部署

Zeabur 会自动检测到 GitHub 仓库的更新，并触发重新部署。

### 3. 查看部署状态

在 Zeabur 控制台中查看部署进度和日志。

---

## 💰 费用说明

Zeabur 免费套餐包含：

- ✅ 免费部署额度
- ✅ 每月一定量的免费流量
- ✅ 自动 SSL 证书
- ✅ 自动备份

超出免费额度后，按实际使用量付费：

- 后端服务：$0.00018/GB·小时
- 前端服务：$0.000028/GB·小时
- MySQL 数据库：$0.000056/GB·小时

**估算费用：**
- 小型应用（日均访问量 < 1000）：基本免费
- 中型应用（日均访问量 1000-10000）：约 $5-20/月
- 大型应用（日均访问量 > 10000）：按实际使用量计费

---

## ❓ 常见问题

### Q1: 部署失败怎么办？

**A:** 检查以下几点：
1. package.json 是否正确配置
2. 环境变量是否全部填写
3. 数据库连接信息是否正确
4. 查看部署日志中的错误信息

### Q2: 数据库连接失败？

**A:** 确认：
1. MySQL 服务是否正在运行
2. 数据库连接信息是否正确
3. 网络策略是否允许服务间通信（Zeabur 默认允许）

### Q3: 前端无法访问后端 API？

**A:** 检查：
1. CORS 配置是否正确
2. API 地址是否正确
3. 后端服务是否正常运行

### Q4: 如何备份数据？

**A:** Zeabur 提供：
1. 自动备份功能
2. 手动导出数据库功能
3. 定期导出功能

### Q5: 如何查看详细日志？

**A:** 在 Zeabur 控制台中：
1. 点击服务名称
2. 点击 "Logs"
3. 选择时间范围
4. 查看详细日志

---

## 🎉 部署完成！

恭喜您，健康评估系统已成功部署到 Zeabur 云端！

**现在您可以：**
- ✅ 通过自定义域名访问系统
- ✅ 随时随地管理健康评估数据
- ✅ 享受自动扩展和负载均衡
- ✅ 使用自动备份和监控

**下一步建议：**
1. 绑定自定义域名
2. 配置监控告警
3. 定期备份数据
4. 根据需求优化性能

**需要帮助？**
- Zeabur 文档：https://zeabur.com/docs
- GitHub 仓库：https://github.com/您的用户名/yuanqi-health-assessment

祝您使用愉快！🚀
