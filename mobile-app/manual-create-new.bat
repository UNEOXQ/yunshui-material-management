@echo off
chcp 65001 >nul
echo.
echo 🆕 手動建立新專案 - 逐步執行
echo ============================
echo.

echo 📋 當前目錄: %CD%
echo.

echo 🔍 檢查是否在正確目錄...
if not exist "package.json" (
    echo ❌ 不在 mobile-app 目錄中
    echo 請先執行: cd mobile-app
    pause
    exit /b 1
)

echo ✅ 在正確目錄中
echo.

echo 📁 移動到上層目錄...
cd ..
echo 當前目錄: %CD%
echo.

echo 🚀 建立新的 Expo 專案...
echo 這可能需要幾分鐘時間...
echo.

npx create-expo-app yunshui-mobile-v2 --template blank-typescript

echo.
echo 📋 檢查專案是否建立成功...
if not exist "yunshui-mobile-v2" (
    echo ❌ 專案建立失敗
    echo 請檢查網路連線或手動執行:
    echo npx create-expo-app yunshui-mobile-v2 --template blank-typescript
    pause
    exit /b 1
)

echo ✅ 專案建立成功
echo.

echo 📄 複製現有程式碼...
copy "mobile-app\App.tsx" "yunshui-mobile-v2\App.tsx" /Y
if %errorlevel% neq 0 (
    echo ⚠️  App.tsx 複製失敗，將使用預設檔案
)

echo.
echo 📁 進入新專案目錄...
cd yunshui-mobile-v2
echo 當前目錄: %CD%
echo.

echo 🔧 更新 app.json...
echo {"expo":{"name":"雲水基材管理 v2","slug":"yunshui-mobile-v2","version":"1.0.0","orientation":"portrait","platforms":["ios","android"],"splash":{"backgroundColor":"#007bff"},"android":{"package":"com.yunshui.mobile.v2"},"ios":{"bundleIdentifier":"com.yunshui.mobile.v2"}}} > app.json

echo.
echo 🚀 啟動新專案...
echo 📱 請準備 Expo Go 掃描 QR 碼
echo.

npx expo start --tunnel

echo.
echo 如果看到這行文字，表示 Expo 已停止運行
pause