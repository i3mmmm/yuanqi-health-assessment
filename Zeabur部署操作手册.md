# Zeabur部署操作手册 - 逐步执行指南

## 📖 使用说明

本文档将引导您完成在Zeabur上部署元炁源流健康评估系统的全过程。
请严格按照顺序执行每一步。

---

## 📋 准备工作（预计5分钟）

### ✅ 检查清单

在开始之前，确认您已准备好：

- [ ] 已注册GitHub账户（如果还没有，访问 https://github.com 注册）
- [ ] 已注册Zeabur账户（访问 https://zeabur.com/ 注册）
- [ ] 已准备好2-3小时的完整部署时间
- [ ] 已准备好本地电脑上的所有项目文件

---

## 🚀 第一部分：准备GitHub仓库（预计20分钟）

### 步骤1：创建后端API仓库

#### 1.1 创建本地文件夹

**Windows用户：**
```
1. 打开文件资源管理器
2. 导航到您存放项目文件的位置
3. 新建文件夹：yuanqi-backend
```

**Mac/Linux用户：**
```bash
mkdir -p ~/Documents/yuanqi-backend
cd ~/Documents/yuanqi-backend
```

#### 1.2 复制后端文件

将以下文件从当前项目文件夹复制到 `yuanqi-backend` 文件夹：

**必需文件（7个）：**
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

**操作方法：**
- Windows：选择以上文件 → 右键复制 → 粘贴到 yuanqi-backend 文件夹
- Mac/Linux：在终端执行 `cp backend-api-server.js ~/Documents/yuanqi-backend/` 等

#### 1.3 创建.gitignore文件

在 `yuanqi-backend` 文件夹中创建一个名为 `.gitignore` 的文件：

**Windows：**
1. 打开记事本
2. 粘贴以下内容：
```
node_modules/
.env
logs/
reports/
*.log
.DS_Store
Thumbs.db
```
3. 保存为 `.gitignore`（注意前面有个点）

**Mac/Linux：**
```bash
cd ~/Documents/yuanqi-backend
cat > .gitignore << 'EOF'
node_modules/
.env
logs/
reports/
*.log
.DS_Store
Thumbs.db
EOF
```

#### 1.4 创建.env文件

在 `yuanqi-backend` 文件夹中创建一个名为 `.env` 的文件：

**内容：**
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_at_least_32_characters_long_change_this_in_zeabur
JWT_EXPIRES_IN=7d
```

#### 1.5 初始化Git仓库

**Windows（使用Git Bash或PowerShell）：**
```bash
cd ~/Documents/yuanqi-backend
git init
git add .
git commit -m "Initial commit: Backend API for Yuanqi Health Assessment"
```

**Mac/Linux（使用Terminal）：**
```bash
cd ~/Documents/yuanqi-backend
git init
git add .
git commit -m "Initial commit: Backend API for Yuanqi Health Assessment"
```

#### 1.6 在GitHub创建仓库

1. 访问：https://github.com/new
2. 填写：
   - **Repository name**: `yuanqi-backend`
   - **Description**: 元炁源流健康评估系统 - 后端API服务
   - **Public/Private**: 选择 Private（私有更安全）
   - **不要**勾选 "Initialize this repository with a README"
3. 点击 **"Create repository"**

#### 1.7 推送代码到GitHub

在终端/Git Bash中执行：

```bash
# 添加远程仓库（替换 yourusername 为您的GitHub用户名）
git remote add origin https://github.com/yourusername/yuanqi-backend.git

# 推送代码
git branch -M main
git push -u origin main
```

**如果提示输入用户名和密码：**
- 用户名：输入您的GitHub用户名
- 密码：输入您的Personal Access Token（不是GitHub密码）
  - 获取Token：https://github.com/settings/tokens
  - 点击 "Generate new token (classic)"
  - 勾选 "repo"
  - 点击 "Generate token"
  - 复制生成的token

---

### 步骤2：创建前端静态文件仓库

#### 2.1 创建本地文件夹

**Windows用户：**
```
1. 打开文件资源管理器
2. 新建文件夹：yuanqi-frontend
```

**Mac/Linux用户：**
```bash
mkdir -p ~/Documents/yuanqi-frontend
cd ~/Documents/yuanqi-frontend
```

#### 2.2 复制前端文件

将以下文件从当前项目文件夹复制到 `yuanqi-frontend` 文件夹：

**HTML文件（2个）：**
```
✓ health_assessment_final_fixed.html
✓ health_assessment_backend_complete.html
```

**JavaScript文件（2个）：**
```
✓ frontend-api-integration.js
✓ admin-api-integration.js
```

**品牌图片（4个）：**
```
✓ 元炁源流横版金色.png
✓ 元炁源流横版黑红色.png
✓ 元炁源流竖版金色.png
✓ 元炁源流竖版黑红色.png
```

#### 2.3 创建.gitignore文件

在 `yuanqi-frontend` 文件夹中创建 `.gitignore` 文件：

```
.DS_Store
Thumbs.db
*.tmp
```

#### 2.4 初始化Git仓库

**Windows/Mac/Linux：**
```bash
cd ~/Documents/yuanqi-frontend
git init
git add .
git commit -m "Initial commit: Frontend interface for Yuanqi Health Assessment"
```

#### 2.5 在GitHub创建仓库

1. 访问：https://github.com/new
2. 填写：
   - **Repository name**: `yuanqi-frontend`
   - **Description**: 元炁源流健康评估系统 - 前端界面
   - **Public/Private**: 选择 Private
3. 点击 **"Create repository"**

#### 2.6 推送代码到GitHub

```bash
# 添加远程仓库
git remote add origin https://github.com/yourusername/yuanqi-frontend.git

