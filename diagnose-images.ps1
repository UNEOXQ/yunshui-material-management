# 診斷圖片顯示問題

Write-Host "診斷圖片顯示問題" -ForegroundColor Cyan

$baseUrl = "https://yunshui-backend1.onrender.com"

# 登錄
$loginBody = '{"username":"pm001","password":"pm123"}'
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.token
$authHeader = @{ 'Authorization' = "Bearer $token" }

Write-Host "登錄成功" -ForegroundColor Green

# 檢查材料數據
Write-Host "`n檢查材料圖片..." -ForegroundColor Yellow
$materials = Invoke-RestMethod -Uri "$baseUrl/api/materials?limit=5" -Method GET -Headers $authHeader

foreach ($material in $materials.data.materials) {
    Write-Host "材料: $($material.name)" -ForegroundColor Cyan
    Write-Host "  ID: $($material.id)" -ForegroundColor Gray
    Write-Host "  圖片URL: $($material.imageUrl)" -ForegroundColor Gray
    
    if ($material.imageUrl) {
        try {
            $imageResponse = Invoke-WebRequest -Uri $material.imageUrl -Method HEAD -TimeoutSec 5
            Write-Host "  圖片狀態: $($imageResponse.StatusCode) - 可訪問" -ForegroundColor Green
        } catch {
            Write-Host "  圖片狀態: 無法訪問 - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  圖片狀態: 沒有圖片URL" -ForegroundColor Yellow
    }
    Write-Host ""
}

# 檢查訂單項目
Write-Host "檢查訂單項目圖片..." -ForegroundColor Yellow
$orders = Invoke-RestMethod -Uri "$baseUrl/api/orders?limit=2" -Method GET -Headers $authHeader

foreach ($order in $orders.data.orders) {
    Write-Host "訂單: $($order.id)" -ForegroundColor Cyan
    
    foreach ($item in $order.items) {
        Write-Host "  項目: $($item.materialName)" -ForegroundColor Gray
        Write-Host "    項目圖片URL: $($item.imageUrl)" -ForegroundColor Gray
        Write-Host "    材料圖片URL: $($item.material.imageUrl)" -ForegroundColor Gray
        
        $imageUrl = $item.imageUrl
        if (!$imageUrl) { $imageUrl = $item.material.imageUrl }
        
        if ($imageUrl) {
            try {
                $imageResponse = Invoke-WebRequest -Uri $imageUrl -Method HEAD -TimeoutSec 5
                Write-Host "    圖片狀態: $($imageResponse.StatusCode) - 可訪問" -ForegroundColor Green
            } catch {
                Write-Host "    圖片狀態: 無法訪問 - $($_.Exception.Message)" -ForegroundColor Red
            }
        } else {
            Write-Host "    圖片狀態: 沒有圖片URL" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}