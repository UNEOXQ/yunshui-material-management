# 簡單的 API 測試
$API_URL = "https://yunshui-backend1.onrender.com/api"

Write-Host "測試 API 連接..." -ForegroundColor Yellow

# 測試健康檢查
try {
    $healthResponse = Invoke-RestMethod -Uri "https://yunshui-backend1.onrender.com/health" -Method GET
    Write-Host "後端健康狀態: OK" -ForegroundColor Green
} catch {
    Write-Host "後端連接失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 測試登入
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "登入成功" -ForegroundColor Green
    
    # 測試材料 API
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.data.token)"
    }
    
    $materialsResponse = Invoke-RestMethod -Uri "$API_URL/materials" -Method GET -Headers $headers
    Write-Host "材料數量: $($materialsResponse.data.materials.Count)" -ForegroundColor Green
    
} catch {
    Write-Host "API 測試失敗: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "詳細錯誤: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}