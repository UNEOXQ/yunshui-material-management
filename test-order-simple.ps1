# 簡單測試訂單創建 API

Write-Host "測試訂單創建 API..."

# 1. 登入
$loginData = '{"username":"pm001","password":"pm123"}'
Write-Host "1. 登入中..."

try {
    $loginResponse = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "登入成功" -ForegroundColor Green
        $token = $loginResponse.data.token
    } else {
        Write-Host "登入失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "登入錯誤: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 獲取材料
Write-Host "2. 獲取材料..."
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $materialsResponse = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/api/materials" -Method GET -Headers $headers
    
    if ($materialsResponse.success) {
        Write-Host "獲取材料成功，共 $($materialsResponse.data.materials.Count) 個" -ForegroundColor Green
        $material = $materialsResponse.data.materials[0]
        Write-Host "使用材料: $($material.name) (ID: $($material.id))" -ForegroundColor Yellow
    } else {
        Write-Host "獲取材料失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "獲取材料錯誤: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 創建訂單
Write-Host "3. 創建訂單..."
$orderData = "{`"items`":[{`"materialId`":`"$($material.id)`",`"quantity`":1}]}"
Write-Host "訂單數據: $orderData" -ForegroundColor Cyan

try {
    $orderResponse = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/api/orders/auxiliary" -Method POST -Body $orderData -Headers $headers
    
    if ($orderResponse.success) {
        Write-Host "訂單創建成功！" -ForegroundColor Green
        Write-Host "訂單 ID: $($orderResponse.data.order.id)" -ForegroundColor Yellow
    } else {
        Write-Host "訂單創建失敗: $($orderResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "創建訂單錯誤: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "詳細錯誤: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "測試完成"