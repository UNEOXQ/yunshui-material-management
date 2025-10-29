# 終極修復腳本 - 解決 "Failed to load all assets" 問題

Write-Host "🚀 雲水基材管理系統 Mobile App 終極修復" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# 檢查目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔧 執行完整修復流程..." -ForegroundColor Cyan

# 1. 停止可能的衝突進程
Write-Host "`n1️⃣ 停止可能衝突的進程..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "expo" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 已停止相關進程" -ForegroundColor Green
} catch {
    Write-Host "⚠️  無需停止進程" -ForegroundColor Yellow
}

Start-Sleep -Seconds 2

# 2. 清除所有快取
Write-Host "`n2️⃣ 清除所有快取..." -ForegroundColor Yellow
try {
    if (Test-Path "node_modules\.cache") {
        Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    }
    if (Test-Path ".expo") {
        Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    }
    Write-Host "✅ 快取已清除" -ForegroundColor Green
} catch {
    Write-Host "⚠️  快取清除完成" -ForegroundColor Yellow
}

# 3. 檢查配置文件
Write-Host "`n3️⃣ 檢查配置文件..." -ForegroundColor Yellow

# 檢查 app.json
$appJsonContent = Get-Content "app.json" -Raw
if ($appJsonContent -match '"icon"' -or $appJsonContent -match '"image"' -or $appJsonContent -match '"assetBundlePatterns"') {
    Write-Host "⚠️  app.json 可能仍有問題配置" -ForegroundColor Yellow
} else {
    Write-Host "✅ app.json 配置正確" -ForegroundColor Green
}

# 檢查 App.tsx
if (Test-Path "App.tsx") {
    Write-Host "✅ App.tsx 存在" -ForegroundColor Green
} else {
    Write-Host "❌ App.tsx 不存在" -ForegroundColor Red
}

# 4. 檢查網路和端口
Write-Host "`n4️⃣ 檢查網路和端口..." -ForegroundColor Yellow
$port8081 = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
$port8082 = Get-NetTCPConnection -LocalPort 8082 -ErrorAction SilentlyContinue

if ($port8081) {
    Write-Host "⚠️  端口 8081 被佔用" -ForegroundColor Yellow
} else {
    Write-Host "✅ 端口 8081 可用" -ForegroundColor Green
}

if ($port8082) {
    Write-Host "⚠️  端口 8082 被佔用" -ForegroundColor Yellow
} else {
    Write-Host "✅ 端口 8082 可用" -ForegroundColor Green
}

# 5. 啟動選項
Write-Host "`n🚀 選擇啟動方式:" -ForegroundColor Cyan
Write-Host "1. Tunnel 模式 (最穩定，推薦)" -ForegroundColor White
Write-Host "2. LAN 模式 (較快，但可能有網路問題)" -ForegroundColor White
Write-Host "3. 指定端口 8082 的 Tunnel 模式" -ForegroundColor White
Write-Host "4. 完全重新安裝依賴後啟動" -ForegroundColor White

$choice = Read-Host "`n選擇 (1-4) 或按 Enter 使用選項 1"

switch ($choice) {
    "2" {
        Write-Host "`n🌐 啟動 LAN 模式..." -ForegroundColor Green
        npx expo start --lan --clear
    }
    "3" {
        Write-Host "`n🚇 啟動 Tunnel 模式 (端口 8082)..." -ForegroundColor Green
        npx expo start --tunnel --port 8082 --clear
    }
    "4" {
        Write-Host "`n📦 重新安裝依賴..." -ForegroundColor Green
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item package-lock.json -ErrorAction SilentlyContinue
        npm install
        Write-Host "`n🚇 啟動 Tunnel 模式..." -ForegroundColor Green
        npx expo start --tunnel --clear
    }
    default {
        Write-Host "`n🚇 啟動 Tunnel 模式..." -ForegroundColor Green
        npx expo start --tunnel --clear
    }
}

Write-Host "`n💡 重要提醒:" -ForegroundColor Cyan
Write-Host "1. 等待看到 'Tunnel ready' 或 'Metro waiting' 訊息" -ForegroundColor White
Write-Host "2. 確保 Expo Go 是最新版本" -ForegroundColor White
Write-Host "3. 在 Expo Go 中清除快取 (Profile > Settings > Clear cache)" -ForegroundColor White
Write-Host "4. 如果仍失敗，嘗試重新啟動手機" -ForegroundColor White