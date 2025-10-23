# 修復圖片 URL 腳本

Write-Host "修復圖片 URL" -ForegroundColor Cyan

$baseUrl = "https://yunshui-backend1.onrender.com"

# 登錄
$loginBody = '{"username":"admin","password":"admin123"}'
$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.token
$authHeader = @{ 'Authorization' = "Bearer $token" }

Write-Host "管理員登錄成功" -ForegroundColor Green

# 獲取所有材料
Write-Host "`n獲取所有材料..." -ForegroundColor Yellow
$materials = Invoke-RestMethod -Uri "$baseUrl/api/materials" -Method GET -Headers $authHeader

$fixedCount = 0
$totalCount = $materials.data.materials.Count

Write-Host "找到 $totalCount 個材料" -ForegroundColor Gray

foreach ($material in $materials.data.materials) {
    if ($material.imageUrl -and $material.imageUrl.Contains("localhost:3004")) {
        Write-Host "修復材料: $($material.name)" -ForegroundColor Yellow
        Write-Host "  舊URL: $($material.imageUrl)" -ForegroundColor Gray
        
        $newImageUrl = $material.imageUrl.Replace("http://localhost:3004", "https://yunshui-backend1.onrender.com")
        Write-Host "  新URL: $newImageUrl" -ForegroundColor Gray
        
        try {
            # 更新材料的圖片 URL
            $updateBody = @{
                name = $material.name
                category = $material.category
                price = $material.price
                quantity = $material.quantity
                supplier = $material.supplier
                type = $material.type
                imageUrl = $newImageUrl
            } | ConvertTo-Json
            
            $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/materials/$($material.id)" -Method PUT -Body $updateBody -ContentType "application/json" -Headers $authHeader
            
            if ($updateResponse.success) {
                Write-Host "  ✅ 修復成功" -ForegroundColor Green
                $fixedCount++
            } else {
                Write-Host "  ❌ 修復失敗: $($updateResponse.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  ❌ 修復失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n修復完成！" -ForegroundColor Green
Write-Host "總計: $totalCount 個材料" -ForegroundColor Gray
Write-Host "修復: $fixedCount 個材料" -ForegroundColor Gray