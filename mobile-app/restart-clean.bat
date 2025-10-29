@echo off
chcp 65001 >nul
echo.
echo 🔄 重新啟動 Expo (清除快取)
echo ========================
echo.

echo 📋 正在清除 Metro 快取...
npx expo start --clear --tunnel

echo.
echo ✨ 如果仍有問題，請嘗試:
echo 1. 重新啟動 Expo Go 應用程式
echo 2. 清除 Expo Go 快取
echo 3. 檢查網路連線
echo.
pause