# 雲水基材管理系統 - PowerShell 停止腳本

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "雲水基材管理系統 - 停止服務"

Write-Host "🛑 雲水基材管理系統 - 停止服務" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red
Write-Host ""

# 停止占用端口 3004 的進程（後端）
Write-Host "🔧 停止後端服務 (端口 3004)..." -ForegroundColor Yellow
try {
    $port3004Connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
    if ($port3004Connections) {
        $port3004Connections | ForEach-Object {
            $processId = $_.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "終止進程: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "✅ 後端服務已停止" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  端口 3004 未被占用" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  停止後端服務時發生錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 停止占用端口 3000 的進程（前端）
Write-Host "🎨 停止前端服務 (端口 3000)..." -ForegroundColor Yellow
try {
    $port3000Connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000Connections) {
        $port3000Connections | ForEach-Object {
            $processId = $_.OwningProcess
            $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "終止進程: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "✅ 前端服務已停止" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  端口 3000 未被占用" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  停止前端服務時發生錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 清理可能殘留的 Node.js 進程
Write-Host "🔍 清理 Node.js 進程..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "發現 $($nodeProcesses.Count) 個 Node.js 進程，正在清理..." -ForegroundColor Cyan
        $nodeProcesses | ForEach-Object {
            Write-Host "終止 Node.js 進程 (PID: $($_.Id))" -ForegroundColor Cyan
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✅ Node.js 進程清理完成" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  未發現 Node.js 進程" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  清理 Node.js 進程時發生錯誤: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 等待進程完全停止
Write-Host "⏳ 等待服務完全停止..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 驗證端口是否已釋放
Write-Host "🔍 驗證端口狀態..." -ForegroundColor Yellow
$port3004Check = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
$port3000Check = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue

if (-not $port3004Check) {
    Write-Host "✅ 端口 3004 已釋放" -ForegroundColor Green
} else {
    Write-Host "⚠️  端口 3004 仍被占用" -ForegroundColor Yellow
}

if (-not $port3000Check) {
    Write-Host "✅ 端口 3000 已釋放" -ForegroundColor Green
} else {
    Write-Host "⚠️  端口 3000 仍被占用" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ 雲水基材管理系統已停止" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 如需重新啟動，請運行:" -ForegroundColor Cyan
Write-Host "   start-system-fixed.bat 或 start-system-fixed.ps1" -ForegroundColor White
Write-Host ""
Read-Host "按 Enter 鍵退出"