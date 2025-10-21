@echo off
echo ========================================
echo 雲水基材管理系統 - 安全啟動後端
echo ========================================
echo.

cd /d "%~dp0backend"

echo 檢查3004端口是否被占用...
netstat -an | findstr :3004 | findstr LISTENING >nul

if %errorlevel% == 0 (
    echo ⚠️  警告：3004端口已被占用！
    echo.
    echo 正在嘗試清除占用的進程...
    
    REM 查找并終止占用3004端口的進程
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
        echo 終止進程 PID: %%a
        taskkill /f /pid %%a >nul 2>&1
    )
    
    echo 等待2秒讓端口釋放...
    timeout /t 2 /nobreak >nul
    echo.
)

echo ✅ 3004端口可用，正在啟動後端服務器...
echo.
echo 提示：按 Ctrl+C 可以停止服務器
echo ========================================
echo.

npm run dev