# 推送代码
git branch -M main
git push -u origin main
```

---

## 🌟 第二部分：在Zeabur部署MySQL服务（预计5分钟）

### 步骤3：登录Zeabur

1. 访问：https://dash.zeabur.com/
2. 登录您的Zeabur账户
3. 如果是首次登录，可能需要授权GitHub访问

### 步骤4：创建项目

1. 点击右上角 **"New Project"** 按钮
2. 项目名称输入：`yuanqi-health-assessment`
3. 选择区域：
   - 推荐：**Hong Kong**（香港）- 访问速度快
   - 备选：**Singapore**（新加坡）
4. 选择计划：**Free Plan**（免费计划）
5. 点击 **"Create"**

### 步骤5：添加MySQL服务

1. 在项目页面，点击 **"+ Service"** 按钮
2. 选择 **"Marketplace"**
3. 搜索框输入：`MySQL`
4. 点击 **"MySQL"** 图标
5. 配置：
   - **Version**: 选择 `8.0`
   - **Plan**: 选择 **Free**（免费）
6. 点击 **"Deploy"**

### 步骤6：等待MySQL部署完成

1. 等待2-3分钟
2. 当MySQL卡片显示绿色对勾✓时，表示部署完成
3. 点击MySQL服务卡片进入详情页

### 步骤7：保存MySQL连接信息

1. 在MySQL服务详情页，点击 **"Variables"** 标签
2. 复制并保存以下信息到记事本：

```
📝 MySQL连接信息（请保存）：
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MYSQL_HOST: [查看这里]
MYSQL_PORT: [查看这里，通常是3306]
MYSQL_USERNAME: [查看这里]
MYSQL_PASSWORD: [查看这里，点击眼睛图标显示]
MYSQL_DATABASE: [查看这里，通常是zeabur_db]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 第三部分：在Zeabur部署后端API服务（预计15分钟）

### 步骤8：添加后端API服务

1. 回到项目页面（点击项目名称面包屑）
2. 点击 **"+ Service"** 按钮
3. 选择 **"Git"**（Git图标）
4. 如果首次使用，需要授权Zeabur访问GitHub
   - 点击 **"Authorize with GitHub"**
   - 选择刚才创建的仓库：`yourusername/yuanqi-backend`
   - 点击 **"Install & Authorize"**

### 步骤9：配置后端服务

1. 选择仓库：`yuanqi-backend`
2. 选择分支：`main`
3. 点击 **"Import"** 或 **"Deploy"**
4. 等待部署（约3-5分钟）

### 步骤10：配置环境变量

1. 部署完成后，点击后端服务卡片进入详情页
2. 点击 **"Variables"** 标签
3. 点击 **"+ Add Variable"** 按钮，逐个添加：

#### 10.1 添加必需变量

**变量1：PORT**
- Name: `PORT`
- Value: `3000`
- 点击 "Add Variable"

**变量2：NODE_ENV**
- Name: `NODE_ENV`
- Value: `production`
- 点击 "Add Variable"

**变量3：JWT_SECRET**
- Name: `JWT_SECRET`
- Value: `your_jwt_secret_key_at_least_32_characters_long_please_change_this`
- 点击 "Add Variable"
- **⚠️ 重要：请修改为至少32位的随机字符串**

**变量4：JWT_EXPIRES_IN**
- Name: `JWT_EXPIRES_IN`
- Value: `7d`
- 点击 "Add Variable"

#### 10.2 关联MySQL服务

**变量5：MYSQL_HOST**
- Name: `MYSQL_HOST`
- Value: 点击 **"Link to Service"** → 选择 **MySQL** 服务
- 点击 "Add Variable"

**变量6：MYSQL_PORT**
- Name: `MYSQL_PORT`
- Value: 点击 **"Link to Service"** → 选择 **MySQL** 服务
- 点击 "Add Variable"

