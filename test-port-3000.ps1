# Test Port 3000 directly
Write-Host "Testing Port 3000 directly..." -ForegroundColor Cyan

# Test health endpoint
Write-Host "1. Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/health" -TimeoutSec 5
    Write-Host "✅ Health check successful" -ForegroundColor Green
    Write-Host "Response: $($healthResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test login with Jeffrey
Write-Host "`n2. Testing login with Jeffrey..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Jeffrey login successful" -ForegroundColor Green
        $jeffreyToken = $loginResponse.data.token
        
        # Test Jeffrey's orders
        $jeffreyOrders = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/orders" -Method GET -Headers @{
            "Authorization" = "Bearer $jeffreyToken"
        }
        Write-Host "📊 Jeffrey can see $($jeffreyOrders.data.orders.Count) orders" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Jeffrey login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test login with Mark (warehouse)
Write-Host "`n3. Testing login with Mark (warehouse)..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "warehouse001"
        password = "wh123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Mark login successful" -ForegroundColor Green
        $markToken = $loginResponse.data.token
        
        # Test Mark's orders
        $markOrders = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/orders" -Method GET -Headers @{
            "Authorization" = "Bearer $markToken"
        }
        Write-Host "📊 Mark can see $($markOrders.data.orders.Count) orders" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Mark login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Port 3000 test completed!" -ForegroundColor Cyan