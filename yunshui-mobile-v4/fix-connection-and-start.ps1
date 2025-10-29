# 修復手機應用連接問題並啟動

Write-Host ""
Write-Host "🔧 修復手機應用連接問題" -ForegroundColor Cyan
Write-Host ""

# 檢查是否在正確目錄
if (-not (Test-Path "App.tsx")) {
    Write-Host "❌ 錯誤: 請在 yunshui-mobile-v4 目錄中執行此腳本" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查新的後端連接
Write-Host "📋 1. 檢查新的後端連接 (192.168.68.103:3000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://192.168.68.103:3000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ 後端連接正常 (192.168.68.103:3000)" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務器未運行在 192.168.68.103:3000" -ForegroundColor Red
    Write-Host "💡 請確保後端正在運行: cd backend && npm run dev" -ForegroundColor Yellow
    Write-Host ""
    $choice = Read-Host "是否繼續啟動手機應用? (y/n)"
    if ($choice -ne "y" -and $choice -ne "Y") {
        exit 1
    }
}

# 清理緩存
Write-Host ""
Write-Host "📋 2. 清理緩存和重置..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Write-Host "🧹 清理 .expo 緩存..." -ForegroundColor Gray
    Remove-Item -Recurse -Force ".expo"
}

if (Test-Path "node_modules\.cache") {
    Write-Host "🧹 清理 node_modules 緩存..." -ForegroundColor Gray
    Remove-Item -Recurse -Force "node_modules\.cache"
}

# 檢查依賴
Write-Host ""
Write-Host "📋 3. 檢查依賴..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安裝依賴..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
}

# 顯示修復信息
Write-Host ""
Write-Host "📋 4. 修復網路配置..." -ForegroundColor Yellow
Write-Host "💡 API已更新為: http://192.168.68.103:3000/api" -ForegroundColor Gray
Write-Host "💡 確保手機和電腦在同一WiFi網路" -ForegroundColor Gray

Write-Host ""
Write-Host "🚀 5. 啟動應用 (使用隧道模式解決連接問題)..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 手機操作步驟:" -ForegroundColor Cyan
Write-Host "1. 確保手機和電腦在同一WiFi" -ForegroundColor Gray
Write-Host "2. 在Expo Go中掃描新的QR碼" -ForegroundColor Gray
Write-Host "3. 如果仍有連接問題，嘗試重啟Expo Go應用" -ForegroundColor Gray
Write-Host ""

# 使用隧道模式啟動，解決Metro連接問題
try {
    npx expo start --tunnel --clear
} catch {
    Write-Host "❌ 啟動失敗" -ForegroundColor Red
}

Write-Host ""
Write-Host "👋 應用已關閉" -ForegroundColor Cyan
Read-Host "按 Enter 鍵退出"