@echo off
chcp 65001 >nul
echo.
echo 🔧 修復依賴並啟動手機版本
echo ========================
echo.

echo 📦 重新安裝依賴...
npm install

if %errorlevel% neq 0 (
    echo.
    echo ⚠️  npm install 失敗，嘗試使用 --legacy-peer-deps...
    npm install --legacy-peer-deps
    
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依賴安裝失敗，移除 Web 支援...
        echo 正在清理 package.json...
        
        REM 這裡我們會手動移除 Web 依賴
        echo 請手動移除 package.json 中的 react-native-web 和 @expo/webpack-config
        pause
        exit /b 1
    )
)

echo.
echo ✅ 依賴安裝完成
echo.

echo 🚀 啟動 Tunnel 模式...
echo 📱 請用 Expo Go 掃描 QR 碼
echo.

npx expo start --tunnel

pause