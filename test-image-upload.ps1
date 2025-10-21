# 測試圖片上傳功能

Write-Host "🧪 測試圖片上傳功能" -ForegroundColor Green

# 1. 登入獲取 token
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "1. 登入獲取 token..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginResult.success) {
        $token = $loginResult.data.token
        Write-Host "✅ 登入成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 登入失敗" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登入失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 獲取材料列表
Write-Host "2. 獲取材料列表..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Method GET -Headers $headers
    $materials = $materialsResponse.Content | ConvertFrom-Json
    
    if ($materials.success -and $materials.data.materials.Count -gt 0) {
        $firstMaterial = $materials.data.materials[0]
        $materialId = $firstMaterial.id
        Write-Host "✅ 找到材料: $($firstMaterial.name) (ID: $materialId)" -ForegroundColor Green
    } else {
        Write-Host "❌ 沒有找到材料" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 獲取材料失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 測試上傳端點（不實際上傳文件）
Write-Host "3. 測試上傳端點..." -ForegroundColor Yellow
try {
    # 這會返回 400 錯誤（沒有文件），但說明端點存在且認證成功
    $uploadResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/material/$materialId/image" -Method POST -Headers $headers
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ 上傳端點存在且認證成功（400 錯誤是因為沒有文件）" -ForegroundColor Green
    } elseif ($statusCode -eq 401) {
        Write-Host "❌ 認證失敗 (401)" -ForegroundColor Red
    } elseif ($statusCode -eq 403) {
        Write-Host "❌ 權限不足 (403)" -ForegroundColor Red
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ 端點不存在 (404)" -ForegroundColor Red
    } else {
        Write-Host "❌ 其他錯誤: HTTP $statusCode" -ForegroundColor Red
        Write-Host "錯誤詳情: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. 檢查上傳目錄
Write-Host "4. 檢查上傳目錄..." -ForegroundColor Yellow
$uploadDirs = @("uploads", "uploads\materials", "backend\uploads", "backend\uploads\materials")

foreach ($dir in $uploadDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ 目錄存在: $dir" -ForegroundColor Green
        $files = Get-ChildItem $dir -ErrorAction SilentlyContinue
        Write-Host "   文件數量: $($files.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 目錄不存在: $dir" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎯 測試完成" -ForegroundColor Green
Write-Host ""
Write-Host "💡 如果上傳仍然失敗，請檢查:" -ForegroundColor Cyan
Write-Host "1. 後端控制台的錯誤信息" -ForegroundColor White
Write-Host "2. 瀏覽器開發者工具的網絡標籤" -ForegroundColor White
Write-Host "3. 圖片文件格式和大小" -ForegroundColor White