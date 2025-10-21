@echo off
echo 測試 TypeScript 後端服務器...
echo.
echo 1. 停止所有 Node.js 進程
taskkill /f /im node.exe 2>nul

echo.
echo 2. 啟動 TypeScript 後端
cd backend
start "TypeScript Backend" cmd /k "echo TypeScript 後端服務器 && npm run dev"

echo.
echo 3. 等待服務器啟動...
timeout /t 10

echo.
echo 4. 測試健康檢查
curl -s http://localhost:3004/health

echo.
echo 5. 啟動前端 (請在另一個終端手動運行)
echo    cd frontend
echo    npm run dev

echo.
echo TypeScript 後端已啟動，請測試狀態管理功能
pause