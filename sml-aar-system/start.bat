@echo off
REM ============================================
REM SML ^& AAR 智能管理系统 - 一键启动 (Windows)
REM ============================================

echo 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 未检测到 Node.js，请先访问 https://nodejs.org/ 安装 Node.js 18+
    pause
    exit /b 1
)

node -v

if not exist "node_modules" (
    echo.
    echo 首次运行，安装依赖（约 1-3 分钟）...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo 依赖安装失败
        pause
        exit /b 1
    )
)

if not exist "prisma\dev.db" (
    echo.
    echo 初始化数据库...
    call npm run db:init
)

echo.
echo 启动开发服务器...
echo 访问地址: http://localhost:3000
echo.
call npm run dev
pause
