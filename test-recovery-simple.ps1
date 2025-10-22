# GitHub 自動恢復功能簡單測試

Write-Host "GitHub 自動恢復功能測試" -ForegroundColor Cyan

# 檢查後端服務器
Write-Host "1. 檢查後端服務器..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET
    Write-Host "✅ 後端服務器正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務器未運行" -ForegroundColor Red
    exit 1
}

# 獲取 Token
Write-Host "2. 獲取認證..." -ForegroundColor Yellow
$loginBody = '{"username":"admin","password":"admin123"}'
try {
    $login = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $loginData = $login.Content | ConvertFrom-Json
    $token = $loginData.data.token
    Write-Host "✅ 認證成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 認證失敗" -ForegroundColor Red
    exit 1
}

# 測試恢復狀態 API
Write-Host "3. 測試恢復狀態 API..." -ForegroundColor Yellow
try {
    $recoveryStatus = Invoke-WebRequest -Uri "http://localhost:3004/api/backup/recovery-status" -Method GET -Headers @{Authorization="Bearer $token"}
    $recoveryData = $recoveryStatus.Content | ConvertFrom-Json
    
    if ($recoveryData.success) {
        Write-Host "✅ 恢復狀態 API 正常" -ForegroundColor Green
        Write-Host "   自動恢復已啟用: $($recoveryData.data.autoRecoveryEnabled)" -ForegroundColor Gray
        Write-Host "   上次恢復時間: $($recoveryData.data.lastRecoveryTimeFormatted)" -ForegroundColor Gray
    } else {
        Write-Host "❌ 恢復狀態 API 錯誤" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 恢復狀態 API 失敗" -ForegroundColor Red
}

# 測試可用備份 API
Write-Host "4. 測試可用備份 API..." -ForegroundColor Yellow
try {
    $backups = Invoke-WebRequest -Uri "http://localhost:3004/api/backup/available" -Method GET -Headers @{Authorization="Bearer $token"}
    $backupsData = $backups.Content | ConvertFrom-Json
    
    if ($backupsData.success) {
        Write-Host "✅ 可用備份 API 正常" -ForegroundColor Green
        Write-Host "   可用備份數量: $($backupsData.data.Count)" -ForegroundColor Gray
    } else {
        Write-Host "❌ 可用備份 API 錯誤" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 可用備份 API 失敗" -ForegroundColor Red
}

# 測試備份狀態 API
Write-Host "5. 測試備份狀態 API..." -ForegroundColor Yellow
try {
    $backupStatus = Invoke-WebRequest -Uri "http://localhost:3004/api/backup/status" -Method GET -Headers @{Authorization="Bearer $token"}
    $backupData = $backupStatus.Content | ConvertFrom-Json
    
    if ($backupData.success) {
        Write-Host "✅ 備份狀態 API 正常" -ForegroundColor Green
        Write-Host "   備份服務已初始化: $($backupData.data.isInitialized)" -ForegroundColor Gray
    } else {
        Write-Host "❌ 備份狀態 API 錯誤" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 備份狀態 API 失敗" -ForegroundColor Red
}

Write-Host "`n🎉 測試完成！第二階段自動恢復功能已實施" -ForegroundColor Green