**变量7：MYSQL_USERNAME**
- Name: `MYSQL_USERNAME`
- Value: 点击 **"Link to Service"** → 选择 **MySQL** 服务
- 点击 "Add Variable"

**变量8：MYSQL_PASSWORD**
- Name: `MYSQL_PASSWORD`
- Value: 点击 **"Link to Service"** → 选择 **MySQL** 服务
- 点击 "Add Variable"

**变量9：MYSQL_DATABASE**
- Name: `MYSQL_DATABASE`
- Value: 点击 **"Link to Service"** → 选择 **MySQL** 服务
- 点击 "Add Variable"

### 步骤11：重启后端服务

1. 点击后端服务详情页的 **"Restart"** 按钮
2. 等待服务重启完成（约1-2分钟）

### 步骤12：初始化数据库

#### 方法1：使用Zeabur的日志自动初始化（推荐）

1. 点击 **"Logs"** 标签
2. 查看日志输出
3. 如果看到 "数据库初始化完成" 的消息，说明自动初始化成功
4. 如果没有，继续下一步

#### 方法2：手动初始化（如果方法1失败）

1. 在本地电脑打开终端
2. 连接到Zeabur MySQL数据库：

```bash
# 替换以下信息为实际值
mysql -h MYSQL_HOST值 -P 3306 -u MYSQL_USERNAME值 -p
# 输入 MYSQL_PASSWORD值
```

3. 连接成功后，在本地打开 `database_schema.sql` 文件
4. 复制文件内容并粘贴到MySQL命令行
5. 执行：

```bash
# 退出MySQL
exit
```

6. 连接到Zeabur后端服务（使用Zeabur的Terminal，如果有的话）：
```bash
node data_migration.js
```

### 步骤13：获取后端API域名

1. 在后端服务详情页，点击 **"Domains"** 标签
2. 复制自动生成的域名，例如：
   ```
   https://yuanqi-backend-xxxxx.zeabur.app
   ```
   或者
   ```
   https://931.zeabur.app  (如果使用您的指定域名)
   ```
3. **⚠️ 重要：请保存这个域名，后面配置前端时需要用到**

---

## 🎨 第四部分：在Zeabur部署前端服务（预计10分钟）

### 步骤14：添加前端服务

1. 回到项目页面
2. 点击 **"+ Service"** 按钮
3. 选择 **"Git"**
4. 选择仓库：`yourusername/yuanqi-frontend`
5. 选择分支：`main`
6. 点击 **"Import"** 或 **"Deploy"**
7. 等待部署（约2-3分钟）

### 步骤15：获取前端服务域名

1. 部署完成后，点击前端服务卡片进入详情页
2. 点击 **"Domains"** 标签
3. 复制自动生成的域名，例如：
   ```
   https://yuanqi-frontend-xxxxx.zeabur.app
   ```

---

## ⚙️ 第五部分：配置前端API地址（预计5分钟）

### 步骤16：修改前端配置文件

在本地电脑上，打开 `yuanqi-frontend` 文件夹。

#### 16.1 修改 frontend-api-integration.js

1. 用文本编辑器打开 `frontend-api-integration.js`
2. 找到第16行左右：
```javascript
const API_CONFIG = {
    baseURL: 'http://localhost:3000',  // ← 修改这里
    // ...
};
```

3. 修改为您的后端Zeabur域名：
```javascript
const API_CONFIG = {
    baseURL: 'https://yuanqi-backend-xxxxx.zeabur.app',  // 改为实际域名
    // ...
};
```

**或者使用您指定的域名：**
```javascript
const API_CONFIG = {
    baseURL: 'https://931.zeabur.app',  // 如果Zeabur生成了这个域名
    // ...
};
```

4. 保存文件

#### 16.2 修改 admin-api-integration.js

1. 用文本编辑器打开 `admin-api-integration.js`
2. 找到第16行左右：
```javascript
const AdminAPIConfig = {
    baseURL: 'http://localhost:3000',  // ← 修改这里
    // ...
};
```

3. 修改为：
```javascript
const AdminAPIConfig = {
    baseURL: 'https://yuanqi-backend-xxxxx.zeabur.app',  // 改为实际域名
    // ...
};
```

4. 保存文件

### 步骤17：重新推送代码到GitHub

在本地电脑的终端中执行：

```bash
cd ~/Documents/yuanqi-frontend
git add .
git commit -m "Update API URL to Zeabur backend"
git push
```

### 步骤18：等待Zeabur自动重新部署

1. 返回Zeabur前端服务页面
2. Zeabur会自动检测到新的提交并重新部署
3. 等待2-3分钟，直到看到绿色对勾✓

---

