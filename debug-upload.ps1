# 圖片上傳問題診斷腳本

Write-Host "🔍 圖片上傳問題診斷" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""

# 1. 檢查後端服務狀態
Write-Host "1. 檢查後端服務..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET -TimeoutSec 5
    Write-Host "✅ 後端服務正常運行" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務未運行或異常" -ForegroundColor Red
    Write-Host "請先啟動後端服務" -ForegroundColor Yellow
    exit 1
}

# 2. 測試登入獲取 token
Write-Host "2. 測試管理員登入..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 10
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginResult.success) {
        $token = $loginResult.data.token
        Write-Host "✅ 管理員登入成功" -ForegroundColor Green
        Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ 登入失敗: $($loginResult.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 測試材料列表
Write-Host "3. 獲取材料列表..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Method GET -Headers $headers -TimeoutSec 10
    $materials = $materialsResponse.Content | ConvertFrom-Json
    
    if ($materials.success -and $materials.data.materials.Count -gt 0) {
        $firstMaterial = $materials.data.materials[0]
        Write-Host "✅ 材料列表獲取成功" -ForegroundColor Green
        Write-Host "第一個材料: $($firstMaterial.name) (ID: $($firstMaterial.id))" -ForegroundColor Cyan
        $materialId = $firstMaterial.id
    } else {
        Write-Host "❌ 沒有找到材料數據" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 材料列表獲取失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. 測試上傳資訊端點
Write-Host "4. 測試上傳資訊端點..." -ForegroundColor Yellow
try {
    $uploadInfoResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/info" -Method GET -Headers $headers -TimeoutSec 10
    $uploadInfo = $uploadInfoResponse.Content | ConvertFrom-Json
    
    if ($uploadInfo.success) {
        Write-Host "✅ 上傳資訊端點正常" -ForegroundColor Green
        Write-Host "最大文件大小: $($uploadInfo.data.maxFileSize)" -ForegroundColor Cyan
        Write-Host "允許的文件類型: $($uploadInfo.data.allowedTypes -join ', ')" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 上傳資訊端點異常: $($uploadInfo.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 上傳資訊端點失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    # 顯示詳細錯誤
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP 狀態碼: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "錯誤詳情: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "無法讀取錯誤詳情" -ForegroundColor Red
        }
    }
}

# 5. 測試上傳端點（不實際上傳文件）
Write-Host "5. 測試上傳端點..." -ForegroundColor Yellow
try {
    # 這會返回 400 錯誤（沒有文件），但說明端點存在
    $uploadResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/material/$materialId/image" -Method POST -Headers $headers -TimeoutSec 10
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "✅ 上傳端點存在（返回 400 是因為沒有文件，這是正常的）" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "❌ 上傳端點不存在 (404)" -ForegroundColor Red
    } elseif ($statusCode -eq 401) {
        Write-Host "❌ 認證失敗 (401)" -ForegroundColor Red
    } elseif ($statusCode -eq 403) {
        Write-Host "❌ 權限不足 (403)" -ForegroundColor Red
    } else {
        Write-Host "❌ 上傳端點測試失敗: HTTP $statusCode" -ForegroundColor Red
        Write-Host "錯誤: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. 檢查上傳目錄
Write-Host "6. 檢查上傳目錄..." -ForegroundColor Yellow
$uploadDirs = @("uploads", "uploads\materials", "backend\uploads", "backend\uploads\materials")

foreach ($dir in $uploadDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ 目錄存在: $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ 目錄不存在: $dir" -ForegroundColor Red
    }
}

# 7. 檢查 multer 依賴
Write-Host "7. 檢查後端依賴..." -ForegroundColor Yellow
if (Test-Path "backend\node_modules\multer") {
    Write-Host "✅ multer 依賴已安裝" -ForegroundColor Green
} else {
    Write-Host "❌ multer 依賴未安裝" -ForegroundColor Red
    Write-Host "請運行: cd backend && npm install" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================" -ForegroundColor Green
Write-Host "🎯 診斷完成" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 如果上傳仍然失敗，請檢查:" -ForegroundColor Cyan
Write-Host "1. 確保以管理員身份登入" -ForegroundColor White
Write-Host "2. 圖片文件大小不超過 5MB" -ForegroundColor White
Write-Host "3. 圖片格式為 JPG, PNG, GIF 或 WebP" -ForegroundColor White
Write-Host "4. 檢查瀏覽器開發者工具的網絡標籤" -ForegroundColor White
Write-Host "5. 檢查後端服務器的控制台日誌" -ForegroundColor White
Write-Host ""