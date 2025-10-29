# 雲水基材管理系統 - Android APK 建置工具 (PowerShell)
param(
    [Parameter(Position=0)]
    [ValidateSet("debug", "preview", "release")]
    [string]$Profile = "preview",
    
    [switch]$Local = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "雲水基材管理系統 - Android APK 建置工具" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法:" -ForegroundColor Yellow
    Write-Host "  .\build-apk.ps1 [profile] [-Local] [-Help]" -ForegroundColor White
    Write-Host ""
    Write-Host "參數:" -ForegroundColor Yellow
    Write-Host "  profile    建置設定檔 (debug/preview/release)，預設: preview" -ForegroundColor White
    Write-Host "  -Local     使用本地建置 (不使用 Expo 雲端服務)" -ForegroundColor White
    Write-Host "  -Help      顯示此說明" -ForegroundColor White
    Write-Host ""
    Write-Host "範例:" -ForegroundColor Yellow
    Write-Host "  .\build-apk.ps1 preview" -ForegroundColor White
    Write-Host "  .\build-apk.ps1 debug -Local" -ForegroundColor White
    exit 0
}

Write-Host "雲水基材管理系統 - Android APK 建置工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未找到 Node.js，請先安裝 Node.js" -ForegroundColor Red
    exit 1
}

# 檢查 npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 未找到 npm" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 開始建置 Android APK ($Profile 模式)..." -ForegroundColor Yellow

try {
    # 切換到專案目錄
    Set-Location $PSScriptRoot
    
    # 檢查 package.json
    if (-not (Test-Path "package.json")) {
        throw "未找到 package.json 檔案"
    }
    
    # 安裝依賴 (如果需要)
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 安裝專案依賴..." -ForegroundColor Yellow
        npm install
    }
    
    # 執行建置腳本
    $buildArgs = @($Profile)
    if ($Local) {
        $buildArgs += "--local"
    }
    
    node scripts/build-android.js @buildArgs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ 建置成功完成！" -ForegroundColor Green
        Write-Host "📱 APK 檔案已生成，可以直接安裝到 Android 設備上" -ForegroundColor Green
        
        # 嘗試找到生成的 APK 檔案
        $apkFiles = Get-ChildItem -Path . -Filter "*.apk" -Recurse | Sort-Object LastWriteTime -Descending
        if ($apkFiles.Count -gt 0) {
            Write-Host ""
            Write-Host "📁 最新的 APK 檔案:" -ForegroundColor Cyan
            $apkFiles[0..2] | ForEach-Object {
                Write-Host "   $($_.FullName)" -ForegroundColor White
            }
        }
    } else {
        throw "建置過程發生錯誤"
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ 建置失敗: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "按任意鍵繼續..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")