# Test New Backend API
Write-Host "Testing New Backend API (192.168.68.103:3000)..." -ForegroundColor Cyan

# Test login with pm001
Write-Host "1. Testing login with Jeffrey..." -ForegroundColor Yellow
try {
    $loginData = @{
        username = "pm001"
        password = "pm123"
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
    Write-Host "🔍 Checking if backend is running on port 3000..." -ForegroundColor Yellow
    
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://192.168.68.103:3000/health" -TimeoutSec 5
        Write-Host "✅ Backend is running, but login endpoint may have issues" -ForegroundColor Yellow
    } catch {
        Write-Host "❌ Backend is not responding on port 3000" -ForegroundColor Red
        Write-Host "💡 Please check if backend is running with: npm run dev" -ForegroundColor Yellow
    }
    exit 1
}

# Test orders API
Write-Host "`n2. Testing orders API..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.103:3000/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($ordersResponse.success) {
        Write-Host "✅ Orders API successful" -ForegroundColor Green
        Write-Host "📊 Total orders: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        
        if ($ordersResponse.data.orders.Count -gt 0) {
            Write-Host "📋 First order: $($ordersResponse.data.orders[0].id) - $($ordersResponse.data.orders[0].items.Count) items" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ Orders API failed: $($ordersResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Orders API request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Test completed!" -ForegroundColor Cyan