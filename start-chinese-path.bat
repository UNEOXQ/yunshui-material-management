@echo off
REM 設置 UTF-8 編碼
chcp 65001 >nul

echo ================================
echo 雲水基材管理系統啟動器
echo 中文路徑專用版本
echo ================================
echo.

REM 顯示當前路徑
echo 當前路徑: %CD%
echo.

REM 檢查 Node.js 是否在 PATH 中
echo [1/6] 檢查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 找不到 Node.js 命令
    echo.
    echo 可能的解決方案:
    echo 1. 重新安裝 Node.js: https://nodejs.org/
    echo 2. 確保 Node.js 已添加到系統 PATH
    echo 3. 重啟命令提示符
    echo.
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version 2^>nul') do echo ✅ Node.js 版本: %%i
)

REM 檢查 npm
echo.
echo [2/6] 檢查 npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ 找不到 npm 命令
    echo 請重新安裝 Node.js
    pause
    exit /b 1
) else (
    for /f %%i in ('npm --version 2^>nul') do echo ✅ npm 版本: %%i
)

REM 檢查項目結構
echo.
echo [3/6] 檢查項目結構...
if not exist "backend" (
    echo ❌ backend 目錄不存在
    echo 請確認在正確的項目目錄中運行此腳本
    pause
    exit /b 1
) else (
    echo ✅ backend 目錄存在
)

if not exist "frontend" (
    echo ❌ frontend 目錄不存在
    echo 請確認在正確的項目目錄中運行此腳本
    pause
    exit /b 1
) else (
    echo ✅ frontend 目錄存在
)

REM 檢查 package.json
echo.
echo [4/6] 檢查配置文件...
if not exist "backend\package.json" (
    echo ❌ backend\package.json 不存在
    pause
    exit /b 1
) else (
    echo ✅ backend\package.json 存在
)

if not exist "frontend\package.json" (
    echo ❌ frontend\package.json 不存在
    pause
    exit /b 1
) else (
    echo ✅ frontend\package.json 存在
)

REM 清理舊進程
echo.
echo [5/6] 清理舊進程...
taskkill /f /im node.exe >nul 2>&1
echo ✅ 舊進程已清理

REM 檢查依賴
echo.
echo [6/6] 檢查依賴...
if not exist "backend\node_modules" (
    echo ⚠️ 後端依賴不存在，正在安裝...
    pushd backend
    npm install
    if errorlevel 1 (
        echo ❌ 後端依賴安裝失敗
        popd
        pause
        exit /b 1
    )
    popd
    echo ✅ 後端依賴安裝完成
) else (
    echo ✅ 後端依賴存在
)

if not exist "frontend\node_modules" (
    echo ⚠️ 前端依賴不存在，正在安裝...
    pushd frontend
    npm install
    if errorlevel 1 (
        echo ❌ 前端依賴安裝失敗
        popd
        pause
        exit /b 1
    )
    popd
    echo ✅ 前端依賴安裝完成
) else (
    echo ✅ 前端依賴存在
)

echo.
echo ================================
echo 開始啟動服務...
echo ================================
echo.

REM 啟動後端 - 使用 pushd/popd 處理中文路徑
echo 🔧 啟動後端服務...
pushd backend
start "雲水系統-後端服務" cmd /k "title 後端服務 && echo 後端服務啟動中... && npm run dev"
popd

REM 等待後端啟動
echo ⏳ 等待後端啟動...
timeout /t 5 /nobreak >nul

REM 啟動前端
echo 🎨 啟動前端服務...
pushd frontend
start "雲水系統-前端服務" cmd /k "title 前端服務 && echo 前端服務啟動中... && npm run dev"
popd

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
echo - 關閉對應的命令視窗即可停止服務
echo - 如果服務無法啟動，請檢查新開視窗中的錯誤信息
echo.

REM 等待並打開瀏覽器
echo 🌐 3秒後自動打開瀏覽器...
timeout /t 3 /nobreak >nul
start http://localhost:3002/

echo.
echo 按任意鍵關閉此視窗...
pause >nul