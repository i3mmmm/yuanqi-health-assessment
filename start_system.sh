#!/bin/bash

# 元炁源流健康评估系统 - 一键启动脚本

echo "🚀 正在启动元炁源流健康评估系统..."
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 启动简化版后端服务器
echo "📡 正在启动后端服务..."
node backend-server-simple.js &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 检查后端是否启动成功
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ 后端服务启动成功！"
    echo ""
    echo "📱 前端页面地址："
    echo "   file://$(pwd)/health_assessment_ultimate.html"
    echo ""
    echo "🌐 后端API地址："
    echo "   http://localhost:3000"
    echo ""
    echo "💡 提示：请在浏览器中打开前端页面即可开始使用"
    echo ""
    echo "按 Ctrl+C 停止服务"
    echo ""

    # 保持脚本运行
    wait $BACKEND_PID
else
    echo "❌ 后端服务启动失败"
    exit 1
fi
