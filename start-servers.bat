@echo off
chcp 65001 >nul
title 雲水基材管理系統 - 服務器啟動

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 雲水基材管理系統                        ║
echo ║                      服務器啟動腳本                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤: 未找到 Node.js
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

REM 檢查 npm 是否可用
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤: 未找到 npm
    pause
    exit /b 1
)

echo ✅ Node.js 環境檢查通過
echo.

REM 停止可能正在運行的服務
echo 🧹 清理現有服務...
call stop-servers.bat >nul 2>&1

echo.
echo 📦 檢查和安裝依賴...

REM 檢查後端依賴
echo 檢查後端依賴...
cd backend
if not exist node_modules (
    echo 📥 安裝後端依賴...
    npm install
    if errorlevel 1 (
        echo ❌ 後端依賴安裝失敗
        pause
        exit /b 1
    )
) else (
    echo ✅ 後端依賴已存在
)

REM 檢查前端依賴
echo 檢查前端依賴...
cd ../frontend
if not exist node_modules (
    echo 📥 安裝前端依賴...
    npm install
    if errorlevel 1 (
        echo ❌ 前端依賴安裝失敗
        pause
        exit /b 1
    )
) else (
    echo ✅ 前端依賴已存在
)

cd ..

echo.
echo 🔧 啟動服務器...

REM 啟動後端服務
echo 啟動後端服務 (端口 3004)...
cd backend
start "雲水系統 - 後端服務 (Port 3004)" cmd /k "echo 🔧 後端服務啟動中... && npm run dev"

REM 等待後端啟動
echo 等待後端服務啟動...
timeout /t 5 /nobreak >nul

REM 啟動前端服務
echo 啟動前端服務 (端口 3002)...
cd ../frontend
start "雲水系統 - 前端服務 (Port 3002)" cmd /k "echo 🎨 前端服務啟動中... && npm run dev"

REM 等待前端啟動
echo 等待前端服務啟動...
timeout /t 3 /nobreak >nul

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      ✅ 啟動完成！                           ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  📱 前端應用:     http://localhost:3002/                     ║
echo ║  🔧 後端 API:     http://localhost:3004/                     ║
echo ║  📊 健康檢查:     http://localhost:3004/health               ║
echo ║  🧪 組件測試:     frontend/test-components.html              ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  💡 使用說明:                                                ║
echo ║  • 兩個服務會在新的命令視窗中運行                              ║
echo ║  • 關閉對應的命令視窗即可停止服務                              ║
echo ║  • 或者運行 stop-servers.bat 停止所有服務                     ║
echo ║  • 使用演示帳號登入: admin/admin123                           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 等待幾秒後自動打開瀏覽器
echo 🌐 5秒後自動打開瀏覽器...
timeout /t 5 /nobreak >nul

REM 打開瀏覽器
start http://localhost:3002/

echo.
echo 🎉 系統已成功啟動！
echo 按任意鍵關閉此視窗...
pause >nul