@echo off
title AI配置服务启动器
cd /d "%~dp0"

echo 🤖 AI配置服务启动器
echo ====================================
echo.

echo 检查Ollama服务状态...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama服务未运行
    echo.
    echo 请在另一个终端运行以下命令启动Ollama:
    echo   ollama serve
    echo.
    echo 然后下载模型 (如果还没有):
    echo   ollama pull qwen3
    echo   ollama pull gemma3
    echo.
    echo 按任意键继续启动Web服务...
    pause >nul
) else (
    echo ✅ Ollama服务正在运行
    echo.
)

echo 🌐 启动Web服务...
echo 📊 AI配置页面: http://localhost:8000/ai
echo 📚 完整管理界面: http://localhost:8000
echo.
echo 按 Ctrl+C 停止服务
echo.

python server.py

pause