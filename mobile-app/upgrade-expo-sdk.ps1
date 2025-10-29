# 升級 Expo SDK 到 54 的腳本

Write-Host "🚀 升級 Expo SDK 到 54" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

# 檢查目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 當前狀態:" -ForegroundColor Cyan
Write-Host "- 專案 SDK: 49" -ForegroundColor Yellow
Write-Host "- Expo Go SDK: 54" -ForegroundColor Yellow
Write-Host "- 需要升級專案到 SDK 54" -ForegroundColor Yellow

Write-Host "`n🔧 開始升級流程..." -ForegroundColor Cyan

# 1. 備份當前 package.json
Write-Host "`n1️⃣ 備份當前配置..." -ForegroundColor Yellow
Copy-Item "package.json" "package.json.backup" -Force
Write-Host "✅ 已備份 package.json" -ForegroundColor Green

# 2. 升級 Expo SDK
Write-Host "`n2️⃣ 升級 Expo SDK..." -ForegroundColor Yellow
try {
    # 使用 npx expo install --fix 來自動升級相容的版本
    npx expo install --fix
    Write-Host "✅ Expo SDK 升級完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️  自動升級失敗，嘗試手動升級..." -ForegroundColor Yellow
    
    # 手動升級關鍵套件
    npm install expo@~51.0.0
    npx expo install --fix
}

# 3. 清除快取
Write-Host "`n3️⃣ 清除快取..." -ForegroundColor Yellow
try {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
    Remove-Item package-lock.json -ErrorAction SilentlyContinue
    npm install
    Write-Host "✅ 快取清除並重新安裝完成" -ForegroundColor Green
} catch {
    Write-Host "⚠️  請手動執行: rm -rf node_modules && npm install" -ForegroundColor Yellow
}

# 4. 檢查升級結果
Write-Host "`n4️⃣ 檢查升級結果..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$expoVersion = $packageJson.dependencies.expo

Write-Host "當前 Expo 版本: $expoVersion" -ForegroundColor White

if ($expoVersion -match "51|52|53|54") {
    Write-Host "✅ 升級成功！" -ForegroundColor Green
} else {
    Write-Host "⚠️  可能需要手動調整版本" -ForegroundColor Yellow
}

Write-Host "`n🚀 現在可以嘗試啟動:" -ForegroundColor Cyan
Write-Host "npx expo start --tunnel" -ForegroundColor Green

Write-Host "`n💡 如果仍有問題:" -ForegroundColor Cyan
Write-Host "1. 檢查 Expo Go 是否為最新版本" -ForegroundColor White
Write-Host "2. 重新啟動 Expo Go 應用程式" -ForegroundColor White
Write-Host "3. 清除 Expo Go 快取" -ForegroundColor White

$choice = Read-Host "`n是否立即啟動 Expo? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "`n🚇 啟動 Tunnel 模式..." -ForegroundColor Green
    npx expo start --tunnel --clear
}