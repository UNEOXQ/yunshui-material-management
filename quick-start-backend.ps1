Write-Host "Quick Start Backend..." -ForegroundColor Green

# Clean port
$connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Port 3004 cleaned" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

# Check TypeScript
Set-Location backend
$compileResult = & npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript OK" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript Error" -ForegroundColor Red
    Write-Host $compileResult -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host "✅ Ready to start backend!" -ForegroundColor Green
Write-Host "Run: npm run dev" -ForegroundColor Cyan
Set-Location ..