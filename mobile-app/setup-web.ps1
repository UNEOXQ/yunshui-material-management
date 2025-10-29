# 設置 Web 支援並啟動應用程式

Write-Host "🌐 設置 Web 支援並啟動" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

# 檢查目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 安裝 Web 支援依賴..." -ForegroundColor Cyan
Write-Host "正在安裝 react-native-web 和 webpack-config..." -ForegroundColor White

try {
    npx expo install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Web 支援依賴安裝完成" -ForegroundColor Green
    } else {
        throw "安裝失敗"
    }
} catch {
    Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
    Write-Host "請檢查網路連線或手動執行:" -ForegroundColor Yellow
    Write-Host "npx expo install react-native-web@~0.19.6 @expo/webpack-config@^19.0.0" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🚀 啟動 Web 版本..." -ForegroundColor Cyan
Write-Host "📱 應用程式將在瀏覽器中開啟" -ForegroundColor White
Write-Host "🔗 URL: http://localhost:8081" -ForegroundColor White

try {
    npx expo start --web
} catch {
    Write-Host "❌ 啟動失敗" -ForegroundColor Red
    Write-Host "請嘗試手動執行: npx expo start --web" -ForegroundColor Yellow
}

Write-Host "`n💡 如果瀏覽器沒有自動開啟，請手動前往:" -ForegroundColor Cyan
Write-Host "http://localhost:8081" -ForegroundColor Green