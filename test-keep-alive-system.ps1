# 完整的 Keep-Alive 系統測試腳本
param(
    [string]$RenderUrl = $env:RENDER_URL,
    [switch]$BuildBackend = $false,
    [switch]$StartLocal = $false
)

Write-Host "🧪 Keep-Alive 系統完整測試" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# 檢查 URL
if (-not $RenderUrl) {
    Write-Host "⚠️  未提供 Render URL，將測試本地服務器" -ForegroundColor Yellow
    $RenderUrl = "http://localhost:3004"
    $StartLocal = $true
}

Write-Host "📍 測試目標: $RenderUrl" -ForegroundColor Cyan
Write-Host ""

# 如果需要構建後端
if ($BuildBackend) {
    Write-Host "🔨 構建後端服務..." -ForegroundColor Yellow
    Set-Location backend
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 後端構建失敗" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
    Write-Host "✅ 後端構建完成" -ForegroundColor Green
    Write-Host ""
}

# 如果需要啟動本地服務器
if ($StartLocal) {
    Write-Host "🚀 啟動本地後端服務器..." -ForegroundColor Yellow
    
    # 檢查端口是否被占用
    $portCheck = netstat -an | Select-String ":3004"
    if ($portCheck) {
        Write-Host "⚠️  端口 3004 已被占用，嘗試停止現有服務..." -ForegroundColor Yellow
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # 啟動後端服務器（後台運行）
    $env:NODE_ENV = "production"
    Start-Process -FilePath "node" -ArgumentList "backend/dist/server-simple.js" -WindowStyle Hidden
    
    Write-Host "⏳ 等待服務器啟動..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # 檢查服務器是否啟動成功
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3004/health" -Method Get -TimeoutSec 5
        Write-Host "✅ 本地服務器啟動成功" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ 本地服務器啟動失敗: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# 測試 1: 健康檢查
Write-Host "1️⃣ 測試健康檢查端點" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Gray
try {
    $healthUrl = "$RenderUrl/health"
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    
    Write-Host "✅ 健康檢查成功" -ForegroundColor Green
    Write-Host "   狀態: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   運行時間: $([math]::Floor($healthResponse.uptime))秒" -ForegroundColor White
    Write-Host "   環境: $($healthResponse.environment)" -ForegroundColor White
    
    if ($healthResponse.keepAlive) {
        Write-Host "   Keep-Alive 狀態:" -ForegroundColor White
        Write-Host "     - 啟用: $($healthResponse.keepAlive.enabled)" -ForegroundColor Gray
        Write-Host "     - 運行: $($healthResponse.keepAlive.running)" -ForegroundColor Gray
        Write-Host "     - 間隔: $($healthResponse.keepAlive.pingInterval / 1000 / 60)分鐘" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ 健康檢查失敗: $($_.Exception.Message)" -ForegroundColor Red
    if ($StartLocal) {
        Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    }
    exit 1
}
Write-Host ""

# 測試 2: Keep-Alive 狀態端點
Write-Host "2️⃣ 測試 Keep-Alive 狀態端點" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Gray
try {
    $statusUrl = "$RenderUrl/api/keep-alive/status"
    $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec 10
    
    Write-Host "✅ Keep-Alive 狀態檢查成功" -ForegroundColor Green
    Write-Host "   啟用: $($statusResponse.data.enabled)" -ForegroundColor White
    Write-Host "   運行: $($statusResponse.data.running)" -ForegroundColor White
    Write-Host "   基礎URL: $($statusResponse.data.baseUrl)" -ForegroundColor White
    Write-Host "   Ping間隔: $($statusResponse.data.pingInterval / 1000 / 60)分鐘" -ForegroundColor White
}
catch {
    Write-Host "⚠️  Keep-Alive 狀態端點失敗: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 這可能是正常的，如果端點未實現" -ForegroundColor Gray
}
Write-Host ""

# 測試 3: 外部 Keep-Alive 腳本
Write-Host "3️⃣ 測試外部 Keep-Alive 腳本" -ForegroundColor Yellow
Write-Host "-------------------------" -ForegroundColor Gray

if (Test-Path "keep-render-alive.js") {
    Write-Host "📄 找到 Node.js 腳本" -ForegroundColor Green
    
    # 測試 Node.js 腳本（運行 30 秒）
    Write-Host "🧪 測試 Node.js 腳本（30秒）..." -ForegroundColor Cyan
    $nodeProcess = Start-Process -FilePath "node" -ArgumentList "keep-render-alive.js", $RenderUrl -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 30
    Stop-Process -Id $nodeProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Node.js 腳本測試完成" -ForegroundColor Green
}
else {
    Write-Host "⚠️  未找到 keep-render-alive.js" -ForegroundColor Yellow
}

if (Test-Path "keep-render-alive.ps1") {
    Write-Host "📄 找到 PowerShell 腳本" -ForegroundColor Green
}
else {
    Write-Host "⚠️  未找到 keep-render-alive.ps1" -ForegroundColor Yellow
}
Write-Host ""

# 測試 4: 連續 Ping 測試
Write-Host "4️⃣ 連續 Ping 測試（2分鐘）" -ForegroundColor Yellow
Write-Host "----------------------" -ForegroundColor Gray

$endTime = (Get-Date).AddMinutes(2)
$pingCount = 0
$successCount = 0

while ((Get-Date) -lt $endTime) {
    $pingCount++
    $startTime = Get-Date
    
    try {
        $response = Invoke-RestMethod -Uri "$RenderUrl/health" -Method Get -TimeoutSec 10
        $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
        $successCount++
        
        Write-Host "🏓 Ping $pingCount 成功 ($([math]::Round($responseTime))ms)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Ping $pingCount 失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 20
}
Write-Host ""

# 測試結果總結
Write-Host "📊 測試結果總結" -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green
Write-Host "總 Ping 次數: $pingCount" -ForegroundColor White
Write-Host "成功次數: $successCount" -ForegroundColor White
Write-Host "成功率: $([math]::Round(($successCount / $pingCount) * 100, 2))%" -ForegroundColor White
Write-Host ""

if ($successCount -eq $pingCount) {
    Write-Host "🎉 所有測試通過！Keep-Alive 系統工作正常。" -ForegroundColor Green
} elseif ($successCount -gt ($pingCount * 0.8)) {
    Write-Host "⚠️  大部分測試通過，但有一些失敗。請檢查網絡連接。" -ForegroundColor Yellow
} else {
    Write-Host "❌ 多個測試失敗。可能存在服務器或 Keep-Alive 服務問題。" -ForegroundColor Red
}

Write-Host ""
Write-Host "💡 建議:" -ForegroundColor Cyan
Write-Host "1. 在 Render 部署後，內建的 Keep-Alive 服務會自動啟動" -ForegroundColor White
Write-Host "2. 可以運行外部腳本作為額外保障" -ForegroundColor White
Write-Host "3. 定期檢查 /health 和 /api/keep-alive/status 端點" -ForegroundColor White
Write-Host "4. 監控服務器日誌中的 Keep-Alive 相關信息" -ForegroundColor White

# 清理本地服務器
if ($StartLocal) {
    Write-Host ""
    Write-Host "🧹 清理本地服務器..." -ForegroundColor Yellow
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 清理完成" -ForegroundColor Green
}