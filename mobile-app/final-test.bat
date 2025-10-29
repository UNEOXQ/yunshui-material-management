@echo off
chcp 65001 >nul
echo.
echo 🎯 雲水基材管理系統 - 最終測試
echo ============================
echo.

echo 📋 檢查 JSON 語法...
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8')); console.log('✅ package.json 語法正確');"

if %errorlevel% neq 0 (
    echo ❌ package.json 語法錯誤
    pause
    exit /b 1
)

echo.
echo 📦 安裝依賴...
npm install

if %errorlevel% neq 0 (
    echo ❌ 依賴安裝失敗
    pause
    exit /b 1
)

echo.
echo ✅ 依賴安裝完成
echo.

echo 🚀 啟動 Expo (Tunnel 模式)...
echo 📱 請準備 Expo Go 掃描 QR 碼
echo ⏱️  等待 Tunnel 建立...
echo.

npx expo start --tunnel

pause