# 雲水基材管理系統 Mobile App 快速測試腳本
# 使用方式: .\quick-test.ps1

Write-Host "🚀 雲水基材管理系統 Mobile App 快速測試" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# 檢查當前目錄
$currentDir = Get-Location
Write-Host "📁 當前目錄: $currentDir" -ForegroundColor Yellow

# 檢查是否在正確的目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 錯誤: 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    Write-Host "請執行: cd mobile-app" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ 在正確的目錄中" -ForegroundColor Green

# 1. 檢查 Node.js 版本
Write-Host "`n🔍 檢查 Node.js 版本..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
    
    # 檢查版本是否符合要求 (v16+)
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 16) {
        Write-Host "⚠️  警告: 建議使用 Node.js v16 或更新版本" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js 未安裝或無法執行" -ForegroundColor Red
    Write-Host "請安裝 Node.js: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 2. 檢查 npm 版本
Write-Host "`n🔍 檢查 npm 版本..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm 未安裝或無法執行" -ForegroundColor Red
    exit 1
}

# 3. 檢查 Expo CLI
Write-Host "`n🔍 檢查 Expo CLI..." -ForegroundColor Cyan
try {
    $expoVersion = npx expo --version 2>$null
    if ($expoVersion) {
        Write-Host "✅ Expo CLI 版本: $expoVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Expo CLI 未安裝，將在需要時自動安裝" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Expo CLI 未安裝，將在需要時自動安裝" -ForegroundColor Yellow
}

# 4. 檢查 EAS CLI
Write-Host "`n🔍 檢查 EAS CLI..." -ForegroundColor Cyan
try {
    $easVersion = npx eas-cli --version 2>$null
    if ($easVersion) {
        Write-Host "✅ EAS CLI 版本: $easVersion" -ForegroundColor Green
    } else {
        Write-Host "⚠️  EAS CLI 未安裝，建置時需要安裝" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  EAS CLI 未安裝，建置時需要安裝" -ForegroundColor Yellow
}

# 5. 檢查依賴是否已安裝
Write-Host "`n🔍 檢查專案依賴..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules 目錄存在" -ForegroundColor Green
    
    # 檢查關鍵依賴
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $dependencies = $packageJson.dependencies
    
    $keyDependencies = @("react", "react-native", "expo", "@react-navigation/native")
    foreach ($dep in $keyDependencies) {
        if ($dependencies.$dep) {
            Write-Host "  ✅ $dep: $($dependencies.$dep)" -ForegroundColor Green
        } else {
            Write-Host "  ❌ 缺少關鍵依賴: $dep" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ node_modules 目錄不存在" -ForegroundColor Red
    Write-Host "正在安裝依賴..." -ForegroundColor Yellow
    
    try {
        npm install
        Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
        Write-Host "請手動執行: npm install" -ForegroundColor Yellow
        exit 1
    }
}

# 6. 檢查 TypeScript 配置
Write-Host "`n🔍 檢查 TypeScript 配置..." -ForegroundColor Cyan
if (Test-Path "tsconfig.json") {
    Write-Host "✅ tsconfig.json 存在" -ForegroundColor Green
    
    try {
        npm run type-check 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ TypeScript 類型檢查通過" -ForegroundColor Green
        } else {
            Write-Host "⚠️  TypeScript 類型檢查有警告" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  無法執行 TypeScript 類型檢查" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ tsconfig.json 不存在" -ForegroundColor Red
}

# 7. 檢查 ESLint 配置
Write-Host "`n🔍 檢查 ESLint 配置..." -ForegroundColor Cyan
if (Test-Path ".eslintrc.js") {
    Write-Host "✅ .eslintrc.js 存在" -ForegroundColor Green
} else {
    Write-Host "⚠️  .eslintrc.js 不存在" -ForegroundColor Yellow
}

# 8. 檢查重要配置檔案
Write-Host "`n🔍 檢查重要配置檔案..." -ForegroundColor Cyan
$configFiles = @("app.json", "eas.json", "babel.config.js", "metro.config.js")
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file 不存在" -ForegroundColor Red
    }
}

# 9. 檢查環境變數檔案
Write-Host "`n🔍 檢查環境變數..." -ForegroundColor Cyan
if (Test-Path ".env") {
    Write-Host "✅ .env 檔案存在" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Write-Host "⚠️  .env 檔案不存在，但有 .env.example" -ForegroundColor Yellow
        Write-Host "建議複製 .env.example 為 .env 並設定環境變數" -ForegroundColor Yellow
    } else {
        Write-Host "❌ .env 和 .env.example 都不存在" -ForegroundColor Red
    }
}

# 10. 檢查後端服務連線 (可選)
Write-Host "`n🔍 檢查後端服務連線..." -ForegroundColor Cyan
try {
    # 嘗試連接本地後端 (假設在 3001 端口)
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ 後端服務正在運行" -ForegroundColor Green
    } else {
        Write-Host "⚠️  後端服務可能未運行" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  無法連接到後端服務 (http://localhost:3001)" -ForegroundColor Yellow
    Write-Host "如需測試完整功能，請確保後端服務正在運行" -ForegroundColor Yellow
}

# 總結和建議
Write-Host "`n📋 測試總結" -ForegroundColor Green
Write-Host "============" -ForegroundColor Green

Write-Host "`n🎯 下一步建議:" -ForegroundColor Cyan
Write-Host "1. 如果所有檢查都通過，可以開始測試:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. 在手機上安裝 Expo Go:" -ForegroundColor White
Write-Host "   Android: https://play.google.com/store/apps/details?id=host.exp.exponent" -ForegroundColor Yellow
Write-Host "   iOS: https://apps.apple.com/app/expo-go/id982107779" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. 掃描 QR 碼或輸入 URL 在手機上測試" -ForegroundColor White
Write-Host ""
Write-Host "4. 詳細測試指南請參考: TESTING_GUIDE.md" -ForegroundColor White

# 提供快速啟動選項
Write-Host "`n🚀 快速操作:" -ForegroundColor Cyan
$choice = Read-Host "是否要立即啟動開發伺服器? (y/n)"
if ($choice -eq "y" -or $choice -eq "Y") {
    Write-Host "正在啟動開發伺服器..." -ForegroundColor Green
    npm start
} else {
    Write-Host "測試完成！準備好時請執行 'npm start'" -ForegroundColor Green
}

Write-Host "`n✨ 測試腳本執行完成！" -ForegroundColor Green