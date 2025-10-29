@echo off
chcp 65001 > nul
title 切換到簡化後端服務器

echo.
echo 🔄 切換到簡化後端服務器 (適用於手機應用)
echo.

echo 📋 1. 停止當前後端服務...
tasklist /FI "IMAGENAME eq node.exe" /FO TABLE | findstr node > nul
if %errorlevel% equ 0 (
    echo 發現 Node.js 進程，正在停止...
    taskkill /IM node.exe /F > nul 2>&1
    echo ✅ 已停止現有 Node.js 進程
) else (
    echo ℹ️ 沒有發現運行中的 Node.js 進程
)

echo.
echo 📋 2. 清理端口 3004...
netstat -ano | findstr :3004 > nul
if %errorlevel% equ 0 (
    echo 端口 3004 被占用，正在清理...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3004') do (
        taskkill /PID %%a /F > nul 2>&1
    )
    echo ✅ 端口 3004 已清理
) else (
    echo ℹ️ 端口 3004 未被占用
)

echo.
echo 📋 3. 啟動簡化服務器...
cd /d "%~dp0backend"
echo 當前目錄: %CD%

if not exist "simple-server.js" (
    echo ❌ 錯誤: 找不到 simple-server.js
    echo 請確保在正確的目錄中執行此腳本
    pause
    exit /b 1
)

echo 🚀 啟動簡化服務器 (包含手機應用所需的訂單數據)...
echo.
echo 📱 簡化服務器特點:
echo   - 包含測試訂單數據 (3個訂單)
echo   - 支援手機應用的API格式
echo   - 無需數據庫配置
echo   - 適合開發和測試
echo.
echo 🔗 API端點:
echo   - 登入: http://192.168.68.95:3004/api/auth/login
echo   - 訂單: http://192.168.68.95:3004/api/orders
echo   - 材料: http://192.168.68.95:3004/api/materials
echo.

node simple-server.js

echo.
echo 👋 簡化服務器已停止
pause