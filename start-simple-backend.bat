@echo off
echo 啟動簡單後端服務器...
echo.
echo 注意：這會使用 simple-server.js 而不是 TypeScript 後端
echo 簡單服務器包含完整的狀態管理 API
echo.
cd backend
node simple-server.js
pause