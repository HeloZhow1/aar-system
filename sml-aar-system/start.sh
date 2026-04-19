#!/bin/bash
# ============================================
# SML & AAR 智能管理系统 - 一键启动 (macOS/Linux)
# ============================================
set -e

echo "🔍 检查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先访问 https://nodejs.org/ 安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低 ($(node -v))，请升级到 18 或更高版本"
    exit 1
fi
echo "✓ Node.js $(node -v)"

if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 首次运行，安装依赖（约 1-3 分钟）..."
    npm install
fi

if [ ! -f "prisma/dev.db" ]; then
    echo ""
    echo "🗄️  初始化数据库..."
    npm run db:init
fi

echo ""
echo "🚀 启动开发服务器..."
echo "   访问地址: http://localhost:3000"
echo ""
npm run dev
