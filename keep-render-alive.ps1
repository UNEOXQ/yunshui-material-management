# Render Keep-Alive PowerShell 腳本
# 用於防止 Render 免費版自動休眠
#
# 使用方法:
# .\keep-render-alive.ps1 -Url "https://your-app.onrender.com"
# 或
# $env:RENDER_URL="https://your-app.onrender.com"; .\keep-render-alive.ps1

param(
    [string]$Url = $env:RENDER_URL,
    [int]$IntervalMinutes = 5,
    [int]$MaxRetries = 3,
    [int]$TimeoutSeconds = 10
)

# 檢查 URL 參數
if (-not $Url) {
    Write-Host "❌ 錯誤: 請提供目標 URL" -ForegroundColor Red
    Write-Host ""
    Write-Host "使用方法:" -ForegroundColor Yellow
    Write-Host "  .\keep-render-alive.ps1 -Url `"https://your-app.onrender.com`""
    Write-Host ""
    Write-Host "或設置環境變數:" -ForegroundColor Yellow
    Write-Host "  `$env:RENDER_URL=`"https://your-app.onrender.com`""
    Write-Host "  .\keep-render-alive.ps1"
    exit 1
}

# 確保 URL 格式正確
if (-not $Url.StartsWith("http")) {
    $Url = "https://$Url"
}

# 添加 /health 端點
if (-not $Url.Contains("/health")) {
    $Url = $Url.TrimEnd('/') + '/health'
}

$IntervalMs = $IntervalMinutes * 60 * 1000

Write-Host "🚀 Starting Render Keep-Alive Service" -ForegroundColor Green
Write-Host "📍 Target URL: $Url" -ForegroundColor Cyan
Write-Host "⏰ Ping interval: $IntervalMinutes minutes" -ForegroundColor Cyan
Write-Host "🔄 Max retries: $MaxRetries" -ForegroundColor Cyan
Write-Host "⏱️  Timeout: $TimeoutSeconds seconds" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Keep-alive service started successfully" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Ping 函數
function Invoke-KeepAlivePing {
    param([string]$TargetUrl, [int]$Retries, [int]$Timeout)
    
    $startTime = Get-Date
    
    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            $response = Invoke-RestMethod -Uri $TargetUrl -Method Get -TimeoutSec $Timeout -Headers @{
                'User-Agent' = 'RenderKeepAlive-PowerShell/1.0'
                'Accept' = 'application/json'
            }
            
            $responseTime = ((Get-Date) - $startTime).TotalMilliseconds
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            
            Write-Host "🏓 Ping successful ($([math]::Round($responseTime))ms) - $timestamp" -ForegroundColor Green
            
            if ($response.status) {
                $uptime = if ($response.uptime) { [math]::Floor($response.uptime) } else { 0 }
                Write-Host "📊 Server status: $($response.status), uptime: ${uptime}s" -ForegroundColor Cyan
            }
            
            return $true
        }
        catch {
            $errorMessage = $_.Exception.Message
            
            if ($attempt -lt $Retries) {
                Write-Host "⚠️  Ping failed (attempt $attempt/$Retries): $errorMessage" -ForegroundColor Yellow
                Write-Host "🔄 Retrying in 30 seconds..." -ForegroundColor Yellow
                Start-Sleep -Seconds 30
            }
            else {
                $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                Write-Host "❌ Ping failed after $Retries attempts: $errorMessage" -ForegroundColor Red
                Write-Host "🕐 $timestamp" -ForegroundColor Red
            }
        }
    }
    
    return $false
}

# 主循環
try {
    # 立即執行一次 ping
    Invoke-KeepAlivePing -TargetUrl $Url -Retries $MaxRetries -Timeout $TimeoutSeconds
    
    # 開始定時 ping
    while ($true) {
        Start-Sleep -Milliseconds $IntervalMs
        Invoke-KeepAlivePing -TargetUrl $Url -Retries $MaxRetries -Timeout $TimeoutSeconds
    }
}
catch {
    Write-Host ""
    Write-Host "🛑 Keep-alive service stopped" -ForegroundColor Yellow
    exit 0
}
finally {
    Write-Host ""
    Write-Host "🛑 Keep-alive service terminated" -ForegroundColor Yellow
}