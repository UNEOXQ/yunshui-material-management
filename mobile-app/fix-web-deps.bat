@echo off
chcp 65001 >nul
echo.
echo 🔧 修復 Web 依賴衝突
echo ==================
echo.

echo 📋 使用 --legacy-peer-deps 解決版本衝突...
echo.

npm install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0 --legacy-peer-deps

if %errorlevel% neq 0 (
    echo.
    echo ❌ 安裝失敗，嘗試強制安裝...
    npm install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0 --force
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 強制安裝也失敗
        echo 跳過 Web 支援，直接嘗試手機版本...
        goto mobile_version
    )
)

echo.
echo ✅ Web 依賴安裝完成
echo.

echo 🚀 啟動 Web 版本...
npx expo start --web

goto end

:mobile_version
echo.
echo 📱 改為啟動手機版本 (Tunnel 模式)...
echo 請使用 Expo Go 掃描 QR 碼
echo.
npx expo start --tunnel

:end
echo.
pause