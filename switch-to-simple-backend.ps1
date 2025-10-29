# 切換到簡化後端服務器 (適用於手機應用)

Write-Host ""
Write-Host "🔄 切換到簡化後端服務器 (適用於手機應用)" -ForegroundColor Cyan
Write-Host ""

# 停止現有的Node.js進程
Write-Host "📋 1. 停止當前後端服務..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "發現 $($nodeProcesses.Count) 個 Node.js 進程，正在停止..." -ForegroundColor Gray
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ 已停止現有 Node.js 進程" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ 沒有發現運行中的 Node.js 進程" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ 停止進程時發生錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 清理端口3004
Write-Host ""
Write-Host "📋 2. 清理端口 3004..." -ForegroundColor Yellow
try {
    $portConnections = netstat -ano | Select-String ":3004"
    if ($portConnections) {
        Write-Host "端口 3004 被占用，正在清理..." -ForegroundColor Gray
        $portConnections | ForEach-Object {
            $line = $_.Line
            $pid = ($line -split '\s+')[-1]
            if ($pid -match '^\d+$') {
                try {
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                } catch {
                    # 忽略錯誤
                }
            }
        }
        Write-Host "✅ 端口 3004 已清理" -ForegroundColor Green
    } else {
        Write-Host "ℹ️ 端口 3004 未被占用" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️ 清理端口時發生錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 切換到backend目錄
Write-Host ""
Write-Host "📋 3. 啟動簡化服務器..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Host "當前目錄: $(Get-Location)" -ForegroundColor Gray
} else {
    Write-Host "❌ 錯誤: 找不到 backend 目錄" -ForegroundColor Red
    Read-Host "按 Enter 鍵退出"
    exit 1
}

# 檢查simple-server.js是否存在
if (-not (Test-Path "simple-server.js")) {
    Write-Host "❌ 錯誤: 找不到 simple-server.js" -ForegroundColor Red
    Write-Host "請確保在正確的目錄中執行此腳本" -ForegroundColor Yellow
    Read-Host "按 Enter 鍵退出"
    exit 1
}

Write-Host "🚀 啟動簡化服務器 (包含手機應用所需的訂單數據)..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 簡化服務器特點:" -ForegroundColor Cyan
Write-Host "  - 包含測試訂單數據 (3個訂單)" -ForegroundColor Gray
Write-Host "  - 支援手機應用的API格式" -ForegroundColor Gray
Write-Host "  - 無需數據庫配置" -ForegroundColor Gray
Write-Host "  - 適合開發和測試" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 API端點:" -ForegroundColor Cyan
Write-Host "  - 登入: http://192.168.68.95:3004/api/auth/login" -ForegroundColor Gray
Write-Host "  - 訂單: http://192.168.68.95:3004/api/orders" -ForegroundColor Gray
Write-Host "  - 材料: http://192.168.68.95:3004/api/materials" -ForegroundColor Gray
Write-Host ""

# 啟動簡化服務器
try {
    node simple-server.js
} catch {
    Write-Host "❌ 啟動服務器時發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "👋 簡化服務器已停止" -ForegroundColor Cyan
Read-Host "按 Enter 鍵退出"