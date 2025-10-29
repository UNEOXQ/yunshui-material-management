# 測試訂單API
Write-Host "🔍 測試訂單API..." -ForegroundColor Cyan

# 測試登入獲取token
Write-Host "1. 測試登入..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Body (@{
        username = "pm001"
        password = "pm123"
    } | ConvertTo-Json) -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ 登入成功" -ForegroundColor Green
        $token = $loginResponse.data.token
        Write-Host "Token: $token" -ForegroundColor Gray
    } else {
        Write-Host "❌ 登入失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 測試獲取所有訂單
Write-Host "`n2. 測試獲取所有訂單..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($ordersResponse.success) {
        Write-Host "✅ 獲取訂單成功" -ForegroundColor Green
        Write-Host "訂單數量: $($ordersResponse.data.orders.Count)" -ForegroundColor Gray
        
        foreach ($order in $ordersResponse.data.orders) {
            Write-Host "  - 訂單 $($order.id): 類型=$($order.type), 狀態=$($order.status), 項目數=$($order.items.Count)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ 獲取訂單失敗" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 獲取訂單請求失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 測試獲取輔材訂單
Write-Host "`n3. 測試獲取輔材訂單..." -ForegroundColor Yellow
try {
    $auxResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/orders/auxiliary" -Method GET -Headers @{
        "Authorization" = "Bearer $token"
    }
    
    if ($auxResponse.success) {
        Write-Host "✅ 獲取輔材訂單成功" -ForegroundColor Green
        Write-Host "輔材訂單數量: $($auxResponse.data.orders.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 獲取輔材訂單失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n測試完成！" -ForegroundColor Cyan