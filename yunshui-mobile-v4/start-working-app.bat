@echo off
chcp 65001 > nul
title 雲水基材管理系統 - 手機版 (成功版本)

echo.
echo 🏗️ 雲水基材管理系統 - 手機版 (yunshui-mobile-v4)
echo ✅ 這是之前測試成功的版本
echo.

REM 檢查是否在正確目錄
if not exist "App.tsx" (
    echo ❌ 錯誤: 請在 yunshui-mobile-v4 目錄中執行此腳本
    echo 💡 請執行: cd yunshui-mobile-v4
    pause
    exit /b 1
)

echo 📋 檢查後端連接...
curl -s http://192.168.68.95:3004/api/materials > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 後端服務器未運行
    echo 💡 請先啟動後端: cd backend && node simple-server.js
    echo.
    set /p choice="是否繼續啟動手機應用? (y/n): "
    if /i not "%choice%"=="y" exit /b 1
) else (
    echo ✅ 後端連接正常
)

echo.
echo 📱 手機操作步驟:
echo 1. 安裝 Expo Go 應用
echo 2. 確保手機和電腦在同一WiFi
echo 3. 掃描QR碼或輸入URL
echo.

REM 檢查依賴
if not exist "node_modules" (
    echo 📦 安裝依賴中...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依賴安裝失敗
        pause
        exit /b 1
    )
)

echo 🚀 使用成功的啟動參數: --tunnel --clear
echo 💡 這是之前測試成功的配置
echo.

REM 使用成功的啟動參數
npx expo start --tunnel --clear

echo.
echo 👋 應用已關閉
pause