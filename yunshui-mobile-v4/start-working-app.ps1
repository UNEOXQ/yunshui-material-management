# 雲水基材管理系統 - 手機版啟動腳本 (成功版本)
# yunshui-mobile-v4 - Expo SDK 54

Write-Host ""
Write-Host "🏗️ 雲水基材管理系統 - 手機版 (yunshui-mobile-v4)" -ForegroundColor Cyan
Write-Host "✅ 這是之前測試成功的版本" -ForegroundColor Green
Write-Host ""

# 檢查是否在正確目錄
if (-not (Test-Path "App.tsx")) {
    Write-Host "❌ 錯誤: 請在 yunshui-mobile-v4 目錄中執行此腳本" -ForegroundColor Red
    Write-Host "💡 請執行: cd yunshui-mobile-v4" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查後端連接
Write-Host "📋 檢查後端連接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.68.103:3004/api/materials" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 後端連接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務器未運行" -ForegroundColor Red
    Write-Host "💡 請先啟動後端: cd backend && node simple-server.js" -ForegroundColor Yellow
    Write-Host ""
    $choice = Read-Host "是否繼續啟動手機應用? (y/n)"
    if ($choice -ne "y" -and $choice -ne "Y") {
        exit 1
    }
}

Write-Host ""
Write-Host "📱 手機操作步驟:" -ForegroundColor Cyan
Write-Host "1. 安裝 Expo Go 應用"
Write-Host "2. 確保手機和電腦在同一WiFi"
Write-Host "3. 掃描QR碼或輸入URL"
Write-Host ""

# 檢查並安裝依賴
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安裝依賴中..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
}

Write-Host "🚀 使用成功的啟動參數: --tunnel --clear" -ForegroundColor Green
Write-Host "💡 這是之前測試成功的配置" -ForegroundColor Yellow
Write-Host ""

# 使用成功的啟動參數
try {
    npx expo start --tunnel --clear
} catch {
    Write-Host "❌ 啟動失敗" -ForegroundColor Red
}

Write-Host ""
Write-Host "👋 應用已關閉" -ForegroundColor Cyan
Read-Host "按 Enter 鍵退出"