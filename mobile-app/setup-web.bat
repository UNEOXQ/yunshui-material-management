@echo off
chcp 65001 >nul
echo.
echo 🌐 設置 Web 支援並啟動
echo ====================
echo.

echo 📦 安裝 Web 支援依賴...
echo 正在安裝 react-native-web 和 webpack-config...
echo.

npx expo install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0

if %errorlevel% neq 0 (
    echo.
    echo ❌ 依賴安裝失敗
    echo 請檢查網路連線或手動執行:
    echo npx expo install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0
    pause
    exit /b 1
)

echo.
echo ✅ Web 支援依賴安裝完成
echo.

echo 🚀 啟動 Web 版本...
echo 📱 應用程式將在瀏覽器中開啟
echo 🔗 URL: http://localhost:8081
echo.

npx expo start --web

echo.
echo 💡 如果瀏覽器沒有自動開啟，請手動前往:
echo http://localhost:8081
echo.
pause