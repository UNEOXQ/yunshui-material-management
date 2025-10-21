# 測試上傳功能的PowerShell腳本

Write-Host "🧪 測試雲水基材管理系統上傳功能" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# 1. 測試健康檢查
Write-Host "1. 測試健康檢查..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET
    Write-Host "✅ 健康檢查成功: $($healthResponse.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ 健康檢查失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. 測試登入獲取token
Write-Host "2. 測試登入..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginResult.success) {
        $token = $loginResult.data.token
        Write-Host "✅ 登入成功，獲得token: $($token.Substring(0, 20))..." -ForegroundColor Green
    } else {
        Write-Host "❌ 登入失敗: $($loginResult.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 測試上傳資訊端點
Write-Host "3. 測試上傳資訊端點..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $uploadInfoResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/info" -Method GET -Headers $headers
    $uploadInfo = $uploadInfoResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ 上傳資訊獲取成功:" -ForegroundColor Green
    Write-Host "   最大文件大小: $($uploadInfo.data.maxFileSize)" -ForegroundColor Cyan
    Write-Host "   允許的文件類型: $($uploadInfo.data.allowedTypes -join ', ')" -ForegroundColor Cyan
    Write-Host "   上傳路徑: $($uploadInfo.data.uploadPath)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 上傳資訊獲取失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    # 顯示詳細錯誤信息
    if ($_.Exception.Response) {
        $errorResponse = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorResponse)
        $errorContent = $reader.ReadToEnd()
        Write-Host "錯誤詳情: $errorContent" -ForegroundColor Red
    }
}

# 4. 測試材料列表
Write-Host "4. 測試材料列表..." -ForegroundColor Yellow
try {
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Method GET -Headers $headers
    $materials = $materialsResponse.Content | ConvertFrom-Json
    
    if ($materials.success -and $materials.data.materials.Count -gt 0) {
        $firstMaterial = $materials.data.materials[0]
        Write-Host "✅ 材料列表獲取成功，第一個材料: $($firstMaterial.name) (ID: $($firstMaterial.id))" -ForegroundColor Green
        
        # 5. 測試材料圖片上傳端點（不實際上傳文件，只測試端點是否存在）
        Write-Host "5. 測試材料圖片上傳端點..." -ForegroundColor Yellow
        try {
            # 這會返回400錯誤（沒有文件），但說明端點存在
            $uploadResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/material/$($firstMaterial.id)/image" -Method POST -Headers $headers
        } catch {
            if ($_.Exception.Response.StatusCode -eq 400) {
                Write-Host "✅ 上傳端點存在（返回400是因為沒有文件，這是正常的）" -ForegroundColor Green
            } else {
                Write-Host "❌ 上傳端點測試失敗: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ 沒有找到材料數據" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 材料列表獲取失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 測試完成！" -ForegroundColor Green