# 解決 Expo 版本相容性問題的腳本

Write-Host "🔧 解決 Expo 版本相容性問題" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# 檢查目錄
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 請在 mobile-app 目錄中執行此腳本" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 當前問題分析:" -ForegroundColor Cyan
Write-Host "- Expo Go 版本: SDK 54" -ForegroundColor Yellow
Write-Host "- 專案版本: SDK 49" -ForegroundColor Yellow
Write-Host "- 問題: 版本不相容" -ForegroundColor Red

Write-Host "`n🎯 解決方案選項:" -ForegroundColor Cyan
Write-Host "1. 升級專案到 SDK 51 (相容 SDK 54)" -ForegroundColor White
Write-Host "2. 建立全新的 SDK 51 專案" -ForegroundColor White
Write-Host "3. 使用 Expo Development Build" -ForegroundColor White
Write-Host "4. 降級 Expo Go (不推薦)" -ForegroundColor White

$choice = Read-Host "`n選擇解決方案 (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 方案 1: 升級專案到 SDK 51" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        
        Write-Host "`n1️⃣ 備份當前專案..." -ForegroundColor Yellow
        $backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item -Recurse -Path "." -Destination "../$backupDir" -Exclude "node_modules"
        Write-Host "✅ 專案已備份到 ../$backupDir" -ForegroundColor Green
        
        Write-Host "`n2️⃣ 升級 Expo SDK..." -ForegroundColor Yellow
        try {
            # 升級到 SDK 51
            npm install expo@~51.0.0
            npx expo install --fix
            Write-Host "✅ SDK 升級完成" -ForegroundColor Green
        } catch {
            Write-Host "❌ SDK 升級失敗" -ForegroundColor Red
            Write-Host "請手動執行: npm install expo@~51.0.0" -ForegroundColor Yellow
        }
        
        Write-Host "`n3️⃣ 清除快取並重新安裝..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item package-lock.json -ErrorAction SilentlyContinue
        npm install
        
        Write-Host "`n4️⃣ 測試啟動..." -ForegroundColor Yellow
        npx expo start --tunnel
    }
    
    "2" {
        Write-Host "`n🆕 方案 2: 建立全新的 SDK 51 專案" -ForegroundColor Green
        Write-Host "===================================" -ForegroundColor Green
        
        Write-Host "`n⚠️  這會建立一個新的專案目錄" -ForegroundColor Yellow
        $confirm = Read-Host "確定要繼續嗎? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "`n1️⃣ 建立新專案..." -ForegroundColor Yellow
            Set-Location ..
            npx create-expo-app yunshui-mobile-new --template blank-typescript
            
            Write-Host "`n2️⃣ 複製現有程式碼..." -ForegroundColor Yellow
            Copy-Item "yunshui-mobile/App.tsx" "yunshui-mobile-new/App.tsx" -Force
            Copy-Item "yunshui-mobile/app.json" "yunshui-mobile-new/app.json" -Force
            
            Write-Host "`n3️⃣ 進入新專案目錄..." -ForegroundColor Yellow
            Set-Location yunshui-mobile-new
            
            Write-Host "`n4️⃣ 啟動新專案..." -ForegroundColor Yellow
            npx expo start --tunnel
        }
    }
    
    "3" {
        Write-Host "`n📱 方案 3: 使用 Expo Development Build" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        
        Write-Host "`n⚠️  需要 Android Studio 或 Xcode" -ForegroundColor Yellow
        Write-Host "這會在你的手機上安裝專用的開發版本" -ForegroundColor White
        
        $confirm = Read-Host "確定要繼續嗎? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "`n1️⃣ 安裝 Development Build 依賴..." -ForegroundColor Yellow
            npx expo install expo-dev-client
            
            Write-Host "`n2️⃣ 建立 Development Build..." -ForegroundColor Yellow
            Write-Host "請確保手機已連接並啟用 USB 除錯" -ForegroundColor White
            npx expo run:android
        }
    }
    
    "4" {
        Write-Host "`n📱 方案 4: 降級 Expo Go" -ForegroundColor Green
        Write-Host "========================" -ForegroundColor Green
        
        Write-Host "`n⚠️  不推薦此方案，但可以嘗試" -ForegroundColor Yellow
        Write-Host "需要手動下載舊版 Expo Go APK" -ForegroundColor White
        Write-Host "SDK 49 相容的 Expo Go 版本資訊:" -ForegroundColor White
        Write-Host "- 前往 https://github.com/expo/expo/releases" -ForegroundColor Cyan
        Write-Host "- 尋找 SDK 49 相關的 release" -ForegroundColor Cyan
        Write-Host "- 下載對應的 Expo Go APK" -ForegroundColor Cyan
    }
    
    default {
        Write-Host "`n❌ 無效選擇" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n💡 其他建議:" -ForegroundColor Cyan
Write-Host "- 如果方案 1 失敗，建議使用方案 2" -ForegroundColor White
Write-Host "- 方案 3 是最穩定的長期解決方案" -ForegroundColor White
Write-Host "- 可以同時保留多個版本進行測試" -ForegroundColor White