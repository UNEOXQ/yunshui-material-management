@echo off
echo 啟動雲水基材管理系統...
echo.

REM 停止可能運行的服務
echo 清理現有進程...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 啟動後端服務...
cd backend
start "後端服務" cmd /k "npm run dev"

echo 等待後端啟動...
timeout /t 5 >nul

echo 啟動前端服務...
cd ../frontend
start "前端服務" cmd /k "npm run dev"

echo.
echo 服務啟動中...
echo 前端: http://localhost:3002/
echo 後端: http://localhost:3004/
echo.
pause