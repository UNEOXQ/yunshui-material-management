# Debug Mobile API calls
Write-Host "Debugging Mobile API calls..." -ForegroundColor Cyan

# Test login with pm001 (Jeffrey)
Write-Host "1. Testing login with pm001..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "Login successful" -ForegroundColor Green
        Write-Host "User: $($loginResponse.data.user.username)" -ForegroundColor Gray
        Write-Host "Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
        $token = $loginResponse.data.token
        Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
    } else {
        Write-Host "Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test orders API with the token
Write-Host "`n2. Testing orders API..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "Orders API Response:" -ForegroundColor Gray
    Write-Host "Success: $($ordersResponse.success)" -ForegroundColor Gray
    Write-Host "Has data: $($ordersResponse.data -ne $null)" -ForegroundColor Gray
    Write-Host "Has orders: $($ordersResponse.data.orders -ne $null)" -ForegroundColor Gray
    Write-Host "Orders count: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
    
    if ($ordersResponse.data.orders.Count -gt 0) {
        Write-Host "`nFirst order details:" -ForegroundColor Gray
        $firstOrder = $ordersResponse.data.orders[0]
        Write-Host "ID: $($firstOrder.id)" -ForegroundColor Gray
        Write-Host "Type: $($firstOrder.type)" -ForegroundColor Gray
        Write-Host "Status: $($firstOrder.status)" -ForegroundColor Gray
        Write-Host "Items count: $($firstOrder.items.Count)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "Orders API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nDebug completed!" -ForegroundColor Cyan