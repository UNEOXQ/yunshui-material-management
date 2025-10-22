# Check Render deployment status
Write-Host "Checking Render backend deployment status..." -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "https://yunshui-material-management.onrender.com/health" -Method GET
    
    Write-Host "Backend service is running" -ForegroundColor Green
    Write-Host "Version: $($response.version)" -ForegroundColor Cyan
    Write-Host "Timestamp: $($response.timestamp)" -ForegroundColor Cyan
    Write-Host "Memory DB Enhanced: $($response.memoryDbEnhanced)" -ForegroundColor Cyan
    Write-Host "Auto Save Interval: $($response.autoSaveInterval)" -ForegroundColor Cyan
    
    if ($response.version -eq "1.0.1-memory-db-fix") {
        Write-Host "New version deployed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Version may not be updated yet. Current: $($response.version)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "Cannot connect to Render backend service" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Check completed." -ForegroundColor Green