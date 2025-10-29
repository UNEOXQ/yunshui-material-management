@echo off
chcp 65001 >nul
echo.
echo 🚀 複製完整的雲水基材管理系統到新專案
echo ====================================
echo.

echo 📁 檢查目標目錄...
if not exist "..\yunshui-mobile-v2" (
    echo ❌ 找不到 yunshui-mobile-v2 目錄
    pause
    exit /b 1
)

echo ✅ 目標目錄存在
echo.

echo 📂 複製完整的 src 目錄...
xcopy "src" "..\yunshui-mobile-v2\src" /E /I /Y

echo.
echo 📄 複製主要配置文件...
copy "App.tsx" "..\yunshui-mobile-v2\App.tsx" /Y
copy "app.json" "..\yunshui-mobile-v2\app.json" /Y
copy "package.json" "..\yunshui-mobile-v2\package.json" /Y
copy "tsconfig.json" "..\yunshui-mobile-v2\tsconfig.json" /Y
copy "babel.config.js" "..\yunshui-mobile-v2\babel.config.js" /Y

echo.
echo 📦 複製資源目錄...
if exist "assets" (
    xcopy "assets" "..\yunshui-mobile-v2\assets" /E /I /Y
)

echo.
echo 📁 進入新專案目錄...
cd ..\yunshui-mobile-v2

echo.
echo 📦 安裝依賴...
npm install

echo.
echo 🚀 啟動完整的雲水基材管理系統...
echo 📱 現在你應該能看到完整的功能了！
echo.

npx expo start --tunnel --clear

pause