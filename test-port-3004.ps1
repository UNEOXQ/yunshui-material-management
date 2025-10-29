# Test Port 3004 (correct backend)
Write-Host "Testing Port 3004 (correct backend)..." -ForegroundColor Cyan

# Test login with Jeffrey
Write-Host "1. Testing login with Jeffrey..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Jeffrey login successful" -ForegroundColor Green
        $jeffreyToken = $loginResponse.data.token
        
        # Test Jeffrey's orders
        $jeffreyOrders = Invoke-RestMethod -Uri "http://192.168.68.103:3004/api/orders" -Method GET -Headers @{
            "Authorization" = "Bearer $jeffreyToken"
        }
        Write-Host "📊 Jeffrey can see $($jeffreyOrders.data.orders.Count) orders" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Jeffrey login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test login with Mark (warehouse)
Write-Host "`n2. Testing login with Mark (warehouse)..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "warehouse001"
        password = "wh123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Mark login successful" -ForegroundColor Green
        Write-Host "User ID: $($loginResponse.data.user.userId)" -ForegroundColor Gray
        Write-Host "Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        $markToken = $loginResponse.data.token
        
        # Test Mark's orders
        $markOrders = Invoke-RestMethod -Uri "http://192.168.68.103:3004/api/orders" -Method GET -Headers @{
            "Authorization" = "Bearer $markToken"
        }
        Write-Host "📊 Mark can see $($markOrders.data.orders.Count) orders" -ForegroundColor Gray
        
        if ($markOrders.data.orders.Count -gt 0) {
            Write-Host "First order: $($markOrders.data.orders[0].id) - Status: $($markOrders.data.orders[0].status)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Mark login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Port 3004 test completed!" -ForegroundColor Cyan