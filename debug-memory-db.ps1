# 測試記憶體資料庫持久化
Write-Host "🔍 測試記憶體資料庫..." -ForegroundColor Yellow

# 測試材料 API
$API_URL = "https://yunshui-backend1.onrender.com/api"

# 獲取認證 token（使用 admin 帳號）
Write-Host "1. 獲取認證 token..." -ForegroundColor Cyan
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "   ✅ Token 獲取成功" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Token 獲取失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 測試獲取材料列表
Write-Host "2. 獲取材料列表..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $materialsResponse = Invoke-RestMethod -Uri "$API_URL/materials" -Method GET -Headers $headers
    $materialCount = $materialsResponse.data.materials.Count
    Write-Host "   ✅ 材料數量: $materialCount" -ForegroundColor Green
    
    # 顯示前幾個材料
    $materialsResponse.data.materials | Select-Object -First 3 | ForEach-Object {
        Write-Host "      - $($_.name) (ID: $($_.id))" -ForegroundColor White
    }
} catch {
    Write-Host "   ❌ 獲取材料失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 測試創建材料
Write-Host "3. 測試創建材料..." -ForegroundColor Cyan
$newMaterial = @{
    name = "測試材料-$(Get-Date -Format 'HHmmss')"
    category = "測試分類"
    price = 99.99
    quantity = 10
    supplier = "測試供應商"
    type = "AUXILIARY"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$API_URL/materials" -Method POST -Body $newMaterial -Headers $headers
    $createdId = $createResponse.data.id
    Write-Host "   ✅ 材料創建成功，ID: $createdId" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 材料創建失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   詳細錯誤: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

# 測試刪除材料
if ($createdId) {
    Write-Host "4. 測試刪除材料..." -ForegroundColor Cyan
    try {
        $deleteResponse = Invoke-RestMethod -Uri "$API_URL/materials/$createdId" -Method DELETE -Headers $headers
        Write-Host "   ✅ 材料刪除成功" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 材料刪除失敗: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   詳細錯誤: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host "🎯 測試完成！" -ForegroundColor Yellow