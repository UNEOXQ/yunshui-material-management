@echo off
echo 🚀 啟動雲水基材管理系統
echo ================================

echo 📦 檢查依賴...
cd backend
if not exist node_modules (
    echo 安裝後端依賴...
    npm install
)

cd ../frontend
if not exist node_modules (
    echo 安裝前端依賴...
    npm install
)

echo 🔧 啟動後端服務...
cd ../backend
start "後端服務" cmd /k "npm run dev"

timeout /t 3 /nobreak > nul

echo 🎨 啟動前端服務...
cd ../frontend
start "前端服務" cmd /k "npm run dev"

echo ✅ 系統啟動完成！
echo.
echo 📱 前端應用: http://localhost:3002/
echo 🔧 後端 API: http://localhost:3004/
echo 📊 健康檢查: http://localhost:3004/health
echo.
echo 💡 提示：
echo - 前端和後端會在新的命令視窗中運行
echo - 關閉命令視窗即可停止對應服務
echo - 使用演示帳號快速登入系統
echo.
pause