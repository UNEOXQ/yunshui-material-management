@echo off
chcp 65001 >nul
echo.
echo 🚀 雲水基材管理系統 Mobile App 測試
echo =====================================
echo.

:: 檢查是否在正確目錄
if not exist "package.json" (
    echo ❌ 錯誤: 請在 mobile-app 目錄中執行此腳本
    echo 請執行: cd mobile-app
    pause
    exit /b 1
)

echo ✅ 在正確的目錄中
echo.

:: 檢查 Node.js
echo 🔍 檢查 Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安裝
    echo 請安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js 版本: %NODE_VERSION%

:: 檢查 npm
echo.
echo 🔍 檢查 npm...
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm 版本: %NPM_VERSION%

:: 檢查依賴
echo.
echo 🔍 檢查專案依賴...
if not exist "node_modules" (
    echo ❌ node_modules 不存在，正在安裝依賴...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依賴安裝失敗
        pause
        exit /b 1
    )
    echo ✅ 依賴安裝完成
) else (
    echo ✅ 依賴已安裝
)

:: 檢查配置檔案
echo.
echo 🔍 檢查配置檔案...
if exist "app.json" (
    echo ✅ app.json 存在
) else (
    echo ❌ app.json 不存在
)

if exist "eas.json" (
    echo ✅ eas.json 存在
) else (
    echo ❌ eas.json 不存在
)

if exist ".env.example" (
    echo ✅ .env.example 存在
    if not exist ".env" (
        echo ⚠️  建議複製 .env.example 為 .env
    )
) else (
    echo ⚠️  .env.example 不存在
)

:: 執行基本測試
echo.
echo 🧪 執行基本測試...
echo 正在檢查 TypeScript...
call npm run type-check >nul 2>&1
if %errorlevel% eq 0 (
    echo ✅ TypeScript 檢查通過
) else (
    echo ⚠️  TypeScript 檢查有問題
)

:: 提供選項
echo.
echo 📋 測試完成！
echo.
echo 🎯 下一步選項:
echo 1. 啟動開發伺服器 (npm start)
echo 2. 執行完整測試 (npm test)
echo 3. 建置測試版 APK (npm run build:android:debug)
echo 4. 查看測試指南 (TESTING_GUIDE.md)
echo 5. 退出
echo.

set /p choice="請選擇 (1-5): "

if "%choice%"=="1" (
    echo 正在啟動開發伺服器...
    npm start
) else if "%choice%"=="2" (
    echo 正在執行測試...
    npm test
) else if "%choice%"=="3" (
    echo 正在建置測試版 APK...
    npm run build:android:debug
) else if "%choice%"=="4" (
    echo 開啟測試指南...
    start TESTING_GUIDE.md
) else (
    echo 測試完成！
)

echo.
echo ✨ 感謝使用雲水基材管理系統！
pause