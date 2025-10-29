@echo off
chcp 65001 >nul
echo.
echo 🔍 檢查新專案是否已建立
echo =====================
echo.

cd ..
echo 📁 當前目錄內容:
dir /b

echo.
if exist "yunshui-mobile-v2" (
    echo ✅ 找到 yunshui-mobile-v2 目錄！
    echo 📁 進入新專案目錄...
    cd yunshui-mobile-v2
    echo.
    echo 🚀 啟動專案...
    npx expo start --tunnel
) else (
    echo ❌ 沒有找到 yunshui-mobile-v2 目錄
    echo.
    echo 🆕 現在建立新專案...
    npx create-expo-app yunshui-mobile-v2 --template blank-typescript
    
    if exist "yunshui-mobile-v2" (
        echo ✅ 專案建立成功！
        cd yunshui-mobile-v2
        echo 🚀 啟動專案...
        npx expo start --tunnel
    ) else (
        echo ❌ 專案建立失敗
        echo 請檢查網路連線或手動執行命令
    )
)

pause