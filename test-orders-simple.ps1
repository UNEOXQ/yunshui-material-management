# Test Orders API
Write-Host "Testing Orders API..." -ForegroundColor Cyan

# Test login
Write-Host "1. Testing login..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "Login successful" -ForegroundColor Green
        $token = $loginResponse.data.token
    } else {
        Write-Host "Login failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test get all orders
Write-Host "2. Testing get all orders..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($ordersResponse.success) {
        Write-Host "Get orders successful" -ForegroundColor Green
        Write-Host "Order count: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        
        foreach ($order in $ordersResponse.data.orders) {
            Write-Host "Order $($order.id): type=$($order.type), status=$($order.status), items=$($order.items.Count)" -ForegroundColor Gray
        }
    } else {
        Write-Host "Get orders failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Get orders request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Test completed!" -ForegroundColor Cyan