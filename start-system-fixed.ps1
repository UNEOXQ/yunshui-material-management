# 雲水基材管理系統 - PowerShell 啟動腳本
# 處理中文路徑和 Unicode 字符

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "雲水基材管理系統 - 啟動器"

Write-Host "🚀 雲水基材管理系統 - PowerShell 啟動器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 獲取當前目錄
$CurrentDir = Get-Location
Write-Host "📍 當前工作目錄: $CurrentDir" -ForegroundColor Cyan
Write-Host ""

# 檢查目錄結構
if (-not (Test-Path "backend")) {
    Write-Host "❌ 錯誤: 找不到 backend 目錄" -ForegroundColor Red
    Write-Host "請確保在正確的專案根目錄執行此腳本" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "❌ 錯誤: 找不到 frontend 目錄" -ForegroundColor Red
    Write-Host "請確保在正確的專案根目錄執行此腳本" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查 Node.js 環境
Write-Host "🔍 檢查 Node.js 環境..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 錯誤: 未找到 Node.js" -ForegroundColor Red
    Write-Host "請先安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查並安裝後端依賴
Write-Host ""
Write-Host "📦 檢查後端依賴..." -ForegroundColor Yellow
Set-Location "backend"
if (-not (Test-Path "node_modules")) {
    Write-Host "🔧 安裝後端依賴..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ 後端依賴安裝完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 後端依賴安裝失敗" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
} else {
    Write-Host "✅ 後端依賴已存在" -ForegroundColor Green
}

# 檢查並安裝前端依賴
Write-Host ""
Write-Host "📦 檢查前端依賴..." -ForegroundColor Yellow
Set-Location "../frontend"
if (-not (Test-Path "node_modules")) {
    Write-Host "🔧 安裝前端依賴..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "✅ 前端依賴安裝完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 前端依賴安裝失敗" -ForegroundColor Red
        Read-Host "按 Enter 鍵退出"
        exit 1
    }
} else {
    Write-Host "✅ 前端依賴已存在" -ForegroundColor Green
}

Set-Location ".."

# 檢查端口占用
Write-Host ""
Write-Host "🔍 檢查端口狀態..." -ForegroundColor Yellow

$port3004 = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
if ($port3004) {
    Write-Host "⚠️  警告: 端口 3004 已被占用，正在終止相關進程..." -ForegroundColor Yellow
    $port3004 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  警告: 端口 3000 已被占用，正在終止相關進程..." -ForegroundColor Yellow
    $port3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# 創建上傳目錄
Write-Host ""
Write-Host "📁 準備上傳目錄..." -ForegroundColor Yellow
if (-not (Test-Path "uploads")) { New-Item -ItemType Directory -Path "uploads" | Out-Null }
if (-not (Test-Path "uploads/materials")) { New-Item -ItemType Directory -Path "uploads/materials" | Out-Null }
Write-Host "✅ 上傳目錄準備完成" -ForegroundColor Green

# 啟動後端服務
Write-Host ""
Write-Host "🔧 啟動後端服務..." -ForegroundColor Yellow
Set-Location "backend"
$backendJob = Start-Process -FilePath "cmd" -ArgumentList "/k", "title 雲水系統-後端服務 && echo 🔧 後端服務啟動中... && npm run dev" -PassThru
Set-Location ".."

# 等待後端服務啟動
Write-Host "⏳ 等待後端服務啟動..." -ForegroundColor Yellow
$maxAttempts = 20
$attempt = 0
do {
    Start-Sleep -Seconds 3
    $attempt++
    Write-Host "🔍 檢查後端服務狀態 (嘗試 $attempt/$maxAttempts)..." -ForegroundColor Cyan
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 後端服務啟動成功" -ForegroundColor Green
            break
        }
    } catch {
        if ($attempt -eq $maxAttempts) {
            Write-Host "❌ 後端服務啟動超時" -ForegroundColor Red
            Write-Host "請檢查後端服務窗口的錯誤信息" -ForegroundColor Yellow
        }
    }
} while ($attempt -lt $maxAttempts)

# 啟動前端服務
Write-Host ""
Write-Host "🎨 啟動前端服務..." -ForegroundColor Yellow
Set-Location "frontend"
$frontendJob = Start-Process -FilePath "cmd" -ArgumentList "/k", "title 雲水系統-前端服務 && echo 🎨 前端服務啟動中... && npm run dev" -PassThru
Set-Location ".."

# 等待前端服務啟動
Write-Host "⏳ 等待前端服務啟動..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# 顯示系統信息
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ 雲水基材管理系統啟動完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 系統訪問地址:" -ForegroundColor Cyan
Write-Host "   前端應用: http://localhost:3000/" -ForegroundColor White
Write-Host "   後端 API: http://localhost:3004/" -ForegroundColor White
Write-Host "   健康檢查: http://localhost:3004/health" -ForegroundColor White
Write-Host ""
Write-Host "📊 API 端點:" -ForegroundColor Cyan
Write-Host "   🔐 認證: http://localhost:3004/api/auth" -ForegroundColor White
Write-Host "   👥 用戶: http://localhost:3004/api/users" -ForegroundColor White
Write-Host "   📦 材料: http://localhost:3004/api/materials" -ForegroundColor White
Write-Host "   🛒 訂單: http://localhost:3004/api/orders" -ForegroundColor White
Write-Host "   📤 上傳: http://localhost:3004/api/upload" -ForegroundColor White
Write-Host "   📊 狀態: http://localhost:3004/api/status" -ForegroundColor White
Write-Host "   ❌ 錯誤: http://localhost:3004/api/errors" -ForegroundColor White
Write-Host ""
Write-Host "🎭 演示帳號:" -ForegroundColor Cyan
Write-Host "   管理員: admin / admin123" -ForegroundColor White
Write-Host "   專案經理: pm001 / pm123" -ForegroundColor White
Write-Host "   區域經理: am001 / am123" -ForegroundColor White
Write-Host "   倉庫管理: warehouse001 / wh123" -ForegroundColor White
Write-Host ""
Write-Host "💡 使用提示:" -ForegroundColor Cyan
Write-Host "   - 前端和後端在獨立窗口運行" -ForegroundColor White
Write-Host "   - 關閉對應窗口可停止服務" -ForegroundColor White
Write-Host "   - 修改代碼後會自動重載" -ForegroundColor White
Write-Host "   - 圖片上傳功能已啟用" -ForegroundColor White
Write-Host ""
Write-Host "🛑 停止系統: 運行 stop-system-fixed.ps1" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

# 嘗試打開瀏覽器
Write-Host ""
Write-Host "🌐 正在打開瀏覽器..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
try {
    Start-Process "http://localhost:3000/"
} catch {
    Write-Host "⚠️  無法自動打開瀏覽器，請手動訪問: http://localhost:3000/" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "按 Enter 鍵關閉此窗口"