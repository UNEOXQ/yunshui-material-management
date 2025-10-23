# 簡單診斷腳本

Write-Host "診斷訂單項目問題" -ForegroundColor Cyan

$baseUrl = "https://yunshui-backend1.onrender.com"

# 登錄
$loginBody = '{"username":"pm001","password":"pm123"}'
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.token
$authHeader = @{ 'Authorization' = "Bearer $token" }

Write-Host "登錄成功" -ForegroundColor Green

# 檢查訂單
$orders = Invoke-RestMethod -Uri "$baseUrl/api/orders?limit=2" -Method GET -Headers $authHeader

Write-Host "找到 $($orders.data.orders.Count) 個訂單" -ForegroundColor Yellow

foreach ($order in $orders.data.orders) {
    Write-Host "訂單 $($order.id):" -ForegroundColor Cyan
    Write-Host "  項目數量: $($order.items.Count)" -ForegroundColor Gray
    
    if ($order.items.Count -gt 0) {
        $item = $order.items[0]
        Write-Host "  第一個項目:" -ForegroundColor Gray
        Write-Host "    材料ID: $($item.materialId)" -ForegroundColor Gray
        Write-Host "    材料名稱: $($item.materialName)" -ForegroundColor Gray
        Write-Host "    數量: $($item.quantity)" -ForegroundColor Gray
        Write-Host "    圖片: $($item.imageUrl)" -ForegroundColor Gray
        if ($item.material) {
            Write-Host "    關聯材料: 有" -ForegroundColor Green
        } else {
            Write-Host "    關聯材料: 無" -ForegroundColor Red
        }
    } else {
        Write-Host "  沒有項目數據！" -ForegroundColor Red
    }
    Write-Host ""
}