## ✅ 第六部分：测试部署（预计10分钟）

### 步骤19：测试后端API

#### 19.1 测试API端点

1. 在浏览器中访问：
   ```
   https://yuanqi-backend-xxxxx.zeabur.app/api/stats
   ```

2. 应该返回类似这样的JSON数据：
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

3. 如果返回数据，说明后端API工作正常✓
4. 如果返回错误，查看Zeabur后端服务的日志

#### 19.2 查看日志

如果测试失败：
1. 在Zeabur后端服务页面
2. 点击 **"Logs"** 标签
3. 查看错误信息
4. 根据错误信息排查问题

### 步骤20：测试前端评估页面

1. 在浏览器中访问：
   ```
   https://yuanqi-frontend-xxxxx.zeabur.app/health_assessment_final_fixed.html
   ```

2. 检查：
   - [ ] 页面正常加载
   - [ ] 症状列表显示
   - [ ] 表单可以填写
   - [ ] 可以选择症状

3. 提交一个测试评估：
   - 填写基本信息
   - 选择几个症状
   - 点击"提交评估"
   - 查看是否提交成功

### 步骤21：测试管理后台

1. 在浏览器中访问：
   ```
   https://yuanqi-frontend-xxxxx.zeabur.app/health_assessment_backend_complete.html
   ```

2. 使用默认账号登录：
   - 用户名：`admin`
   - 密码：`admin123`

3. 检查功能：
   - [ ] 可以成功登录
   - [ ] 可以看到评估列表
   - [ ] 可以查看评估详情
   - [ ] 可以生成PDF报告

---

## 🎉 第七部分：部署完成总结

### 访问地址汇总

#### 评估页面
```
https://yuanqi-frontend-xxxxx.zeabur.app/health_assessment_final_fixed.html
```

#### 管理后台
```
https://yuanqi-frontend-xxxxx.zeabur.app/health_assessment_backend_complete.html
```

#### 后端API
```
https://yuanqi-backend-xxxxx.zeabur.app/
```

#### API端点示例
```
GET  /api/stats                          # 统计数据
GET  /api/symptoms                       # 症状列表
POST /api/assessments                    # 提交评估
GET  /api/assessments                    # 评估列表
GET  /api/assessments/:id                # 评估详情
POST /api/reports/generate/:id            # 生成报告
POST /api/auth/login                     # 用户登录
```

### 默认管理员账号
```
用户名：admin
密码：admin123
⚠️ 请登录后立即修改密码！
```

---

## 🔧 常见问题排查

### 问题1：后端服务启动失败

**症状：** Zeabur后端服务显示错误或一直在重启

**解决方法：**
1. 查看 **"Logs"** 标签
2. 常见错误：
   - `PORT already in use`：端口冲突，检查PORT变量
   - `Database connection failed`：检查MySQL连接信息
   - `Module not found`：检查package.json中的依赖是否正确

### 问题2：前端无法连接后端

**症状：** 前端页面报错，提示"Network Error"

**解决方法：**
1. 检查 `frontend-api-integration.js` 和 `admin-api-integration.js` 中的 `baseURL` 是否正确
2. 确保使用 `https://` 而不是 `http://`
3. 确保后端服务正在运行
4. 打开浏览器开发者工具（F12），查看Console和Network标签页的错误信息

### 问题3：数据库连接失败

**症状：** 后端日志显示 "Error connecting to database"

**解决方法：**
1. 检查后端服务的环境变量是否正确关联到MySQL服务
2. 在Zeabur后端服务的 **"Variables"** 标签中，确认：
   - `MYSQL_HOST` 是否链接到MySQL服务
   - `MYSQL_USERNAME` 和 `MYSQL_PASSWORD` 是否正确
3. 重启后端服务

### 问题4：PDF生成失败

**症状：** 生成报告时提示错误

**解决方法：**
1. 检查 `html-pdf` 依赖是否正确安装
2. 查看后端服务的日志
3. 如果是Zeabur免费方案，内存限制可能导致PDF生成失败，考虑升级计划

---

## 📞 需要帮助？

如果按照本手册操作后仍遇到问题，请提供：

1. **您执行到哪一步**（例如：步骤12）
2. **具体的错误信息**（从Zeabur Logs复制）
3. **截图**（如果可能）

我会帮您解决问题！

---

## 🎊 恭喜！

您已成功在Zeabur上部署了元炁源流健康评估系统！

### 下一步建议：

1. **修改默认密码**
   - 登录管理后台
   - 修改admin密码

2. **配置自定义域名**（可选）
   - 购买域名
   - 在Zeabur配置自定义域名
   - 修改前端配置

3. **优化和定制**
   - 根据需要修改界面样式
   - 添加更多功能
   - 优化用户体验

祝您使用愉快！🚀
