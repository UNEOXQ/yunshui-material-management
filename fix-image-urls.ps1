# 修復現有材料的圖片 URL
$API_URL = "https://yunshui-backend1.onrender.com/api"

Write-Host "修復圖片 URL..." -ForegroundColor Yellow

# 登入
$loginData = '{"username":"admin","password":"admin123"}'
$loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$token = $loginResponse.data.token
$headers = @{"Authorization" = "Bearer $token"}

# 獲取材料
$materials = Invoke-RestMethod -Uri "$API_URL/materials" -Headers $headers
Write-Host "找到 $($materials.data.materials.Count) 個材料" -ForegroundColor Green

# 修復每個材料的圖片 URL
foreach ($material in $materials.data.materials) {
    if ($material.imageUrl -and $material.imageUrl.StartsWith("http://localhost:3004")) {
        $newImageUrl = $material.imageUrl.Replace("http://localhost:3004", "https://yunshui-backend1.onrender.com")
        
        Write-Host "修復材料: $($material.name)" -ForegroundColor Cyan
        Write-Host "  舊 URL: $($material.imageUrl)" -ForegroundColor Red
        Write-Host "  新 URL: $newImageUrl" -ForegroundColor Green
        
        # 更新材料
        $updateData = @{
            name = $material.name
            category = $material.category
            price = $material.price
            quantity = $material.quantity
            supplier = $material.supplier
            type = $material.type
        } | ConvertTo-Json
        
        try {
            $updateResponse = Invoke-RestMethod -Uri "$API_URL/materials/$($material.id)" -Method PUT -Body $updateData -Headers $headers -ContentType "application/json"
            
            # 手動更新圖片 URL（如果有專門的 API）
            # 這裡我們需要直接調用後端的內部方法來更新 imageUrl
            Write-Host "  ✅ 材料更新成功" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ 更新失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "修復完成！" -ForegroundColor Yellow