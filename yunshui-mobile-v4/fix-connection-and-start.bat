@echo off
chcp 65001 > nul
title 修復連接並啟動手機應用

echo.
echo 🔧 修復手機應用連接問題
echo.

REM 檢查是否在正確目錄
if not exist "App.tsx" (
    echo ❌ 錯誤: 請在 yunshui-mobile-v4 目錄中執行此腳本
    pause
    exit /b 1
)

echo 📋 1. 檢查新的後端連接 (192.168.68.103:3000)...
curl -s http://192.168.68.103:3000/health > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 後端服務器未運行在 192.168.68.103:3000
    echo 💡 請確保後端正在運行: cd backend && npm run dev
    echo.
    set /p choice="是否繼續啟動手機應用? (y/n): "
    if /i not "%choice%"=="y" exit /b 1
) else (
    echo ✅ 後端連接正常 (192.168.68.103:3000)
)

echo.
echo 📋 2. 清理緩存和重置...
if exist ".expo" (
    echo 🧹 清理 .expo 緩存...
    rmdir /s /q .expo
)

if exist "node_modules\.cache" (
    echo 🧹 清理 node_modules 緩存...
    rmdir /s /q "node_modules\.cache"
)

echo.
echo 📋 3. 檢查依賴...
if not exist "node_modules" (
    echo 📦 安裝依賴...
    npm install
)

echo.
echo 📋 4. 修復網路配置...
echo 💡 API已更新為: http://192.168.68.103:3000/api
echo 💡 確保手機和電腦在同一WiFi網路

echo.
echo 🚀 5. 啟動應用 (使用隧道模式解決連接問題)...
echo.
echo 📱 手機操作步驟:
echo 1. 確保手機和電腦在同一WiFi
echo 2. 在Expo Go中掃描新的QR碼
echo 3. 如果仍有連接問題，嘗試重啟Expo Go應用
echo.

REM 使用隧道模式啟動，解決Metro連接問題
npx expo start --tunnel --clear

echo.
echo 👋 應用已關閉
pause