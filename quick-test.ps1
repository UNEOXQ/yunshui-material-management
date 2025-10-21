Write-Host "=== 快速 CORS 測試 ===" -ForegroundColor Green

# 檢查後端是否運行
Write-Host "檢查後端服務器..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 後端服務器運行中 (狀態: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務器未運行，請先啟動後端" -ForegroundColor Red
    Write-Host "使用命令: cd backend && npm run dev" -ForegroundColor Cyan
    exit 1
}

# 測試圖片 URL
Write-Host "`n測試圖片 CORS..." -ForegroundColor Yellow
$testUrl = "http://localhost:3004/uploads/materials/LOGO-1760471119261-231160952.png"

try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ 圖片請求成功 (狀態: $($response.StatusCode))" -ForegroundColor Green
    
    # 檢查 CORS 頭
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    if ($corsHeader) {
        Write-Host "✅ CORS 頭存在: $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "❌ 缺少 CORS 頭" -ForegroundColor Red
    }
    
    $corpHeader = $response.Headers['Cross-Origin-Resource-Policy']
    if ($corpHeader) {
        Write-Host "✅ CORP 頭存在: $corpHeader" -ForegroundColor Green
    } else {
        Write-Host "❌ 缺少 CORP 頭" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 圖片請求失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n請在瀏覽器中打開 test-cors.html 進行完整測試" -ForegroundColor Cyan