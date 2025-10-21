@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🛑 雲水基材管理系統 - 停止服務
echo ================================
echo.

:: 停止占用端口 3004 的進程（後端）
echo 🔧 停止後端服務 (端口 3004)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3004" 2^>nul') do (
    if "%%a" neq "" (
        echo 終止進程 PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: 停止占用端口 3000 的進程（前端）
echo 🎨 停止前端服務 (端口 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do (
    if "%%a" neq "" (
        echo 終止進程 PID: %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

:: 停止可能的 Node.js 進程
echo 🔍 清理 Node.js 進程...
tasklist | findstr "node.exe" >nul
if not errorlevel 1 (
    echo 發現 Node.js 進程，正在清理...
    taskkill /IM node.exe /F >nul 2>&1
)

:: 等待進程完全停止
echo ⏳ 等待服務完全停止...
timeout /t 3 /nobreak >nul

:: 驗證端口是否已釋放
echo 🔍 驗證端口狀態...
netstat -an | findstr ":3004" >nul
if errorlevel 1 (
    echo ✅ 端口 3004 已釋放
) else (
    echo ⚠️  端口 3004 仍被占用
)

netstat -an | findstr ":3000" >nul
if errorlevel 1 (
    echo ✅ 端口 3000 已釋放
) else (
    echo ⚠️  端口 3000 仍被占用
)

echo.
echo ================================
echo ✅ 雲水基材管理系統已停止
echo ================================
echo.
echo 💡 如需重新啟動，請運行: start-system-fixed.bat
echo.
pause