Write-Host "Testing CORS..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "Backend is running: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Backend not running" -ForegroundColor Red
    exit 1
}

$testUrl = "http://localhost:3004/uploads/materials/LOGO-1760471119261-231160952.png"
try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 3
    Write-Host "Image request successful: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Image request failed" -ForegroundColor Red
}