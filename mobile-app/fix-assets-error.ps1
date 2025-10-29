# 修復 "Failed to load all assets" 錯誤

Write-Host "🔧 修復資源載入錯誤" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

Write-Host "`n📋 問題診斷:" -ForegroundColor Cyan
Write-Host "錯誤: Failed to load all assets" -ForegroundColor Red
Write-Host "原因: app.json 引用了不存在的資源文件" -ForegroundColor Yellow

Write-Host "`n✅ 已執行的修復:" -ForegroundColor Green
Write-Host "1. 建立 assets 目錄" -ForegroundColor White
Write-Host "2. 移除 app.json 中不存在的圖片引用" -ForegroundColor White
Write-Host "3. 簡化 App.tsx 移除可能有問題的依賴" -ForegroundColor White

Write-Host "`n🔄 現在嘗試重新啟動..." -ForegroundColor Cyan

# 檢查當前目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    exit 1
}

# 檢查 assets 目錄
if (-not (Test-Path "assets")) {
    Write-Host "📁 建立 assets 目錄..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "assets" -Force | Out-Null
}

Write-Host "✅ assets 目錄已存在" -ForegroundColor Green

# 檢查 app.json
Write-Host "`n📄 檢查 app.json 配置..." -ForegroundColor Cyan
$appJson = Get-Content "app.json" -Raw | ConvertFrom-Json

if ($appJson.expo.icon) {
    Write-Host "⚠️  app.json 仍然引用 icon，需要手動移除" -ForegroundColor Yellow
} else {
    Write-Host "✅ app.json 配置已清理" -ForegroundColor Green
}

Write-Host "`n🚀 啟動選項:" -ForegroundColor Cyan
Write-Host "1. 清除快取並啟動 Tunnel 模式 (推薦)" -ForegroundColor White
Write-Host "2. 僅啟動 Tunnel 模式" -ForegroundColor White
Write-Host "3. 嘗試 LAN 模式" -ForegroundColor White

$choice = Read-Host "`n選擇 (1-3) 或按 Enter 使用選項 1"

switch ($choice) {
    "2" {
        Write-Host "`n🚇 啟動 Tunnel 模式..." -ForegroundColor Green
        npx expo start --tunnel
    }
    "3" {
        Write-Host "`n🌐 啟動 LAN 模式..." -ForegroundColor Green
        npx expo start --lan
    }
    default {
        Write-Host "`n🧹 清除快取並啟動 Tunnel 模式..." -ForegroundColor Green
        npx expo start --clear --tunnel
    }
}

Write-Host "`n💡 如果仍有問題:" -ForegroundColor Cyan
Write-Host "1. 確保 Expo Go 是最新版本" -ForegroundColor White
Write-Host "2. 在 Expo Go 中清除快取" -ForegroundColor White
Write-Host "3. 重新啟動手機和電腦" -ForegroundColor White
Write-Host "4. 檢查網路連線" -ForegroundColor White