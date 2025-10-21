# 簡單的上傳測試

Write-Host "測試上傳功能" -ForegroundColor Green

# 登入
$loginData = '{"username":"admin","password":"admin123"}'
$loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$loginResult = $loginResponse.Content | ConvertFrom-Json

if ($loginResult.success) {
    $token = $loginResult.data.token
    Write-Host "登入成功" -ForegroundColor Green
    
    # 獲取材料
    $headers = @{ "Authorization" = "Bearer $token" }
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Method GET -Headers $headers
    $materials = $materialsResponse.Content | ConvertFrom-Json
    
    if ($materials.success) {
        $materialId = $materials.data.materials[0].id
        Write-Host "材料ID: $materialId" -ForegroundColor Cyan
        
        # 測試上傳端點
        try {
            $uploadResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/upload/material/$materialId/image" -Method POST -Headers $headers
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "上傳端點狀態碼: $statusCode" -ForegroundColor Yellow
            
            if ($statusCode -eq 400) {
                Write-Host "端點存在，需要文件" -ForegroundColor Green
            }
        }
    }
}