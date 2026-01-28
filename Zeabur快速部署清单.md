# Zeabur部署准备工具

## 📦 需要上传到Zeabur的文件清单

### 后端服务文件（上传到GitHub仓库1）

#### 必需文件：
```
✓ backend-api-server.js
✓ database_schema.sql
✓ data_migration.js
✓ package.json
✓ symptoms_299_complete.json
✓ first_assessment_20251213.json
✓ second_assessment_20260113.json
✓ sample_assessment_data.json
```

#### 可选文件（数据文件）：
- `2021自检表300症状分析.md`（可选）

---

### 前端服务文件（上传到GitHub仓库2）

#### 必需文件：
```
✓ health_assessment_final_fixed.html
✓ health_assessment_backend_complete.html
✓ frontend-api-integration.js
✓ admin-api-integration.js
```

#### 品牌图片：
```
✓ 元炁源流横版金色.png
✓ 元炁源流横版黑红色.png
✓ 元炁源流竖版金色.png
✓ 元炁源流竖版黑红色.png
```

---

## 🚀 快速部署步骤（3个GitHub仓库）

### 仓库1：后端API服务

#### 1.1 创建本地目录

```bash
# Windows PowerShell
mkdir yuanqi-api-backend
cd yuanqi-api-backend

# Mac/Linux Terminal
mkdir yuanqi-api-backend
cd yuanqi-api-backend
```

#### 1.2 复制后端文件

将以下文件从当前目录复制到 `yuanqi-api-backend` 目录：
- backend-api-server.js
- database_schema.sql
- data_migration.js
- package.json
- symptoms_299_complete.json
- first_assessment_20251213.json
- second_assessment_20260113.json
- sample_assessment_data.json

#### 1.3 创建.gitignore文件

创建 `.gitignore` 文件：
```
node_modules/
.env
logs/
reports/
*.log
.DS_Store
```

#### 1.4 创建.env文件

创建 `.env` 文件：
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

#### 1.5 初始化Git仓库

```bash
git init
git add .
git commit -m "Initial commit: Backend API service for Yuanqi Health Assessment"
```

#### 1.6 在GitHub创建仓库

1. 访问：https://github.com/new
2. Repository name: `yuanqi-api-backend`
3. Description: `元炁源流健康评估系统 - 后端API服务`
4. 勾选 "Private"（私有仓库更安全）
5. 点击 "Create repository"

#### 1.7 推送到GitHub

```bash
git remote add origin https://github.com/yourusername/yuanqi-api-backend.git
git branch -M main
git push -u origin main
```

---

### 仓库2：前端静态文件

#### 2.1 创建本地目录

```bash
# Windows PowerShell
mkdir yuanqi-api-frontend
cd yuanqi-api-frontend

# Mac/Linux Terminal
mkdir yuanqi-api-frontend
cd yuanqi-api-frontend
```

#### 2.2 复制前端文件

将以下文件从当前目录复制到 `yuanqi-api-frontend` 目录：
- health_assessment_final_fixed.html
- health_assessment_backend_complete.html
- frontend-api-integration.js
- admin-api-integration.js
- 元炁源流横版金色.png
- 元炁源流横版黑红色.png
- 元炁源流竖版金色.png
- 元炁源流竖版黑红色.png

#### 2.3 创建README.md文件

创建 `README.md` 文件：
```markdown
# 元炁源流健康评估系统 - 前端界面

## 使用说明

### 评估页面
访问：`health_assessment_final_fixed.html`

### 管理后台
访问：`health_assessment_backend_complete.html`

## 配置

在部署前，请修改以下文件中的API地址：

- `frontend-api-integration.js`: 修改 `API_CONFIG.baseURL`
- `admin-api-integration.js`: 修改 `AdminAPIConfig.baseURL`

## 默认管理员账号

- 用户名: admin
- 密码: admin123

部署后请立即修改密码！
```

#### 2.4 创建.gitignore文件

创建 `.gitignore` 文件：
```
.DS_Store
Thumbs.db
```

#### 2.5 初始化Git仓库

```bash
git init
git add .
git commit -m "Initial commit: Frontend interface for Yuanqi Health Assessment"
```

#### 2.6 在GitHub创建仓库

1. 访问：https://github.com/new
2. Repository name: `yuanqi-api-frontend`
3. Description: `元炁源流健康评估系统 - 前端界面`
4. 勾选 "Private"
5. 点击 "Create repository"

#### 2.7 推送到GitHub

```bash
git remote add origin https://github.com/yourusername/yuanqi-api-frontend.git
git branch -M main
git push -u origin main
```

---

## ⚙️ 配置修改指南

### 修改前端API地址

在上传到GitHub之前，需要修改前端配置文件。

#### 修改 frontend-api-integration.js

打开文件，找到第16行左右：

```javascript
// 修改前
const API_CONFIG = {
    baseURL: 'http://localhost:3000',  // ← 改这里
    // ...
};
```

