Write-Host "Cleaning port 3004 and preparing backend..." -ForegroundColor Green

# Stop any process using port 3004
$connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port 3004 cleaned" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host "Ready to start backend server!" -ForegroundColor Green
Write-Host "Run: cd backend" -ForegroundColor Cyan
Write-Host "Then: npm run dev" -ForegroundColor Cyan