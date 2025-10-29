@echo off
chcp 65001 >nul
echo.
echo 🔧 緊急修復版本衝突問題
echo =====================
echo.

echo 📁 進入新專案目錄...
cd ..\yunshui-mobile-v2

echo.
echo 🔍 檢查當前 Expo 版本...
type package.json | findstr "expo"

echo.
echo 🔧 確保使用 SDK 51 版本...
echo 正在更新 package.json 中的 expo 版本...

echo.
echo 📦 重新安裝正確版本的 Expo...
npm install expo@~51.0.0

echo.
echo 🧹 清除快取...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
)
if exist ".expo" (
    rmdir /s /q ".expo"
)

echo.
echo 📄 確保 app.json 配置正確...
echo {"expo":{"name":"雲水基材管理系統","slug":"yunshui-mobile-v2","version":"2.0.0","orientation":"portrait","platforms":["ios","android"],"splash":{"backgroundColor":"#007bff"},"android":{"package":"com.yunshui.mobile.v2"},"ios":{"bundleIdentifier":"com.yunshui.mobile.v2"}}} > app.json

echo.
echo 🚀 重新啟動 (強制清除快取)...
echo 📱 這次應該能正常載入了！
echo.

npx expo start --tunnel --clear

pause