# 雲水基材管理系統停止腳本
Write-Host "🛑 停止雲水基材管理系統" -ForegroundColor Red
Write-Host "================================" -ForegroundColor Red

Write-Host "正在停止前端和後端服務..." -ForegroundColor Yellow

# 停止佔用 3001 端口的程序 (前端)
$frontend = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($frontend) {
    $frontendPID = $frontend.OwningProcess
    Write-Host "停止前端服務 (PID: $frontendPID)" -ForegroundColor Yellow
    Stop-Process -Id $frontendPID -Force -ErrorAction SilentlyContinue
}

# 停止佔用 3003 端口的程序 (後端)
$backend = Get-NetTCPConnection -LocalPort 3003 -ErrorAction SilentlyContinue
if ($backend) {
    $backendPID = $backend.OwningProcess
    Write-Host "停止後端服務 (PID: $backendPID)" -ForegroundColor Yellow
    Stop-Process -Id $backendPID -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ 系統已停止！" -ForegroundColor Green
Write-Host ""

Read-Host "按 Enter 鍵退出"