Write-Host "Testing mobile access..." -ForegroundColor Green

# Test backend health
Write-Host "1. Testing backend health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://192.168.68.95:3004/health" -Method GET -TimeoutSec 10
    Write-Host "Backend health OK - Version: $($response.version)" -ForegroundColor Green
} catch {
    Write-Host "Backend health FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

# Test CORS
Write-Host "2. Testing CORS..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://192.168.68.95:3000'
        'Content-Type' = 'application/json'
    }
    
    $body = '{"username":"admin","password":"admin123"}'
    $response = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Headers $headers -Body $body -TimeoutSec 10
    
    Write-Host "CORS test OK - User: $($response.data.user.username)" -ForegroundColor Green
} catch {
    Write-Host "CORS test FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed. Access: http://192.168.68.95:3000" -ForegroundColor Cyan