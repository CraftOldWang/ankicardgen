@echo off
echo 正在启动Anki卡片生成器...

REM 检查Node.js是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    echo 您可以从 https://nodejs.org/ 下载并安装
    pause
    exit /b
)

REM 检查是否需要安装依赖
if not exist node_modules (
    echo 首次运行，正在安装依赖...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo 安装依赖失败，请检查网络连接或手动运行 npm install
        pause
        exit /b
    )
)

REM 启动应用
echo 启动开发服务器...
call npm run dev

pause