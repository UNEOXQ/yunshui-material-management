@echo off
echo 🚀 測試修復後的雲水基材管理系統手機版
echo.

echo 📋 檢查後端服務器狀態...
curl -s http://192.168.68.95:3004/api/materials > nul
if %errorlevel% neq 0 (
    echo ❌ 後端服務器未運行，請先啟動後端
    echo 💡 請在另一個終端運行: cd backend && node simple-server.js
    pause
    exit /b 1
)
echo ✅ 後端服務器正常運行

echo.
echo 🧹 清理緩存...
if exist node_modules (
    echo 清理 node_modules...
    rmdir /s /q node_modules
)

if exist .expo (
    echo 清理 .expo 緩存...
    rmdir /s /q .expo
)

echo.
echo 📦 安裝依賴...
call npm install

echo.
echo 🚀 啟動 Expo 開發服務器...
echo 📱 請在手機上安裝 Expo Go 應用
echo 🔗 然後掃描 QR 碼或輸入 URL 來測試應用
echo.
call npx expo start --clear

pause