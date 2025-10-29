@echo off
echo 🔧 完整設置雲水基材管理手機 App
echo ========================================

echo 📍 當前目錄: %CD%

echo.
echo 📦 建立新的 SDK 54 專案...
cd ..
npx create-expo-app yunshui-mobile-final --template blank

echo.
echo 📂 檢查專案結構...
cd yunshui-mobile-final
dir

echo.
echo 📝 查找主要檔案...
if exist "App.js" (
    echo ✅ 找到 App.js
    echo 📝 將 App.js 重新命名為 App.tsx...
    ren App.js App.tsx
) else if exist "App.tsx" (
    echo ✅ 找到 App.tsx
) else (
    echo ❌ 未找到主要 App 檔案
    echo 📁 列出所有檔案：
    dir /s *.js *.tsx
)

echo.
echo 📋 接下來請手動執行：
echo 1. 檢查 yunshui-mobile-final 資料夾
echo 2. 找到 App.js 或 App.tsx 檔案
echo 3. 替換為完整的系統程式碼
echo 4. 執行 npx expo start --tunnel

pause