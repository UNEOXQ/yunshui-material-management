@echo off
echo 🚀 啟動簡單本地測試...

echo 📍 當前目錄: %CD%

echo 🛑 停止現有 Node 進程...
taskkill /f /im node.exe >nul 2>&1

echo ⏳ 等待 3 秒...
timeout /t 3 /nobreak >nul

echo 🚀 啟動後端服務器 (端口 3004)...
start "後端服務器" cmd /k "cd backend && npm start"

echo ⏳ 等待後端啟動 (8 秒)...
timeout /t 8 /nobreak >nul

echo 🚀 啟動前端服務器 (端口 3000)...
start "前端服務器" cmd /k "cd frontend && npm run dev"

echo ⏳ 等待前端啟動 (8 秒)...
timeout /t 8 /nobreak >nul

echo 🌐 打開瀏覽器...
start http://localhost:3000

echo ✅ 本地測試環境已啟動！
echo 📝 前端: http://localhost:3000
echo 📝 後端: http://localhost:3004
echo.
echo 📋 測試步驟:
echo 1. 檢查前端是否正常載入
echo 2. 進入材料選擇頁面
echo 3. 添加材料到購物車
echo 4. 嘗試創建新專案
echo 5. 檢查 F12 Console 輸出
echo.
echo ⚠️  要停止服務，請關閉彈出的 CMD 視窗
pause