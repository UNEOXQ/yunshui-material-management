Write-Host "Testing image proxy..." -ForegroundColor Green

# Test direct backend access
$backendUrl = "http://localhost:3004/uploads/materials/LOGO-1760475135350-196807851.png"
Write-Host "Testing backend direct access: $backendUrl" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $backendUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend direct access: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend direct access failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test frontend proxy access
$proxyUrl = "http://localhost:3000/uploads/materials/LOGO-1760475135350-196807851.png"
Write-Host "Testing frontend proxy access: $proxyUrl" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $proxyUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend proxy access: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend proxy access failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed" -ForegroundColor Cyan