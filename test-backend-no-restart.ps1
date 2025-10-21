# 測試後端不重啟腳本
Write-Host "停止所有現有的 Node.js 進程..." -ForegroundColor Yellow

# 停止所有 node 和 nodemon 進程
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name "nodemon" -ErrorAction SilentlyContinue | Stop-Process -Force

# 等待進程完全停止
Start-Sleep -Seconds 3

Write-Host "進入後端目錄..." -ForegroundColor Green
Set-Location backend

Write-Host "使用更新的配置啟動後端..." -ForegroundColor Green
Write-Host "已禁用開發環境下的自動保存功能" -ForegroundColor Yellow
Write-Host "已更新 nodemon 配置忽略 data 目錄" -ForegroundColor Yellow

npm run dev

Write-Host "後端啟動完成！" -ForegroundColor Green