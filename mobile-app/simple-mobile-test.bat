@echo off
chcp 65001 >nul
echo.
echo 📱 雲水基材管理系統 - 簡單手機測試
echo ================================
echo.

echo 📋 當前狀態檢查...
if not exist "package.json" (
    echo ❌ package.json 不存在
    echo 請確認在 mobile-app 目錄中執行
    pause
    exit /b 1
)

echo ✅ 在正確目錄中
echo.

echo 🔧 跳過 Web 支援，直接測試手機版本...
echo.

echo 🚀 啟動 Expo 開發伺服器 (Tunnel 模式)...
echo.
echo 📱 請準備好手機上的 Expo Go 應用程式
echo ⏱️  Tunnel 建立可能需要 1-2 分鐘，請耐心等待
echo 🔗 看到 QR 碼後，用 Expo Go 掃描
echo.
echo 正在啟動...
echo.

npx expo start --tunnel

echo.
echo 🔄 如果上面的命令結束了，按任意鍵重試...
pause
goto :eof