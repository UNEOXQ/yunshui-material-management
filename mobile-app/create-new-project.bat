@echo off
chcp 65001 >nul
echo.
echo 🆕 建立全新的 SDK 51 專案
echo ========================
echo.

echo 📋 這個方案會:
echo 1. 建立一個全新的 Expo SDK 51 專案
echo 2. 複製現有的程式碼和配置
echo 3. 確保與 Expo Go SDK 54 相容
echo.

set /p confirm="確定要繼續嗎? (y/n): "
if not "%confirm%"=="y" if not "%confirm%"=="Y" (
    echo 取消操作
    pause
    exit /b 0
)

echo.
echo 🚀 開始建立新專案...
echo.

cd ..

echo 1️⃣ 建立新的 Expo 專案...
npx create-expo-app yunshui-mobile-v2 --template blank-typescript

if %errorlevel% neq 0 (
    echo ❌ 專案建立失敗
    pause
    exit /b 1
)

echo.
echo 2️⃣ 複製現有程式碼...

copy "mobile-app\App.tsx" "yunshui-mobile-v2\App.tsx" /Y
copy "mobile-app\app.json" "yunshui-mobile-v2\app.json" /Y

echo.
echo 3️⃣ 進入新專案目錄...
cd yunshui-mobile-v2

echo.
echo 4️⃣ 更新 app.json 配置...
echo {"expo":{"name":"雲水基材管理","slug":"yunshui-mobile-v2","version":"1.0.0","orientation":"portrait","platforms":["ios","android"],"splash":{"backgroundColor":"#007bff"},"android":{"package":"com.yunshui.mobile.v2"},"ios":{"bundleIdentifier":"com.yunshui.mobile.v2"}}} > app.json

echo.
echo 5️⃣ 啟動新專案...
echo 📱 請用 Expo Go 掃描 QR 碼
echo.

npx expo start --tunnel

pause