@echo off
echo 🚀 建立全新的雲水基材管理手機 App
echo ========================================

echo 📍 當前目錄: %CD%

echo.
echo 📦 建立新的 SDK 54 專案...
cd ..
npx create-expo-app yunshui-mobile-v4 --template blank

echo.
echo ✅ 專案建立完成！
echo 📂 專案位置: yunshui-mobile-v4

echo.
echo 📝 接下來請手動執行以下步驟：
echo 1. 複製 App.tsx 程式碼到新專案
echo 2. 啟動新專案
echo.

pause

echo 🚀 啟動新專案...
cd yunshui-mobile-v4
npx expo start --tunnel

pause