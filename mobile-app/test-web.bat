@echo off
chcp 65001 >nul
echo.
echo 🌐 啟動 Web 版本測試
echo ==================
echo.

echo 📋 檢查配置...
if not exist "app.json" (
    echo ❌ app.json 不存在
    pause
    exit /b 1
)

echo ✅ app.json 存在
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