# 簡化的認證測試

Write-Host "🔍 認證測試" -ForegroundColor Green

# 1. 測試登入
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "1. 測試登入..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "登入響應:" -ForegroundColor Cyan
    Write-Host $response.Content -ForegroundColor White
    
    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        $token = $result.data.token
        Write-Host "✅ 登入成功" -ForegroundColor Green
        
        # 2. 測試材料API
        Write-Host "2. 測試材料API..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        try {
            $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Method GET -Headers $headers
            Write-Host "✅ 材料API成功" -ForegroundColor Green
        } catch {
            Write-Host "❌ 材料API失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 登入失敗" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
}