# 測試修復腳本

Write-Host "🧪 測試備份恢復修復" -ForegroundColor Cyan

$baseUrl = "http://localhost:3004"

# 檢查後端服務
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET
    Write-Host "✅ 後端服務正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務異常" -ForegroundColor Red
    exit 1
}

# 登錄
try {
    $loginBody = '{"username":"PMAM","password":"pmam123"}'
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $login.token
    Write-Host "✅ 登錄成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 登錄失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 創建訂單
$orderId = $null
try {
    $orderBody = '{"items":[{"materialId":"1","quantity":10,"unitPrice":100,"supplier":"測試供應商"}]}'
    $authHeader = @{ 'Authorization' = "Bearer $token" }
    $order = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method POST -Body $orderBody -ContentType "application/json" -Headers $authHeader
    $orderId = $order.order.id
    Write-Host "✅ 訂單創建成功: $orderId" -ForegroundColor Green
} catch {
    Write-Host "❌ 創建訂單失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 確認訂單（創建專案）
if ($orderId) {
    try {
        $confirm = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId/confirm" -Method PUT -Headers $authHeader
        Write-Host "✅ 訂單確認成功，專案已創建" -ForegroundColor Green
    } catch {
        Write-Host "❌ 訂單確認失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 測試狀態更新（會查找專案）
if ($orderId) {
    try {
        $statusBody = '{"primaryStatus":"Ordered","secondaryStatus":"Pending"}'
        $status = Invoke-RestMethod -Uri "$baseUrl/api/status/orders/$orderId/status/order" -Method PUT -Body $statusBody -ContentType "application/json" -Headers $authHeader
        Write-Host "✅ 狀態更新成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 狀態更新失敗: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Message -like "*Project not found*") {
            Write-Host "🚨 發現 'Project not found' 錯誤！" -ForegroundColor Red
        }
    }
}

Write-Host "🎉 測試完成" -ForegroundColor Green