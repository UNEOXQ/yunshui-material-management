# 緊急本地測試腳本
Write-Host "🚨 啟動緊急本地測試..." -ForegroundColor Red

# 停止可能運行的服務
Write-Host "🛑 停止現有服務..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 啟動後端
Write-Host "🚀 啟動後端服務..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal

# 等待後端啟動
Write-Host "⏳ 等待後端啟動..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 啟動前端
Write-Host "🚀 啟動前端服務..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

# 等待前端啟動
Write-Host "⏳ 等待前端啟動..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 打開瀏覽器
Write-Host "🌐 打開本地測試頁面..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "✅ 本地測試環境已啟動！" -ForegroundColor Green
Write-Host "📝 請在本地環境測試專案創建功能" -ForegroundColor Yellow
Write-Host "🔍 如果本地正常工作，說明代碼沒問題，只是線上部署有問題" -ForegroundColor Cyan

# 創建測試指令
Write-Host "📋 測試步驟:" -ForegroundColor Yellow
Write-Host "1. 打開 http://localhost:5173" -ForegroundColor White
Write-Host "2. 進入材料選擇頁面" -ForegroundColor White
Write-Host "3. 添加材料到購物車" -ForegroundColor White
Write-Host "4. 嘗試創建新專案" -ForegroundColor White
Write-Host "5. 檢查 F12 Console 輸出" -ForegroundColor White

Read-Host "按 Enter 鍵結束..."