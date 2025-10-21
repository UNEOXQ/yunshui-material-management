Write-Host "=== 測試圖片持久化 ===" -ForegroundColor Green

# 1. 檢查上傳目錄中的圖片
Write-Host "`n1. 檢查上傳的圖片文件..." -ForegroundColor Yellow
$uploadsDir = "backend/uploads/materials"
if (Test-Path $uploadsDir) {
    $imageFiles = Get-ChildItem -Path $uploadsDir -Include "*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp" | Sort-Object LastWriteTime -Descending
    Write-Host "找到 $($imageFiles.Count) 個圖片文件:" -ForegroundColor Cyan
    foreach ($file in $imageFiles | Select-Object -First 3) {
        Write-Host "  - $($file.Name) (修改時間: $($file.LastWriteTime))" -ForegroundColor Gray
    }
} else {
    Write-Host "上傳目錄不存在" -ForegroundColor Red
}

# 2. 測試後端 API
Write-Host "`n2. 測試材料 API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ 後端運行中" -ForegroundColor Green
    
    # 登入並獲取材料列表
    $loginBody = @{username="admin"; password="admin123"} | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token
    
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
    $materialsData = $materialsResponse.Content | ConvertFrom-Json
    
    Write-Host "材料數量: $($materialsData.data.materials.Count)" -ForegroundColor Cyan
    
    $materialsWithImages = $materialsData.data.materials | Where-Object { $_.imageUrl -ne $null }
    Write-Host "有圖片的材料: $($materialsWithImages.Count)" -ForegroundColor Cyan
    
    foreach ($material in $materialsWithImages) {
        Write-Host "  - $($material.name): $($material.imageUrl)" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ 後端未運行或 API 調用失敗" -ForegroundColor Red
}

Write-Host "`n=== 測試完成 ===" -ForegroundColor Green