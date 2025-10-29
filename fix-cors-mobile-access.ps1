# 修復移動設備訪問的 CORS 問題
Write-Host "🔧 修復移動設備訪問的 CORS 問題..." -ForegroundColor Yellow

# 獲取本機 IP 地址
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*"})[0].IPAddress
Write-Host "📱 檢測到本機 IP: $ipAddress" -ForegroundColor Green

# 更新前端環境變數
$frontendEnvPath = "frontend\.env.development"
if (Test-Path $frontendEnvPath) {
    Write-Host "📝 更新前端環境變數..." -ForegroundColor Yellow
    
    # 讀取現有內容
    $content = Get-Content $frontendEnvPath
    
    # 更新 API URL
    $newContent = $content -replace "VITE_API_URL=.*", "VITE_API_URL=http://${ipAddress}:3004/api"
    $newContent = $newContent -replace "VITE_WS_URL=.*", "VITE_WS_URL=http://${ipAddress}:3004"
    
    # 寫入文件
    $newContent | Set-Content $frontendEnvPath
    Write-Host "✅ 前端環境變數已更新" -ForegroundColor Green
}

# 檢查後端 CORS 設置
Write-Host "🔍 檢查後端 CORS 設置..." -ForegroundColor Yellow
$backendServerPath = "backend\src\server-simple.ts"
if (Test-Path $backendServerPath) {
    $serverContent = Get-Content $backendServerPath -Raw
    if ($serverContent -match "http://$ipAddress:3000") {
        Write-Host "✅ 後端 CORS 已包含當前 IP" -ForegroundColor Green
    } else {
        Write-Host "⚠️  後端 CORS 需要更新" -ForegroundColor Yellow
        Write-Host "📝 正在更新後端 CORS 設置..." -ForegroundColor Yellow
        
        # 更新 CORS 設置
        $updatedContent = $serverContent -replace "(origin: \[[\s\S]*?)'http://localhost:3000',", "`$1'http://localhost:3000',`n    'http://${ipAddress}:3000',"
        $updatedContent | Set-Content $backendServerPath
        Write-Host "✅ 後端 CORS 設置已更新" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎯 修復完成！現在可以執行以下步驟:" -ForegroundColor Green
Write-Host "1. 重新啟動後端服務器" -ForegroundColor White
Write-Host "2. 重新啟動前端服務器" -ForegroundColor White
Write-Host "3. 從 http://${ipAddress}:3000 訪問系統" -ForegroundColor White
Write-Host ""
Write-Host "📱 移動設備訪問地址: http://${ipAddress}:3000" -ForegroundColor Cyan
Write-Host "🖥️  PC 本地訪問地址: http://localhost:3000" -ForegroundColor Cyan