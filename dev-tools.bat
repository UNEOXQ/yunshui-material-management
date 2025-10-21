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
call start-servers.bat
pause
goto menu

:stop_servers
echo.
echo 🛑 停止服務器...
call stop-servers.bat
pause
goto menu

:restart_servers
echo.
echo 🔄 重啟服務器...
call restart-servers.bat
pause
goto menu

:check_servers
echo.
echo 🔍 檢查服務器狀態...
call check-servers.bat
pause
goto menu

:install_deps
echo.
echo 📦 安裝/更新依賴...
echo.
echo 更新後端依賴...
cd backend
npm install
echo.
echo 更新前端依賴...
cd ../frontend
npm install
cd ..
echo.
echo ✅ 依賴更新完成！
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
echo 選擇要查看的日誌:
echo 1. 前端日誌
echo 2. 後端日誌
echo 3. 返回主選單
echo.
set /p log_choice=請選擇 (1-3): 

if "%log_choice%"=="1" (
    echo 前端日誌通常在瀏覽器控制台中查看
    echo 按 F12 打開開發者工具
) else if "%log_choice%"=="2" (
    echo 後端日誌在後端服務器命令視窗中查看
) else if "%log_choice%"=="3" (
    goto menu
)
pause
goto menu

:clean_cache
echo.
echo 🧹 清理緩存...
echo.
echo 清理 npm 緩存...
npm cache clean --force
echo.
echo 清理前端構建緩存...
if exist "frontend\dist" rmdir /s /q "frontend\dist"
if exist "frontend\.vite" rmdir /s /q "frontend\.vite"
echo.
echo 清理後端構建緩存...
if exist "backend\dist" rmdir /s /q "backend\dist"
echo.
echo ✅ 緩存清理完成！
pause
goto menu

:exit
echo.
echo 👋 感謝使用雲水基材管理系統開發者工具！
timeout /t 2 >nul
exit