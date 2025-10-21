@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 雲水基材管理系統 - 智能啟動器
echo ========================================
echo.

:: 獲取當前目錄並處理中文路徑
set "CURRENT_DIR=%~dp0"
set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

echo 📍 當前工作目錄: %CURRENT_DIR%
echo.

:: 檢查目錄結構
if not exist "%CURRENT_DIR%\backend" (
    echo ❌ 錯誤: 找不到 backend 目錄
    echo 請確保在正確的專案根目錄執行此腳本
    pause
    exit /b 1
)

if not exist "%CURRENT_DIR%\frontend" (
    echo ❌ 錯誤: 找不到 frontend 目錄
    echo 請確保在正確的專案根目錄執行此腳本
    pause
    exit /b 1
)

:: 檢查 Node.js 是否安裝
echo 🔍 檢查 Node.js 環境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤: 未找到 Node.js
    echo 請先安裝 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 錯誤: 未找到 npm
    echo 請重新安裝 Node.js
    pause
    exit /b 1
)

echo ✅ Node.js 環境正常

:: 檢查並安裝後端依賴
echo.
echo 📦 檢查後端依賴...
cd /d "%CURRENT_DIR%\backend"
if not exist "node_modules" (
    echo 🔧 安裝後端依賴...
    call npm install
    if errorlevel 1 (
        echo ❌ 後端依賴安裝失敗
        pause
        exit /b 1
    )
    echo ✅ 後端依賴安裝完成
) else (
    echo ✅ 後端依賴已存在
)

:: 檢查並安裝前端依賴
echo.
echo 📦 檢查前端依賴...
cd /d "%CURRENT_DIR%\frontend"
if not exist "node_modules" (
    echo 🔧 安裝前端依賴...
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依賴安裝失敗
        pause
        exit /b 1
    )
    echo ✅ 前端依賴安裝完成
) else (
    echo ✅ 前端依賴已存在
)

:: 檢查端口是否被占用
echo.
echo 🔍 檢查端口狀態...
netstat -an | findstr ":3004" >nul
if not errorlevel 1 (
    echo ⚠️  警告: 端口 3004 已被占用
    echo 正在嘗試終止占用進程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3004"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

netstat -an | findstr ":3000" >nul
if not errorlevel 1 (
    echo ⚠️  警告: 端口 3000 已被占用
    echo 正在嘗試終止占用進程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

:: 創建 uploads 目錄
echo.
echo 📁 準備上傳目錄...
cd /d "%CURRENT_DIR%"
if not exist "uploads" mkdir uploads
if not exist "uploads\materials" mkdir uploads\materials
echo ✅ 上傳目錄準備完成

:: 啟動後端服務
echo.
echo 🔧 啟動後端服務...
cd /d "%CURRENT_DIR%\backend"
start "雲水系統-後端服務" cmd /k "echo 🔧 後端服務啟動中... && npm run dev"

:: 等待後端服務啟動
echo ⏳ 等待後端服務啟動...
timeout /t 5 /nobreak >nul

:: 檢查後端服務是否啟動成功
:check_backend
echo 🔍 檢查後端服務狀態...
curl -s http://localhost:3004/health >nul 2>&1
if errorlevel 1 (
    echo ⏳ 後端服務尚未就緒，繼續等待...
    timeout /t 3 /nobreak >nul
    goto check_backend
)
echo ✅ 後端服務啟動成功

:: 啟動前端服務
echo.
echo 🎨 啟動前端服務...
cd /d "%CURRENT_DIR%\frontend"
start "雲水系統-前端服務" cmd /k "echo 🎨 前端服務啟動中... && npm run dev"

:: 等待前端服務啟動
echo ⏳ 等待前端服務啟動...
timeout /t 8 /nobreak >nul

:: 顯示系統信息
echo.
echo ========================================
echo ✅ 雲水基材管理系統啟動完成！
echo ========================================
echo.
echo 🌐 系統訪問地址:
echo    前端應用: http://localhost:3000/
echo    後端 API: http://localhost:3004/
echo    健康檢查: http://localhost:3004/health
echo.
echo 📊 API 端點:
echo    🔐 認證: http://localhost:3004/api/auth
echo    👥 用戶: http://localhost:3004/api/users  
echo    📦 材料: http://localhost:3004/api/materials
echo    🛒 訂單: http://localhost:3004/api/orders
echo    📤 上傳: http://localhost:3004/api/upload
echo    📊 狀態: http://localhost:3004/api/status
echo    ❌ 錯誤: http://localhost:3004/api/errors
echo.
echo 🎭 演示帳號:
echo    管理員: admin / admin123
echo    專案經理: pm001 / pm123  
echo    區域經理: am001 / am123
echo    倉庫管理: warehouse001 / wh123
echo.
echo 💡 使用提示:
echo    - 前端和後端在獨立窗口運行
echo    - 關閉對應窗口可停止服務
echo    - 修改代碼後會自動重載
echo    - 圖片上傳功能已啟用
echo.
echo 🛑 停止系統: 運行 stop-system-fixed.bat
echo ========================================

:: 嘗試自動打開瀏覽器
echo.
echo 🌐 正在打開瀏覽器...
timeout /t 3 /nobreak >nul
start http://localhost:3000/

echo.
echo 按任意鍵關閉此窗口...
pause >nul