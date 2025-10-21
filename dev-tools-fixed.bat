@echo off
chcp 65001 >nul
title 雲水基材管理系統 - 開發者工具

:menu
cls
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🛠️ 雲水基材管理系統                        ║
echo ║                       開發者工具                             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo 請選擇操作:
echo.
echo  1. 🚀 啟動服務器
echo  2. 🛑 停止服務器  
echo  3. 🔄 重啟服務器
echo  4. 🔍 檢查服務器狀態
echo  5. 📦 安裝/更新依賴
echo  6. 🧪 打開測試頁面
echo  7. 🌐 打開應用程式
echo  8. 📝 查看日誌
echo  9. 🧹 清理緩存
echo  0. ❌ 退出
echo.
set /p choice=請輸入選項 (0-9): 

if "%choice%"=="1" goto start_servers
if "%choice%"=="2" goto stop_servers
if "%choice%"=="3" goto restart_servers
if "%choice%"=="4" goto check_servers
if "%choice%"=="5" goto install_deps
if "%choice%"=="6" goto open_test
if "%choice%"=="7" goto open_app
if "%choice%"=="8" goto view_logs
if "%choice%"=="9" goto clean_cache
if "%choice%"=="0" goto exit

echo 無效選項，請重新選擇...
timeout /t 2 >nul
goto menu

:start_servers
echo.
echo 🚀 啟動服務器...
echo.

REM 檢查 Node.js 和 npm
echo 檢查環境...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 找不到 Node.js，請確認已安裝並添加到 PATH
    echo 下載地址: https://nodejs.org/
    pause
    goto menu
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ 找不到 npm，請重新安裝 Node.js
    pause
    goto menu
)

echo ✅ Node.js 和 npm 檢查通過

REM 檢查項目結構
if not exist "backend" (
    echo ❌ backend 目錄不存在
    pause
    goto menu
)

if not exist "frontend" (
    echo ❌ frontend 目錄不存在
    pause
    goto menu
)

echo ✅ 項目結構檢查通過

REM 停止現有進程
echo 清理現有進程...
taskkill /f /im node.exe >nul 2>&1

REM 檢查並安裝後端依賴
echo 檢查後端依賴...
if not exist "backend\node_modules" (
    echo 安裝後端依賴...
    pushd backend
    npm install
    if errorlevel 1 (
        echo ❌ 後端依賴安裝失敗
        popd
        pause
        goto menu
    )
    popd
)

REM 檢查並安裝前端依賴
echo 檢查前端依賴...
if not exist "frontend\node_modules" (
    echo 安裝前端依賴...
    pushd frontend
    npm install
    if errorlevel 1 (
        echo ❌ 前端依賴安裝失敗
        popd
        pause
        goto menu
    )
    popd
)

echo.
echo 啟動後端服務...
pushd backend
start "雲水系統-後端" cmd /k "echo 後端服務啟動中... && npm run dev"
popd

echo 等待後端啟動...
timeout /t 5 >nul

echo 啟動前端服務...
pushd frontend
start "雲水系統-前端" cmd /k "echo 前端服務啟動中... && npm run dev"
popd

echo.
echo ✅ 服務啟動完成！
echo 📱 前端: http://localhost:3002/
echo 🔧 後端: http://localhost:3004/
echo.
echo 5秒後自動打開瀏覽器...
timeout /t 5 >nul
start http://localhost:3002/

pause
goto menu

:stop_servers
echo.
echo 🛑 停止服務器...
echo.

REM 停止 Node.js 進程
taskkill /f /im node.exe >nul 2>&1

REM 停止特定端口
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3002') do (
    if not "%%a"=="0" (
        echo 停止端口 3002 進程 %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3004') do (
    if not "%%a"=="0" (
        echo 停止端口 3004 進程 %%a
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo ✅ 服務器已停止
pause
goto menu

:restart_servers
echo.
echo 🔄 重啟服務器...
call :stop_servers
timeout /t 2 >nul
call :start_servers
goto menu

:check_servers
echo.
echo 🔍 檢查服務器狀態...
echo.

REM 檢查 Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js: 未找到
) else (
    for /f %%i in ('node --version 2^>nul') do echo ✅ Node.js: %%i
)

REM 檢查 npm
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm: 未找到
) else (
    for /f %%i in ('npm --version 2^>nul') do echo ✅ npm: %%i
)

echo.
echo 端口狀態:
netstat -aon | findstr ":3002 " >nul 2>&1
if errorlevel 1 (
    echo ❌ 前端服務 (3002): 未運行
) else (
    echo ✅ 前端服務 (3002): 運行中
)

netstat -aon | findstr ":3004 " >nul 2>&1
if errorlevel 1 (
    echo ❌ 後端服務 (3004): 未運行
) else (
    echo ✅ 後端服務 (3004): 運行中
)

pause
goto menu

:install_deps
echo.
echo 📦 安裝/更新依賴...
echo.

echo 更新後端依賴...
pushd backend
npm install
if errorlevel 1 (
    echo ❌ 後端依賴更新失敗
) else (
    echo ✅ 後端依賴更新完成
)
popd

echo.
echo 更新前端依賴...
pushd frontend
npm install
if errorlevel 1 (
    echo ❌ 前端依賴更新失敗
) else (
    echo ✅ 前端依賴更新完成
)
popd

echo.
echo 依賴更新完成！
pause
goto menu

:open_test
echo.
echo 🧪 打開測試頁面...
if exist "frontend\test-components.html" (
    start frontend\test-components.html
) else (
    echo ❌ 測試頁面不存在
)
pause
goto menu

:open_app
echo.
echo 🌐 打開應用程式...
start http://localhost:3002/
pause
goto menu

:view_logs
echo.
echo 📝 查看日誌...
echo.
echo 日誌通常在服務器的命令視窗中顯示
echo 前端日誌: 瀏覽器開發者工具 (F12)
echo 後端日誌: 後端服務器命令視窗
pause
goto menu

:clean_cache
echo.
echo 🧹 清理緩存...
echo.

echo 清理 npm 緩存...
npm cache clean --force

echo 清理前端構建緩存...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "frontend\.vite" rmdir /s /q "frontend\.vite"

echo 清理後端構建緩存...
if exist "backend\dist" rmdir /s /q "backend\dist"

echo ✅ 緩存清理完成！
pause
goto menu

:exit
echo.
echo 👋 感謝使用雲水基材管理系統開發者工具！
timeout /t 2 >nul
exit