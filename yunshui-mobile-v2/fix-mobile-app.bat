@echo off
echo 🔧 修復手機 App SDK 版本問題
echo ========================================

echo 📍 當前目錄: %CD%

echo.
echo 🚀 方法 1: 嘗試本地啟動
echo ----------------------------------------
cd "..\yunshui-mobile-v2"
echo 📱 使用本地模式啟動 Expo...
npx expo start --localhost --clear

pause

echo.
echo 🚀 方法 2: 如果方法 1 失敗，建立新專案
echo ----------------------------------------
echo 是否要建立新的 SDK 54 專案？ (y/n)
set /p choice=

if /i "%choice%"=="y" (
    echo 📦 建立新專案...
    cd ..
    npx create-expo-app yunshui-mobile-v3 --template blank
    
    echo ✅ 新專案建立完成！
    echo 📝 請手動複製 App.tsx 程式碼到新專案
    echo 📂 新專案位置: yunshui-mobile-v3
    
    cd yunshui-mobile-v3
    echo 🚀 啟動新專案...
    npx expo start --tunnel
)

pause