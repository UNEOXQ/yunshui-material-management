@echo off
chcp 65001 >nul
echo.
echo 🚇 啟動 Expo Tunnel 模式
echo =====================
echo.
echo 📱 這個模式可以解決大部分連線問題
echo ⏱️  首次啟動可能需要 2-3 分鐘
echo.

echo 🔄 正在啟動 Tunnel 模式...
npx expo start --tunnel

echo.
echo ✨ 如果出現問題，請檢查:
echo 1. 網路連線是否穩定
echo 2. Expo Go 是否為最新版本
echo 3. 是否需要清除 Expo Go 快取
echo.
pause