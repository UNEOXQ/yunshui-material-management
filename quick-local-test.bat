@echo off
chcp 65001 >nul
echo 🚀 快速本地測試 - 雲水基材管理系統

echo 📍 檢查目錄...
if not exist "backend" (
    echo ❌ 找不到 backend 目錄！
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ 找不到 frontend 目錄！
    pause
    exit /b 1
)

echo ✅ 目錄檢查通過

echo 🛑 停止現有服務...
taskkill /f /im node.exe >nul 2>&1
echo ✅ 已停止現有 Node 進程

echo 🚀 啟動後端 (端口 3004)...
cd backend
start "雲水後端" cmd /k "echo 🚀 後端服務啟動中... && npm start"
cd ..

echo ⏳ 等待後端啟動...
ping 127.0.0.1 -n 6 >nul

echo 🚀 啟動前端 (端口 3000)...
cd frontend  
start "雲水前端" cmd /k "echo 🚀 前端服務啟動中... && npm run dev"
cd ..

echo ⏳ 等待前端啟動...
ping 127.0.0.1 -n 8 >nul

echo 🌐 打開瀏覽器...
start http://localhost:3000

echo.
echo ✅ 本地測試環境已啟動！
echo 📝 前端地址: http://localhost:3000
echo 📝 後端地址: http://localhost:3004
echo.
echo 📋 測試專案創建功能:
echo 1. 等待頁面完全載入
echo 2. 進入 "輔料選擇" 或 "成品選擇"
echo 3. 添加材料到購物車
echo 4. 點擊購物車圖標
echo 5. 選擇 "+ 創建新專案"
echo 6. 輸入專案名稱並點擊創建
echo 7. 檢查 F12 Console 是否有日誌輸出
echo.
echo 🔍 預期的 Console 輸出:
echo    📋 載入專案列表...
echo    ✅ 專案列表載入成功: X 個專案
echo    🏗️ 創建新專案: [專案名稱]
echo    ✅ 專案創建成功: {...}
echo.
echo ⚠️  要停止服務，請關閉標題為 "雲水後端" 和 "雲水前端" 的視窗
echo.
pause