**暂时先不改**，部署到Zeabur后会自动生成域名，到时候再修改。

#### 修改 admin-api-integration.js

同样找到第16行左右：

```javascript
// 修改前
const AdminAPIConfig = {
    baseURL: 'http://localhost:3000',  // ← 改这里
    // ...
};
```

**暂时先不改**，等Zeabur生成域名后再修改。

---

## 📋 Zeabur部署检查清单

在Zeabur部署之前，确认以下所有项目：

### GitHub仓库准备

- [ ] 后端仓库 `yuanqi-api-backend` 已创建
- [ ] 后端仓库包含所有必需文件
- [ ] 后端仓库已推送到GitHub
- [ ] 前端仓库 `yuanqi-api-frontend` 已创建
- [ ] 前端仓库包含所有必需文件
- [ ] 前端仓库已推送到GitHub

### Zeabur账户准备

- [ ] 已注册Zeabur账户
- [ ] 已登录Zeabur控制台
- [ ] 已创建项目 `yuanqi-health-assessment`
- [ ] 已选择部署区域（推荐Hong Kong或Singapore）

### 部署前准备

- [ ] 阅读完 `Zeabur部署教程.md`
- [ ] 理解部署流程
- [ ] 准备好2-3小时时间用于部署和测试

---

## 🎯 Zeabur部署流程（简化版）

### 第一阶段：在Zeabur创建服务（15分钟）

1. **创建MySQL服务**
   - Add Service → Marketplace → MySQL
   - 选择Free Plan
   - 等待部署完成
   - 保存数据库连接信息

2. **创建后端API服务**
   - Add Service → Git Service
   - 选择 `yuanqi-api-backend` 仓库
   - 等待部署完成
   - 配置环境变量
   - 关联MySQL服务

3. **创建前端服务**
   - Add Service → Git Service
   - 选择 `yuanqi-api-frontend` 仓库
   - 等待部署完成

### 第二阶段：配置环境变量（10分钟）

#### 后端服务环境变量

在Zeabur后端服务的"Variables"中添加：

```
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
```

MySQL变量会自动关联：
- `MYSQL_HOST`（Link to MySQL Service）
- `MYSQL_PORT`（Link to MySQL Service）
- `MYSQL_USERNAME`（Link to MySQL Service）
- `MYSQL_PASSWORD`（Link to MySQL Service）
- `MYSQL_DATABASE`（Link to MySQL Service）

### 第三阶段：初始化数据库（5分钟）

1. 在Zeabur控制台，点击后端服务
2. 查看日志（Logs标签页）
3. 如果有自动初始化代码，等待初始化完成
4. 如果没有，手动执行：
   - 在本地连接到Zeabur MySQL
   - 导入 `database_schema.sql`
   - 执行 `node data_migration.js`

### 第四阶段：修改前端配置（5分钟）

1. 获取后端服务的Zeabur域名
2. 修改 `frontend-api-integration.js` 中的 `API_CONFIG.baseURL`
3. 修改 `admin-api-integration.js` 中的 `AdminAPIConfig.baseURL`
4. 重新推送到GitHub
5. Zeabur会自动重新部署前端

### 第五阶段：测试部署（10分钟）

1. 测试后端API
2. 访问前端评估页面
3. 访问管理后台
4. 测试完整流程
5. 生成PDF报告

---

## 🔍 验证清单

部署完成后，验证以下功能：

### 后端API

- [ ] 访问 `https://your-backend.zeabur.app/api/stats` 返回JSON数据
- [ ] 访问 `https://your-backend.zeabur.app/api/symptoms` 返回症状列表
- [ ] 日志中没有错误信息

### 前端评估页面

- [ ] 可以访问评估页面
- [ ] 症状列表正常加载
- [ ] 可以选择症状
- [ ] 可以提交评估

### 管理后台

- [ ] 可以访问管理后台
- [ ] 可以登录（admin/admin123）
- [ ] 可以查看评估列表
- [ ] 可以生成PDF报告

### 数据库

- [ ] 症状库包含299个症状
- [ ] 提交的评估数据已保存
- [ ] 分析结果已生成

---

## 📞 需要帮助？

如果部署过程中遇到问题，请提供：

1. **您执行到哪一步**
2. **具体的错误信息**（从Zeabur Logs复制）
3. **截图**（如果可能）

我会帮您解决问题！

---

## 💡 下一步

部署成功后，您可以考虑：

1. **配置自定义域名**
   - 购买域名
   - 在Zeabur配置自定义域名
   - 修改前端配置

2. **优化性能**
   - 启用缓存
   - 优化数据库查询
   - 压缩静态资源

3. **增强安全性**
   - 启用HTTPS（Zeabur自动配置）
   - 修改默认密码
   - 设置访问限制

4. **监控和维护**
   - 配置日志监控
   - 设置告警
   - 定期备份数据库

---

**准备好了吗？开始部署吧！🚀**
