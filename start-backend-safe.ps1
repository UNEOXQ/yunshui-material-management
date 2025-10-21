# 安全啟動後端腳本
Write-Host "停止所有現有的 Node.js 進程..." -ForegroundColor Yellow

# 停止所有 node 和 nodemon 進程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Stop-Process -Force

# 等待進程完全停止
Start-Sleep -Seconds 3

Write-Host "清理 dist 目錄..." -ForegroundColor Yellow
if (Test-Path "backend/dist") {
    Remove-Item -Recurse -Force "backend/dist"
}

Write-Host "進入後端目錄..." -ForegroundColor Green
Set-Location backend

Write-Host "檢查 nodemon 配置..." -ForegroundColor Green
if (-not (Test-Path "nodemon.json")) {
    Write-Host "創建 nodemon.json 配置..." -ForegroundColor Yellow
}

Write-Host "使用安全模式啟動後端服務器..." -ForegroundColor Green
Write-Host "如果仍然無限重啟，請使用: npm run dev:simple" -ForegroundColor Yellow

# 嘗試使用配置好的 nodemon
npm run dev

Write-Host "後端啟動完成！" -ForegroundColor Green