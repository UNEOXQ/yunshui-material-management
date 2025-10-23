# 測試備份恢復修復腳本
# 驗證專案數據是否正確備份和恢復

Write-Host "🧪 測試備份恢復修復" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3004"

# 1. 檢查後端服務
Write-Host "`n1️⃣ 檢查後端服務..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET -TimeoutSec 5
    if ($healthCheck.status -eq "ok") {
        Write-Host "✅ 後端服務正常運行" -ForegroundColor Green
    } else {
        Write-Host "❌ 後端服務狀態異常" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 無法連接到後端服務" -ForegroundColor Red
    Write-Host "   請確保後端服務在 $baseUrl 運行" -ForegroundColor Gray
    exit 1
}

# 2. 檢查當前數據狀態
Write-Host "`n2️⃣ 檢查當前數據狀態..." -ForegroundColor Yellow

# 檢查材料
try {
    $materials = Invoke-RestMethod -Uri "$baseUrl/api/materials" -Method GET
    Write-Host "📦 材料數量: $($materials.materials.Count)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取材料數據" -ForegroundColor Yellow
}

# 檢查訂單
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method GET -Headers @{
        'Authorization' = 'Bearer test-token'
    }
    Write-Host "🛒 訂單數量: $($orders.orders.Count)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取訂單數據" -ForegroundColor Yellow
}

# 檢查用戶
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method GET -Headers @{
        'Authorization' = 'Bearer test-token'
    }
    Write-Host "👥 用戶數量: $($users.users.Count)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取用戶數據" -ForegroundColor Yellow
}

# 3. 測試創建訂單和專案
Write-Host "`n3️⃣ 測試創建訂單和專案..." -ForegroundColor Yellow

# 首先登錄獲取有效 token
try {
    $loginData = @{
        username = "PMAM"
        password = "pmam123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ 登錄成功，獲得 token" -ForegroundColor Green
} catch {
    Write-Host "❌ 登錄失敗" -ForegroundColor Red
    Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

# 創建測試訂單
try {
    $orderData = @{
        items = @(
            @{
                materialId = "1"
                quantity = 10
                unitPrice = 100
                supplier = "測試供應商"
            }
        )
    } | ConvertTo-Json

    $headers = @{
        'Authorization' = "Bearer $token"
    }
    
    $orderResponse = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method POST -Body $orderData -ContentType "application/json" -Headers $headers
    
    $orderId = $orderResponse.order.id
    Write-Host "✅ 測試訂單創建成功，ID: $orderId" -ForegroundColor Green
} catch {
    Write-Host "❌ 創建測試訂單失敗" -ForegroundColor Red
    Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Gray
}

# 確認訂單並創建專案
if ($orderId) {
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        $confirmResponse = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId/confirm" -Method PUT -Headers $headers
        Write-Host "✅ 訂單確認成功，專案已創建" -ForegroundColor Green
    } catch {
        Write-Host "❌ 訂單確認失敗" -ForegroundColor Red
        Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# 4. 測試狀態更新（這會觸發專案查找）
Write-Host "`n4️⃣ 測試狀態更新..." -ForegroundColor Yellow

if ($orderId) {
    try {
        $statusData = @{
            primaryStatus = "Ordered"
            secondaryStatus = "Pending"
        } | ConvertTo-Json

        $headers = @{
            'Authorization' = "Bearer $token"
        }
        
        $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/status/orders/$orderId/status/order" -Method PUT -Body $statusData -ContentType "application/json" -Headers $headers
        Write-Host "✅ 狀態更新成功" -ForegroundColor Green
    } catch {
        Write-Host "❌ 狀態更新失敗" -ForegroundColor Red
        Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Gray
        
        if ($_.Exception.Message -like "*Project not found*") {
            Write-Host "🚨 發現 'Project not found' 錯誤！" -ForegroundColor Red
            Write-Host "   這表示專案數據遺失，需要修復備份恢復邏輯" -ForegroundColor Red
        }
    }
}

# 5. 檢查備份狀態
Write-Host "`n5️⃣ 檢查備份狀態..." -ForegroundColor Yellow

try {
    $headers = @{
        'Authorization' = "Bearer $token"
    }
    
    $backupStatus = Invoke-RestMethod -Uri "$baseUrl/api/backup/status" -Method GET -Headers $headers
    
    Write-Host "📊 備份狀態:" -ForegroundColor Gray
    Write-Host "   - 已初始化: $($backupStatus.data.isInitialized)" -ForegroundColor Gray
    Write-Host "   - 上次備份: $(if($backupStatus.data.lastBackupTime -gt 0) { [DateTimeOffset]::FromUnixTimeMilliseconds($backupStatus.data.lastBackupTime).ToString('yyyy-MM-dd HH:mm:ss') } else { '尚未備份' })" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取備份狀態" -ForegroundColor Yellow
}

# 6. 檢查恢復狀態
Write-Host "`n6️⃣ 檢查恢復狀態..." -ForegroundColor Yellow

try {
    $headers = @{
        'Authorization' = "Bearer $token"
    }
    
    $recoveryStatus = Invoke-RestMethod -Uri "$baseUrl/api/backup/recovery/status" -Method GET -Headers $headers
    
    Write-Host "📊 恢復狀態:" -ForegroundColor Gray
    Write-Host "   - 自動恢復已啟用: $($recoveryStatus.data.autoRecoveryEnabled)" -ForegroundColor Gray
    Write-Host "   - 上次恢復: $($recoveryStatus.data.lastRecoveryTimeFormatted)" -ForegroundColor Gray
    Write-Host "   - 恢復中: $($recoveryStatus.data.isRecovering)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取恢復狀態" -ForegroundColor Yellow
}

Write-Host "`n🎉 測試完成！" -ForegroundColor Green
Write-Host "如果看到 'Project not found' 錯誤，說明需要修復備份恢復邏輯" -ForegroundColor Yellow
Write-Host "修復應該包括：" -ForegroundColor Yellow
Write-Host "  1. 在備份中加入專案數據" -ForegroundColor Gray
Write-Host "  2. 在恢復時恢復專案數據" -ForegroundColor Gray
Write-Host "  3. 確保使用者ID的一致性" -ForegroundColor Gray