# 測試圖片上傳和顯示流程
$API_URL = "https://yunshui-backend1.onrender.com/api"

Write-Host "測試圖片上傳流程..." -ForegroundColor Yellow

# 1. 登入獲取 token
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "1. 登入成功" -ForegroundColor Green
} catch {
    Write-Host "1. 登入失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
}

# 2. 獲取材料列表
try {
    $materialsResponse = Invoke-RestMethod -Uri "$API_URL/materials" -Method GET -Headers $headers
    $materials = $materialsResponse.data.materials
    Write-Host "2. 獲取材料列表成功，共 $($materials.Count) 個材料" -ForegroundColor Green
    
    # 顯示材料信息
    foreach ($material in $materials) {
        $imageStatus = if ($material.imageUrl) { "有圖片: $($material.imageUrl)" } else { "無圖片" }
        Write-Host "   - $($material.name) (ID: $($material.id)) - $imageStatus" -ForegroundColor White
    }
} catch {
    Write-Host "2. 獲取材料失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 測試圖片 URL 訪問
Write-Host "3. 測試圖片 URL 訪問..." -ForegroundColor Cyan
$materialsWithImages = $materials | Where-Object { $_.imageUrl }

if ($materialsWithImages.Count -eq 0) {
    Write-Host "   沒有材料有圖片，跳過圖片測試" -ForegroundColor Yellow
} else {
    foreach ($material in $materialsWithImages) {
        $imageUrl = $material.imageUrl
        Write-Host "   測試圖片: $imageUrl" -ForegroundColor White
        
        try {
            $response = Invoke-WebRequest -Uri $imageUrl -Method HEAD -TimeoutSec 10
            Write-Host "     ✅ 圖片可訪問 (狀態: $($response.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "     ❌ 圖片無法訪問: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 4. 測試靜態文件服務
Write-Host "4. 測試靜態文件服務..." -ForegroundColor Cyan
$testUrls = @(
    "https://yunshui-backend1.onrender.com/uploads/",
    "https://yunshui-backend1.onrender.com/uploads/materials/"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
        Write-Host "   ✅ $url 可訪問" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $url 無法訪問: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "測試完成！" -ForegroundColor Yellow