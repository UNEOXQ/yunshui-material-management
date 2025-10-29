# Test Orders API Details
Write-Host "Testing Orders API Details..." -ForegroundColor Cyan

# Test login with pm001
Write-Host "1. Testing login with pm001..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "Login successful - User: $($loginResponse.data.user.username), Role: $($loginResponse.data.user.role)" -ForegroundColor Green
        $token = $loginResponse.data.token
    } else {
        Write-Host "Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test orders API
Write-Host "`n2. Testing orders API details..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($ordersResponse.success) {
        Write-Host "✅ Orders API successful" -ForegroundColor Green
        Write-Host "Total orders: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        
        Write-Host "`nOrder details:" -ForegroundColor Cyan
        foreach ($order in $ordersResponse.data.orders) {
            Write-Host "  📋 Order $($order.id):" -ForegroundColor White
            Write-Host "    - User: $($order.userId)" -ForegroundColor Gray
            Write-Host "    - Status: $($order.status)" -ForegroundColor Gray
            Write-Host "    - Amount: $($order.totalAmount)" -ForegroundColor Gray
            Write-Host "    - Items: $($order.items.Count)" -ForegroundColor Gray
            if ($order.items -and $order.items.Count -gt 0) {
                foreach ($item in $order.items) {
                    Write-Host "      • $($item.materialName) x $($item.quantity)" -ForegroundColor DarkGray
                }
            }
            Write-Host ""
        }
        
        # Check for PM user orders
        $pmOrders = $ordersResponse.data.orders | Where-Object { $_.userId -eq "user-2" }
        Write-Host "PM (Jeffrey) orders: $($pmOrders.Count)" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ Orders API failed: $($ordersResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Orders API request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Cyan