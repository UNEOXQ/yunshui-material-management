# 測試移動設備訪問
Write-Host "=== 測試移動設備訪問 ===" -ForegroundColor Green

# 1. 測試後端健康檢查
Write-Host "`n1. 測試後端健康檢查..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/health" -Method GET -TimeoutSec 10
    Write-Host "✓ 後端健康檢查成功" -ForegroundColor Green
    Write-Host "  版本: $($healthResponse.version)" -ForegroundColor Gray
    Write-Host "  時間: $($healthResponse.timestamp)" -ForegroundColor Gray
} catch {
    Write-Host "✗ 後端健康檢查失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  請確保後端正在運行在端口 3004" -ForegroundColor Yellow
}

# 2. 測試CORS配置
Write-Host "`n2. 測試CORS配置..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://192.168.68.95:3000'
        'Content-Type' = 'application/json'
    }
    
    $loginData = @{
        username = 'admin'
        password = 'admin123'
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://192.168.68.95:3004/api/auth/login" -Method POST -Headers $headers -Body $loginData -TimeoutSec 10
    
    if ($loginResponse.success) {
        Write-Host "✓ CORS配置正確，登入API測試成功" -ForegroundColor Green
        Write-Host "  用戶: $($loginResponse.data.user.username)" -ForegroundColor Gray
    } else {
        Write-Host "✗ 登入API返回失敗" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ CORS測試失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 檢查前端環境變量
Write-Host "`n3. 檢查前端環境變量..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    $envContent = Get-Content "frontend\.env"
    Write-Host "✓ 前端環境變量文件存在:" -ForegroundColor Green
    foreach ($line in $envContent) {
        Write-Host "  $line" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ 前端環境變量文件不存在" -ForegroundColor Red
}

# 4. 提供訪問信息
Write-Host "`n4. 訪問信息:" -ForegroundColor Yellow
Write-Host "  前端URL: http://192.168.68.95:3000" -ForegroundColor Cyan
Write-Host "  後端URL: http://192.168.68.95:3004" -ForegroundColor Cyan
Write-Host "  測試頁面: test-cors-fix.html" -ForegroundColor Cyan

Write-Host "`n=== 測試完成 ===" -ForegroundColor Green