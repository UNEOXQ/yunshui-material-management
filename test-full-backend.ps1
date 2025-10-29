# Test Full Backend (PC version)
Write-Host "Testing Full Backend API..." -ForegroundColor Cyan

# Test login with pm001
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
    } else {
        Write-Host "Login failed: $($loginResponse.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Login request failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test orders API
Write-Host "`n2. Testing orders API..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    Write-Host "Orders API Response:" -ForegroundColor Gray
    Write-Host "Success: $($ordersResponse.success)" -ForegroundColor Gray
    
    if ($ordersResponse.data) {
        Write-Host "Data structure:" -ForegroundColor Gray
        $ordersResponse.data | Get-Member | Where-Object {$_.MemberType -eq "NoteProperty"} | ForEach-Object {
            Write-Host "  - $($_.Name): $($ordersResponse.data.($_.Name).GetType().Name)" -ForegroundColor Gray
        }
        
        if ($ordersResponse.data.orders) {
            Write-Host "Orders count: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        } elseif ($ordersResponse.data -is [Array]) {
            Write-Host "Direct array count: $($ordersResponse.data.Count)" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "Orders API failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Cyan