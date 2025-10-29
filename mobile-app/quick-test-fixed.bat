@echo off
chcp 65001 > nul
title 雲水基材管理系統手機版測試

echo.
echo ==========================================
echo 🔧 雲水基材管理系統手機版 - 修復測試
echo ==========================================
echo.

echo 📋 步驟 1/5: 檢查後端API連接...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://192.168.68.95:3004/api/materials' -TimeoutSec 5; Write-Host '✅ 後端API連接正常' -ForegroundColor Green } catch { Write-Host '❌ 後端API無法連接' -ForegroundColor Red; Write-Host '💡 請確保後端服務器運行在 192.168.68.95:3004' -ForegroundColor Yellow; exit 1 }"
if %errorlevel% neq 0 (
    echo.
    echo 請按任意鍵退出...
    pause > nul
    exit /b 1
)

echo.
echo 📋 步驟 2/5: 檢查Expo CLI...
where npx > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js/npm 未安裝
    echo 💡 請先安裝 Node.js
    pause
    exit /b 1
) else (
    echo ✅ Node.js 環境正常
)

echo.
echo 📋 步驟 3/5: 檢查項目配置...
if not exist "app.json" (
    echo ❌ app.json 不存在
    pause
    exit /b 1
) else (
    echo ✅ app.json 配置正常
)

if not exist "App.tsx" (
    echo ❌ App.tsx 不存在
    pause
    exit /b 1
) else (
    echo ✅ App.tsx 文件正常
)

echo.
echo 📋 步驟 4/5: 準備依賴...
if not exist "node_modules" (
    echo 🔄 正在安裝依賴，請稍候...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ❌ 依賴安裝失敗
        pause
        exit /b 1
    )
    echo ✅ 依賴安裝完成
) else (
    echo ✅ 依賴已存在
)

echo.
echo 📋 步驟 5/5: 啟動應用...
echo.
echo ==========================================
echo 📱 手機端操作指南:
echo ==========================================
echo 1. 在手機上安裝 "Expo Go" 應用
echo 2. 確保手機和電腦連接同一WiFi網路
echo 3. 打開 Expo Go，掃描下方QR碼
echo 4. 或者手動輸入顯示的URL
echo.
echo 🔗 如果連接失敗，請嘗試:
echo    - 檢查防火牆設置
echo    - 使用隧道模式: Ctrl+C 停止後執行 npx expo start --tunnel
echo.
echo ==========================================
echo 🚀 正在啟動 Expo 開發服務器...
echo ==========================================
echo.

call npx expo start --clear

echo.
echo ==========================================
echo 📊 測試會話結束
echo ==========================================
echo 如需重新測試，請再次執行此腳本
echo.
pause