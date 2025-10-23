# 監控 Render 部署狀態

Write-Host "監控 Render 部署狀態..." -ForegroundColor Cyan

$baseUrl = "https://yunshui-backend1.onrender.com"

while ($true) {
    Write-Host "`n$(Get-Date -Format 'HH:mm:ss') - 檢查部署狀態..." -ForegroundColor Yellow
    
    try {
        # 檢查健康狀態
        $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 5
        Write-Host "服務運行時間: $([math]::Round($health.uptime / 60, 1)) 分鐘" -ForegroundColor Gray
        
        # 登錄
        $loginBody = '{"username":"admin","password":"admin123"}'
        $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 5
        $token = $login.data.token
        $authHeader = @{ 'Authorization' = "Bearer $token" }
        
        # 檢查恢復 API 是否存在
        try {
            $recovery = Invoke-RestMethod -Uri "$baseUrl/api/backup/recovery/status" -Method GET -Headers $authHeader -TimeoutSec 5
            Write-Host "✅ 恢復 API 已部署！" -ForegroundColor Green
            
            # 檢查訂單 API
            try {
                $orders = Invoke-RestMethod -Uri "$baseUrl/api/orders?limit=1" -Method GET -Headers $authHeader -TimeoutSec 5
                Write-Host "✅ 訂單 API 正常！" -ForegroundColor Green
                Write-Host "🎉 部署完成，所有 API 正常工作！" -ForegroundColor Green
                break
            } catch {
                Write-Host "⚠️ 恢復 API 已部署，但訂單 API 仍有問題" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⏳ 恢復 API 尚未部署..." -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "❌ 服務連接失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 30
}

Write-Host "`n部署監控完成！" -ForegroundColor Green