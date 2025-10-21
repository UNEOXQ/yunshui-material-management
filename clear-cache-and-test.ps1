Write-Host "=== 清理緩存並測試使用者管理 ===" -ForegroundColor Green

Write-Host "`n1. 建議清理瀏覽器緩存..." -ForegroundColor Yellow
Write-Host "請在瀏覽器中按 Ctrl+Shift+R 強制刷新" -ForegroundColor Cyan
Write-Host "或者按 F12 → Network 標籤 → 勾選 'Disable cache'" -ForegroundColor Cyan

Write-Host "`n2. 測試後端使用者 API..." -ForegroundColor Yellow
try {
    $loginBody = @{username="admin"; password="admin123"} | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token
    
    $userResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/users" -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
    $userData = $userResponse.Content | ConvertFrom-Json
    
    Write-Host "✅ 後端 API 正常" -ForegroundColor Green
    Write-Host "使用者數量: $($userData.data.users.Count)" -ForegroundColor Cyan
    
    foreach ($user in $userData.data.users) {
        Write-Host "  - $($user.username) ($($user.role))" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ 後端 API 測試失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. 檢查前端文件..." -ForegroundColor Yellow
$userServicePath = "frontend/src/services/userService.ts"
if (Test-Path $userServicePath) {
    $content = Get-Content $userServicePath -Raw
    if ($content -match "mockDelay") {
        Write-Host "❌ userService.ts 中仍有 mockDelay 引用" -ForegroundColor Red
    } else {
        Write-Host "✅ userService.ts 已清理" -ForegroundColor Green
    }
} else {
    Write-Host "❌ 找不到 userService.ts" -ForegroundColor Red
}

Write-Host "`n=== 測試完成 ===" -ForegroundColor Green
Write-Host "如果問題持續，請:" -ForegroundColor Yellow
Write-Host "1. 強制刷新瀏覽器 (Ctrl+Shift+R)" -ForegroundColor Cyan
Write-Host "2. 清除瀏覽器緩存" -ForegroundColor Cyan
Write-Host "3. 重新啟動前端開發服務器" -ForegroundColor Cyan