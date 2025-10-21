#!/usr/bin/env pwsh

Write-Host "=== 測試 CORS 圖片載入 ===" -ForegroundColor Green

# 測試靜態文件服務的 CORS 頭
Write-Host "`n1. 測試靜態文件 CORS 頭..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/uploads/materials/" -Method OPTIONS -Headers @{
        "Origin" = "http://localhost:3000"
        "Access-Control-Request-Method" = "GET"
    } -UseBasicParsing
    
    Write-Host "OPTIONS 請求狀態: $($response.StatusCode)" -ForegroundColor Green
    
    $corsHeaders = @(
        "Access-Control-Allow-Origin",
        "Access-Control-Allow-Methods", 
        "Cross-Origin-Resource-Policy"
    )
    
    foreach ($header in $corsHeaders) {
        $value = $response.Headers[$header]
        if ($value) {
            Write-Host "$header`: $value" -ForegroundColor Green
        } else {
            Write-Host "$header`: 未設置" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "OPTIONS 請求失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 測試實際圖片文件的 CORS 頭
Write-Host "`n2. 檢查上傳目錄中的圖片文件..." -ForegroundColor Yellow

$uploadsDir = "backend/uploads/materials"
if (Test-Path $uploadsDir) {
    $imageFiles = Get-ChildItem -Path $uploadsDir -Filter "*.png", "*.jpg", "*.jpeg", "*.gif", "*.webp" | Select-Object -First 1
    
    if ($imageFiles) {
        $imageFile = $imageFiles[0]
        $imageUrl = "http://localhost:3004/uploads/materials/$($imageFile.Name)"
        
        Write-Host "測試圖片: $imageUrl" -ForegroundColor Cyan
        
        try {
            $response = Invoke-WebRequest -Uri $imageUrl -Method GET -Headers @{
                "Origin" = "http://localhost:3000"
            } -UseBasicParsing
            
            Write-Host "GET 請求狀態: $($response.StatusCode)" -ForegroundColor Green
            Write-Host "Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Green
            Write-Host "Access-Control-Allow-Origin: $($response.Headers['Access-Control-Allow-Origin'])" -ForegroundColor Green
            Write-Host "Cross-Origin-Resource-Policy: $($response.Headers['Cross-Origin-Resource-Policy'])" -ForegroundColor Green
            
        } catch {
            Write-Host "GET 請求失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "沒有找到圖片文件進行測試" -ForegroundColor Yellow
    }
} else {
    Write-Host "上傳目錄不存在: $uploadsDir" -ForegroundColor Red
}

# 測試瀏覽器 CORS 策略
Write-Host "`n3. 瀏覽器 CORS 測試建議..." -ForegroundColor Yellow
Write-Host "請在瀏覽器開發者工具中執行以下 JavaScript 代碼:" -ForegroundColor Cyan
Write-Host @"
fetch('http://localhost:3004/uploads/materials/test.png', {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
}).then(response => {
    console.log('CORS 測試成功:', response.status);
    console.log('Headers:', [...response.headers.entries()]);
}).catch(error => {
    console.error('CORS 測試失敗:', error);
});
"@ -ForegroundColor White

Write-Host "`n=== 測試完成 ===" -ForegroundColor Green