# 測試 Keep-Alive 功能
param(
    [string]$Url = $env:RENDER_URL,
    [int]$TestDuration = 2  # 測試持續時間（分鐘）
)

if (-not $Url) {
    Write-Host "❌ 請提供測試 URL" -ForegroundColor Red
    Write-Host "使用方法: .\test-keep-alive.ps1 -Url 'https://your-app.onrender.com'" -ForegroundColor Yellow
    exit 1
}

# 確保 URL 格式正確
if (-not $Url.StartsWith("http")) {
    $Url = "https://$Url"
}

$healthUrl = $Url.TrimEnd('/') + '/health'
$keepAliveStatusUrl = $Url.TrimEnd('/') + '/api/keep-alive/status'

Write-Host "🧪 Testing Keep-Alive Functionality" -ForegroundColor Green
Write-Host "📍 Target URL: $Url" -ForegroundColor Cyan
Write-Host "⏱️  Test duration: $TestDuration minutes" -ForegroundColor Cyan
Write-Host ""

# 測試健康檢查端點
Write-Host "1️⃣ Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
    Write-Host "✅ Health endpoint accessible" -ForegroundColor Green
    Write-Host "📊 Server status: $($healthResponse.status)" -ForegroundColor Cyan
    Write-Host "🕐 Server uptime: $([math]::Floor($healthResponse.uptime))s" -ForegroundColor Cyan
    
    if ($healthResponse.keepAlive) {
        Write-Host "🔄 Keep-alive service status:" -ForegroundColor Cyan
        Write-Host "   - Enabled: $($healthResponse.keepAlive.enabled)" -ForegroundColor White
        Write-Host "   - Running: $($healthResponse.keepAlive.running)" -ForegroundColor White
        Write-Host "   - Base URL: $($healthResponse.keepAlive.baseUrl)" -ForegroundColor White
        Write-Host "   - Ping interval: $($healthResponse.keepAlive.pingInterval / 1000 / 60) minutes" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 測試 keep-alive 狀態端點
Write-Host "2️⃣ Testing keep-alive status endpoint..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri $keepAliveStatusUrl -Method Get -TimeoutSec 10
    Write-Host "✅ Keep-alive status endpoint accessible" -ForegroundColor Green
    Write-Host "📊 Service status: $($statusResponse.data.enabled)" -ForegroundColor Cyan
    Write-Host "🏃 Service running: $($statusResponse.data.running)" -ForegroundColor Cyan
}
catch {
    Write-Host "⚠️  Keep-alive status endpoint failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 This might be normal if the endpoint is not implemented" -ForegroundColor Gray
}

Write-Host ""

# 連續測試
Write-Host "3️⃣ Running continuous ping test for $TestDuration minutes..." -ForegroundColor Yellow
$endTime = (Get-Date).AddMinutes($TestDuration)
$pingCount = 0
$successCount = 0

while ((Get-Date) -lt $endTime) {
    $pingCount++
    $startTime = Get-Date
    
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 10
        $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
        $successCount++
        
        Write-Host "🏓 Ping $pingCount successful ($([math]::Round($responseTime))ms) - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Ping $pingCount failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # 等待 30 秒
    Start-Sleep -Seconds 30
}

Write-Host ""
Write-Host "📊 Test Results:" -ForegroundColor Green
Write-Host "   - Total pings: $pingCount" -ForegroundColor White
Write-Host "   - Successful pings: $successCount" -ForegroundColor White
Write-Host "   - Success rate: $([math]::Round(($successCount / $pingCount) * 100, 2))%" -ForegroundColor White

if ($successCount -eq $pingCount) {
    Write-Host "✅ All tests passed! Keep-alive functionality is working correctly." -ForegroundColor Green
} elseif ($successCount -gt ($pingCount * 0.8)) {
    Write-Host "⚠️  Most tests passed, but there were some failures. Check your network connection." -ForegroundColor Yellow
} else {
    Write-Host "❌ Many tests failed. There might be an issue with the server or keep-alive service." -ForegroundColor Red
}