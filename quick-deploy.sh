#!/bin/bash

################################################################################
# 元炁源流健康评估系统 - 快速部署脚本
# 适用于：Ubuntu 20.04+ / Debian 10+
################################################################################

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

################################################################################
# 步骤1：输入配置
################################################################################
print_header "步骤 1/10：输入配置信息"

read -p "请输入域名 (例如: example.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}域名不能为空${NC}"
    exit 1
fi

read -sp "请输入MySQL root密码: " MYSQL_ROOT_PASS
echo ""

MYSQL_PASS=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -hex 32)

print_success "配置信息已设置"
print_info "域名: $DOMAIN"
print_info "MySQL用户密码已自动生成"

################################################################################
# 步骤2：更新系统
################################################################################
print_header "步骤 2/10：更新系统"
apt update && apt upgrade -y
print_success "系统更新完成"

################################################################################
# 步骤3：安装基础软件
################################################################################
print_header "步骤 3/10：安装基础软件"

# 安装Node.js 18
print_info "安装Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 安装MySQL
print_info "安装MySQL..."
export DEBIAN_FRONTEND=noninteractive
apt install -y mysql-server
systemctl start mysql
systemctl enable mysql

# 安装Nginx
print_info "安装Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 安装PM2
print_info "安装PM2..."
npm install -g pm2

# 安装其他工具
apt install -y git curl wget certbot python3-certbot-nginx

print_success "基础软件安装完成"

################################################################################
# 步骤4：创建项目目录
################################################################################
print_header "步骤 4/10：创建项目目录"

mkdir -p /var/www/yuanqi-api
mkdir -p /var/www/yuanqi-api/reports
mkdir -p /var/www/yuanqi-api/logs
mkdir -p /var/www/yuanqi-frontend

print_success "项目目录创建完成"

################################################################################
# 步骤5：提示上传文件
################################################################################
print_header "步骤 5/10：上传项目文件"

echo ""
echo "请上传以下文件到服务器的对应目录："
echo ""
echo "${YELLOW}后端文件 → /var/www/yuanqi-api/${NC}"
echo "  • backend-api-server.js"
echo "  • database_schema.sql"
echo "  • data_migration.js"
echo ""
echo "${YELLOW}前端文件 → /var/www/yuanqi-frontend/${NC}"
echo "  • health_assessment_final_fixed.html"
echo "  • health_assessment_backend_complete.html"
echo "  • frontend-api-integration.js"
echo "  • admin-api-integration.js"
echo ""
echo "${YELLOW}数据文件 → /var/www/yuanqi-api/${NC}"
echo "  • symptoms_299_complete.json"
echo "  • first_assessment_20251213.json"
echo "  • second_assessment_20260113.json"
echo "  • sample_assessment_data.json"
echo ""
echo "上传方式："
echo "  1. 使用SCP命令:"
echo "     scp backend-api-server.js root@您的服务器IP:/var/www/yuanqi-api/"
echo ""
echo "  2. 使用SFTP工具（FileZilla、WinSCP）"
echo ""

read -p "文件已上传完成? (y/n): " uploaded
if [[ "$uploaded" != "y" && "$uploaded" != "Y" ]]; then
    print_warning "请上传文件后重新运行脚本"
    exit 0
fi

print_success "文件上传确认完成"

################################################################################
# 步骤6：安装Node.js依赖
################################################################################
print_header "步骤 6/10：安装Node.js依赖"

cd /var/www/yuanqi-api

# 创建package.json
cat > package.json << 'EOF'
{
  "name": "yuanqi-health-assessment-api",
  "version": "1.0.0",
  "main": "backend-api-server.js",
  "scripts": {
    "start": "node backend-api-server.js"
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
  }
}
EOF

npm install --production

print_success "依赖安装完成"

################################################################################
# 步骤7：配置环境变量
################################################################################
print_header "步骤 7/10：配置环境变量"

cat > .env << EOF
PORT=3000
NODE_ENV=production
DB_HOST=localhost
DB_USER=yuanqi_user
DB_PASSWORD=$MYSQL_PASS
DB_NAME=yuanqi_health_db
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
PDF_STORAGE_PATH=./reports
LOG_LEVEL=info
LOG_FILE=./logs/app.log
EOF

chmod 600 .env

print_success "环境变量配置完成"

################################################################################
# 步骤8：初始化数据库
################################################################################
print_header "步骤 8/10：初始化数据库"

# 配置MySQL root密码
mysql -u root << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASS';
FLUSH PRIVILEGES;
EOF

# 创建数据库和用户
mysql -u root -p"$MYSQL_ROOT_PASS" << EOF
CREATE DATABASE IF NOT EXISTS yuanqi_health_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'yuanqi_user'@'localhost' IDENTIFIED BY '$MYSQL_PASS';
GRANT ALL PRIVILEGES ON yuanqi_health_db.* TO 'yuanqi_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 导入数据库架构
mysql -u yuanqi_user -p"$MYSQL_PASS" yuanqi_health_db < database_schema.sql

# 执行数据迁移
node data_migration.js

print_success "数据库初始化完成"

################################################################################
# 步骤9：配置Nginx
################################################################################
print_header "步骤 9/10：配置Nginx"

cat > /etc/nginx/sites-available/yuanqi-api << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        root /var/www/yuanqi-frontend;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /reports/ {
        alias /var/www/yuanqi-api/reports/;
        autoindex off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/yuanqi-api /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

print_success "Nginx配置完成"

################################################################################
# 步骤10：启动服务
################################################################################
print_header "步骤 10/10：启动服务"

# 启动后端服务
pm2 start backend-api-server.js --name yuanqi-api
pm2 save
pm2 startup

# 配置防火墙
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

print_success "服务启动完成"

################################################################################
# 部署完成
################################################################################
print_header "部署完成！"

echo ""
print_info "重要信息："
echo ""
echo "MySQL root密码: $MYSQL_ROOT_PASS"
echo "MySQL用户密码: $MYSQL_PASS"
echo ""
echo "后端API地址: http://$DOMAIN/api/"
echo "前端评估页面: http://$DOMAIN/health_assessment_final_fixed.html"
echo "管理后台页面: http://$DOMAIN/health_assessment_backend_complete.html"
echo ""
echo "默认管理员账号："
echo "  用户名: admin"
echo "  密码: admin123"
echo "  ⚠ 请登录后立即修改密码！"
echo ""
print_warning "下一步：配置SSL证书（HTTPS）"
echo "执行命令: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
print_success "感谢使用元炁源流健康评估系统！"
