# Test Warehouse API Functions
Write-Host "Testing Warehouse API Functions..." -ForegroundColor Cyan

# Test login with warehouse user (Mark)
Write-Host "1. Testing login with Mark (WAREHOUSE)..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "warehouse001"
        password = "wh123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Login successful - User: $($loginResponse.data.user.username), Role: $($loginResponse.data.user.role)" -ForegroundColor Green
        $token = $loginResponse.data.token
    } else {
        Write-Host "❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test get orders for warehouse user
Write-Host "`n2. Testing get orders for warehouse user..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($ordersResponse.success) {
        Write-Host "✅ Orders API successful" -ForegroundColor Green
        Write-Host "📊 Total orders visible to warehouse: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        
        if ($ordersResponse.data.orders.Count -gt 0) {
            $firstOrder = $ordersResponse.data.orders[0]
            Write-Host "📋 First order: $($firstOrder.id) - Status: $($firstOrder.status)" -ForegroundColor Gray
            $testOrderId = $firstOrder.id
        }
    } else {
        Write-Host "❌ Orders API failed: $($ordersResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Orders API request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test update order status (if we have an order)
if ($testOrderId) {
    Write-Host "`n3. Testing update order status..." -ForegroundColor Yellow
    try {
        $updateData = @{
            status = "CONFIRMED"
        } | ConvertTo-Json
        
        $updateResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/orders/$testOrderId/status" -Method PUT -Body $updateData -ContentType "application/json" -Headers @{
            "Authorization" = "Bearer $token"
        }
        
        if ($updateResponse.success) {
            Write-Host "✅ Status update successful" -ForegroundColor Green
            Write-Host "📋 Order $testOrderId status updated to: CONFIRMED" -ForegroundColor Gray
        } else {
            Write-Host "❌ Status update failed: $($updateResponse.message)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Status update request failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 This might be expected if the order is already in a non-updatable state" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n3. Skipping status update test - no orders available" -ForegroundColor Yellow
}

Write-Host "`n🎯 Warehouse API test completed!" -ForegroundColor Cyan
Write-Host "💡 Now test the mobile app with Mark's account to verify the UI works" -ForegroundColor Yellow