Write-Host "檢查數據來源..." -ForegroundColor Green

# 測試後端 API
Write-Host "`n1. 測試後端 API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 後端 API 可用 (狀態: $($response.StatusCode))" -ForegroundColor Green
    
    # 解析 JSON 響應
    $jsonResponse = $response.Content | ConvertFrom-Json
    if ($jsonResponse.success -and $jsonResponse.data.materials) {
        $materialCount = $jsonResponse.data.materials.Count
        Write-Host "   - 後端材料數量: $materialCount" -ForegroundColor Cyan
        
        # 顯示前幾個材料名稱
        $materialNames = $jsonResponse.data.materials | Select-Object -First 3 | ForEach-Object { $_.name }
        Write-Host "   - 前3個材料: $($materialNames -join ', ')" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ 後端 API 不可用: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   - 前端會使用模擬數據" -ForegroundColor Yellow
}

# 檢查前端是否運行
Write-Host "`n2. 檢查前端狀態..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 前端可用 (狀態: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端不可用: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n結論:" -ForegroundColor Green
Write-Host "- 如果後端 API 可用，你看到的是真實數據" -ForegroundColor Cyan
Write-Host "- 如果後端 API 不可用，你看到的是模擬數據" -ForegroundColor Cyan
Write-Host "- 檢查瀏覽器 F12 控制台是否有 '使用模擬數據' 的警告" -ForegroundColor Cyan