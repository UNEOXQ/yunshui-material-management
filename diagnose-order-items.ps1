# 診斷訂單項目問題腳本

Write-Host "🔍 診斷訂單項目問題" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$baseUrl = "https://yunshui-backend1.onrender.com"

# 1. 檢查後端服務
Write-Host "`n1️⃣ 檢查後端服務..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ 後端服務正常運行" -ForegroundColor Green
    Write-Host "   運行時間: $([math]::Round($health.uptime / 60, 2)) 分鐘" -ForegroundColor Gray
} catch {
    Write-Host "❌ 無法連接到後端服務" -ForegroundColor Red
    Write-Host "   錯誤: $($_.Exception.Message)" -ForegroundColor Gray
    exit 1
}

# 2. 登錄獲取 token
Write-Host "`n2️⃣ 登錄系統..." -ForegroundColor Yellow
try {
    $loginBody = '{"username":"pm001","password":"pm123"}'
    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    $token = $login.data.token
    $authHeader = @{ 'Authorization' = "Bearer $token" }
    Write-Host "✅ 登錄成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 登錄失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. 檢查備份狀態
Write-Host "`n3️⃣ 檢查備份狀態..." -ForegroundColor Yellow
try {
    $backupStatus = Invoke-RestMethod -Uri "$baseUrl/api/backup/status" -Method GET -Headers $authHeader -TimeoutSec 10
    Write-Host "📊 備份狀態:" -ForegroundColor Gray
    Write-Host "   - 已初始化: $($backupStatus.data.isInitialized)" -ForegroundColor Gray
    Write-Host "   - 上次備份: $(if($backupStatus.data.lastBackupTime -gt 0) { [DateTimeOffset]::FromUnixTimeMilliseconds($backupStatus.data.lastBackupTime).ToString('yyyy-MM-dd HH:mm:ss') } else { '尚未備份' })" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ 無法獲取備份狀態: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. 檢查恢復狀態
Write-Host "`n4️⃣ 檢查恢復狀態..." -ForegroundColor Yellow
try {
    $recoveryStatus = Invoke-RestMethod -Uri "$baseUrl/api/backup/recovery/status" -Method GET -Headers $authHeader -TimeoutSec 10
    Write-Host "📊 恢復狀態:" -ForegroundColor Gray
    Write-Host "   - 自動恢復已啟用: $($recoveryStatus.data.autoRecoveryEnabled)" -ForegroundColor Gray
    Write-Host "   - 上次恢復: $($recoveryStatus.data.lastRecoveryTimeFormatted)" -ForegroundColor Gray
    Write-Host "   - 恢復中: $($recoveryStatus.data.isRecovering)" -ForegroundColor Gray
    
    if ($recoveryStatus.data.lastRecoveryResult -and $recoveryStatus.data.lastRecoveryResult.success) {
        $stats = $recoveryStatus.data.lastRecoveryResult.statistics
        Write-Host "   - 上次恢復統計:" -ForegroundColor Gray
        Write-Host "     * 材料: $($stats.materialsRecovered)" -ForegroundColor Gray
        Write-Host "     * 訂單: $($stats.ordersRecovered)" -ForegroundColor Gray
        Write-Host "     * 用戶: $($stats.usersRecovered)" -ForegroundColor Gray
        Write-Host "     * 專案: $($stats.projectsRecovered)" -ForegroundColor Gray
        if ($stats.orderItemsRecovered -ne $null) {
            Write-Host "     * 訂單項目: $($stats.orderItemsRecovered)" -ForegroundColor Gray
        } else {
            Write-Host "     * 訂單項目: 未統計 (可能是舊版本)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️ 無法獲取恢復狀態: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. 檢查訂單數據
Write-Host "`n5️⃣ 檢查訂單數據..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders?limit=3" -Method GET -Headers $authHeader -TimeoutSec 10
    
    if ($orders.success -and $orders.data.orders.Count -gt 0) {
        Write-Host "✅ 找到 $($orders.data.orders.Count) 個訂單" -ForegroundColor Green
        
        foreach ($order in $orders.data.orders) {
            Write-Host "`n📋 訂單 $($order.id):" -ForegroundColor Cyan
            Write-Host "   - 狀態: $($order.status)" -ForegroundColor Gray
            Write-Host "   - 創建者: $($order.userId)" -ForegroundColor Gray
            Write-Host "   - 項目數量: $($order.items.Count)" -ForegroundColor Gray
            
            if ($order.items.Count -gt 0) {
                Write-Host "   - 項目詳情:" -ForegroundColor Gray
                foreach ($item in $order.items) {
                    Write-Host "     * 材料ID: $($item.materialId)" -ForegroundColor Gray
                    Write-Host "     * 材料名稱: $($item.materialName)" -ForegroundColor Gray
                    Write-Host "     * 數量: $($item.quantity)" -ForegroundColor Gray
                    Write-Host "     * 圖片URL: $($item.imageUrl)" -ForegroundColor Gray
                    if ($item.material) {
                        Write-Host "     * 關聯材料: ✅ 有" -ForegroundColor Green
                    } else {
                        Write-Host "     * 關聯材料: ❌ 無" -ForegroundColor Red
                    }
                    Write-Host "     ---" -ForegroundColor Gray
                }
            } else {
                Write-Host "   ❌ 沒有項目數據！" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "❌ 沒有找到訂單數據" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 獲取訂單數據失敗: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. 檢查材料數據
Write-Host "`n6️⃣ 檢查材料數據..." -ForegroundColor Yellow
try {
    $materials = Invoke-RestMethod -Uri "$baseUrl/api/materials?limit=3" -Method GET -Headers $authHeader -TimeoutSec 10
    
    if ($materials.success -and $materials.data.materials.Count -gt 0) {
        Write-Host "✅ 找到 $($materials.data.materials.Count) 個材料" -ForegroundColor Green
        
        foreach ($material in $materials.data.materials) {
            Write-Host "   - $($material.id): $($material.name)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ 沒有找到材料數據" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 獲取材料數據失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 診斷完成！" -ForegroundColor Green
Write-Host "如果訂單項目數量為 0 或沒有關聯材料，說明 orderItems 數據沒有正確恢復" -ForegroundColor Yellow