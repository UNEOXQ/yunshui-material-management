# 雲水基材管理系統啟動腳本
Write-Host "🚀 啟動雲水基材管理系統..." -ForegroundColor Green
Write-Host ""

# 檢查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安裝" -ForegroundColor Red
    Read-Host "按 Enter 退出"
    exit 1
}

# 停止現有進程
Write-Host "🧹 清理現有進程..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 啟動後端
Write-Host "🔧 啟動後端服務..." -ForegroundColor Cyan
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# 等待後端啟動
Write-Host "⏳ 等待後端啟動..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 啟動前端
Write-Host "🎨 啟動前端服務..." -ForegroundColor Cyan
Set-Location ../frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal

# 返回根目錄
Set-Location ..

Write-Host ""
Write-Host "✅ 服務啟動完成!" -ForegroundColor Green
Write-Host "📱 前端: http://localhost:3002/" -ForegroundColor Cyan
Write-Host "🔧 後端: http://localhost:3004/" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示: 關閉 PowerShell 視窗即可停止對應服務" -ForegroundColor Yellow

# 等待幾秒後打開瀏覽器
Start-Sleep -Seconds 3
Start-Process "http://localhost:3002/"

Read-Host "按 Enter 關閉此視窗"