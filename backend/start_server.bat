@echo off
title 浏览器历史记录管理系统
cd /d "%~dp0"

echo 🚀 启动浏览器历史记录管理系统
echo.
echo 正在检查Python环境...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python未安装或未添加到PATH
    echo 请先安装Python 3.7+
    pause
    exit /b 1
)

echo ✅ Python环境正常

echo.
echo 正在检查依赖包...
pip show fastapi >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 正在安装依赖包...
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ❌ 依赖包安装失败
        pause
        exit /b 1
    )
)

echo ✅ 依赖包检查完成

echo.
echo 🌐 启动Web服务...
echo 📊 Web管理界面: http://localhost:8000
echo 📚 API文档: http://localhost:8000/docs
echo.
echo 按 Ctrl+C 停止服务
echo.

python server.py

pause