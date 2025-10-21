@echo off
REM 設置錯誤處理，遇到錯誤不退出
setlocal enabledelayedexpansion

echo ================================
echo 雲水基材管理系統 - 調試啟動
echo ================================
echo.

REM 顯示當前目錄
echo 當前工作目錄: %CD%
echo.

REM 檢查基本環境
echo [1/8] 檢查 Node.js...
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Node.js 未安裝或不在 PATH 中
    echo 請從 https://nodejs.org/ 下載安裝 Node.js
    goto :error_exit
) else (
    for /f %%i in ('node --version 2^>nul') do echo ✅ Node.js 版本: %%i
)

echo.
echo [2/8] 檢查 npm...
npm --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ npm 未安裝
    goto :error_exit
) else (
    for /f %%i in ('npm --version 2^>nul') do echo ✅ npm 版本: %%i
)

echo.
echo [3/8] 檢查項目結構...
if not exist "backend" (
    echo ❌ backend 目錄不存在
    goto :error_exit
) else (
    echo ✅ backend 目錄存在
)

if not exist "frontend" (
    echo ❌ frontend 目錄不存在
    goto :error_exit
) else (
    echo ✅ frontend 目錄存在
)

echo.
echo [4/8] 檢查後端配置...
if not exist "backend\package.json" (
    echo ❌ backend\package.json 不存在
    goto :error_exit
) else (
    echo ✅ backend\package.json 存在
)

echo.
echo [5/8] 檢查前端配置...
if not exist "frontend\package.json" (
    echo ❌ frontend\package.json 不存在
    goto :error_exit
) else (
    echo ✅ frontend\package.json 存在
)

echo.
echo [6/8] 檢查後端依賴...
if not exist "backend\node_modules" (
    echo ⚠️ backend\node_modules 不存在，正在安裝...
    cd backend
    echo 執行: npm install
    npm install
    if !errorlevel! neq 0 (
        echo ❌ 後端依賴安裝失敗
        cd ..
        goto :error_exit
    )
    cd ..
    echo ✅ 後端依賴安裝完成
) else (
    echo ✅ backend\node_modules 存在
)

echo.
echo [7/8] 檢查前端依賴...
if not exist "frontend\node_modules" (
    echo ⚠️ frontend\node_modules 不存在，正在安裝...
    cd frontend
    echo 執行: npm install
    npm install
    if !errorlevel! neq 0 (
        echo ❌ 前端依賴安裝失敗
        cd ..
        goto :error_exit
    )
    cd ..
    echo ✅ 前端依賴安裝完成
) else (
    echo ✅ frontend\node_modules 存在
)

echo.
echo [8/8] 清理舊進程...
taskkill /f /im node.exe >nul 2>&1
echo ✅ 舊進程已清理

echo.
echo ================================
echo 所有檢查通過！開始啟動服務...
echo ================================
echo.

echo 🔧 啟動後端服務 (端口 3004)...
cd backend
start "雲水系統-後端" cmd /k "echo 後端服務啟動中... && echo 如果看到錯誤，請檢查端口 3004 是否被占用 && npm run dev"
cd ..

echo ⏳ 等待後端啟動...
timeout /t 5 /nobreak >nul

echo 🎨 啟動前端服務 (端口 3002)...
cd frontend
start "雲水系統-前端" cmd /k "echo 前端服務啟動中... && echo 如果看到錯誤，請檢查端口 3002 是否被占用 && npm run dev"
cd ..

echo.
echo ================================
echo ✅ 啟動完成！
echo ================================
echo.
echo 📱 前端應用: http://localhost:3002/
echo 🔧 後端 API: http://localhost:3004/
echo.
echo 💡 提示:
echo - 兩個服務在新的命令視窗中運行
echo - 如果服務無法啟動，請檢查新開的視窗中的錯誤信息
echo - 關閉對應的命令視窗即可停止服務
echo.
echo 🌐 5秒後自動打開瀏覽器...
timeout /t 5 /nobreak >nul
start http://localhost:3002/

goto :normal_exit

:error_exit
echo.
echo ================================
echo ❌ 啟動失敗！
echo ================================
echo.
echo 請檢查上述錯誤信息並解決問題後重試。
echo.
echo 常見解決方案:
echo 1. 確保已安裝 Node.js (https://nodejs.org/)
echo 2. 確保在正確的項目目錄中運行此腳本
echo 3. 檢查網絡連接（安裝依賴需要網絡）
echo 4. 以管理員身份運行此腳本
echo.
pause
exit /b 1

:normal_exit
echo 按任意鍵關閉此視窗...
pause >nul
exit /b 0