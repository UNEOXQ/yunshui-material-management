# 檢查前端部署狀態

Write-Host "檢查前端部署狀態" -ForegroundColor Cyan

$frontendUrl = "https://yunshui-frontend.vercel.app"

# 檢查前端是否可訪問
try {
    $response = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 10
    Write-Host "✅ 前端網站可訪問" -ForegroundColor Green
    Write-Host "狀態碼: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ 前端網站無法訪問: $($_.Exception.Message)" -ForegroundColor Red
}

# 檢查是否包含最新的 JavaScript 文件
try {
    $content = Invoke-WebRequest -Uri $frontendUrl -Method GET -TimeoutSec 10
    
    if ($content.Content -like "*processUserData*") {
        Write-Host "✅ 最新的用戶映射邏輯已部署" -ForegroundColor Green
    } else {
        Write-Host "⚠️ 用戶映射邏輯尚未部署" -ForegroundColor Yellow
    }
    
    if ($content.Content -like "*userUtils*") {
        Write-Host "✅ userUtils 模組已部署" -ForegroundColor Green
    } else {
        Write-Host "⚠️ userUtils 模組尚未部署" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 無法檢查前端內容" -ForegroundColor Red
}

Write-Host "`n建議：" -ForegroundColor Yellow
Write-Host "1. 清除瀏覽器緩存 (Ctrl+F5)" -ForegroundColor Gray
Write-Host "2. 清除 localStorage (F12 控制台執行 localStorage.clear())" -ForegroundColor Gray
Write-Host "3. 等待 Vercel 自動部署完成 (2-5分鐘)" -ForegroundColor Gray