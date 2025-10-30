# 緊急本地測試腳本
Write-Host "🚨 啟動緊急本地測試..." -ForegroundColor Red

try {
    # 檢查當前目錄
    $currentDir = Get-Location
    Write-Host "📍 當前目錄: $currentDir" -ForegroundColor Cyan
    
    # 檢查是否存在 backend 和 frontend 目錄
    if (-not (Test-Path "backend")) {
        Write-Host "❌ 找不到 backend 目錄！" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出..."
        exit
    }
    
    if (-not (Test-Path "frontend")) {
        Write-Host "❌ 找不到 frontend 目錄！" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出..."
        exit
    }

    # 停止可能運行的服務
    Write-Host "🛑 停止現有服務..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2

    # 啟動後端
    Write-Host "🚀 啟動後端服務..." -ForegroundColor Green
    $backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$currentDir\backend'; npm start" -PassThru

    # 等待後端啟動
    Write-Host "⏳ 等待後端啟動..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # 啟動前端
    Write-Host "🚀 啟動前端服務..." -ForegroundColor Green
    $frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$currentDir\frontend'; npm run dev" -PassThru

    # 等待前端啟動
    Write-Host "⏳ 等待前端啟動..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8

    # 打開瀏覽器
    Write-Host "🌐 打開本地測試頁面..." -ForegroundColor Cyan
    Start-Process "http://localhost:5173"

    Write-Host "✅ 本地測試環境已啟動！" -ForegroundColor Green
    Write-Host "📝 請在本地環境測試專案創建功能" -ForegroundColor Yellow
    Write-Host "🔍 如果本地正常工作，說明代碼沒問題，只是線上部署有問題" -ForegroundColor Cyan

    # 創建測試指令
    Write-Host "`n📋 測試步驟:" -ForegroundColor Yellow
    Write-Host "1. 打開 http://localhost:5173" -ForegroundColor White
    Write-Host "2. 進入材料選擇頁面" -ForegroundColor White
    Write-Host "3. 添加材料到購物車" -ForegroundColor White
    Write-Host "4. 嘗試創建新專案" -ForegroundColor White
    Write-Host "5. 檢查 F12 Console 輸出" -ForegroundColor White
    Write-Host "`n🔍 預期看到的 Console 輸出:" -ForegroundColor Cyan
    Write-Host "📋 載入專案列表..." -ForegroundColor Gray
    Write-Host "✅ 專案列表載入成功: X 個專案" -ForegroundColor Gray
    Write-Host "🏗️ 創建新專案: [專案名稱]" -ForegroundColor Gray
    Write-Host "✅ 專案創建成功: {...}" -ForegroundColor Gray

    Write-Host "`n⚠️  如果要停止服務，請關閉彈出的 PowerShell 視窗" -ForegroundColor Yellow
    Read-Host "`n按 Enter 鍵結束此腳本（服務會繼續運行）..."
}
catch {
    Write-Host "❌ 發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出..."
}