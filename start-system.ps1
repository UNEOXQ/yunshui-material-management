# 雲水基材管理系統啟動腳本
# PowerShell 版本

Write-Host "================================" -ForegroundColor Cyan
Write-Host "雲水基材管理系統 - 系統啟動" -ForegroundColor Cyan  
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# 設置錯誤處理
$ErrorActionPreference = "Continue"

try {
    # 檢查 Node.js
    Write-Host "[1/7] 檢查 Node.js..." -ForegroundColor Yellow
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js 未安裝" -ForegroundColor Red
        Write-Host "請從 https://nodejs.org/ 下載安裝 Node.js" -ForegroundColor Yellow
        Read-Host "按 Enter 退出"
        exit 1
    }

    # 檢查 npm
    Write-Host ""
    Write-Host "[2/7] 檢查 npm..." -ForegroundColor Yellow
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ npm 版本: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm 未安裝" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    # 檢查項目結構
    Write-Host ""
    Write-Host "[3/7] 檢查項目結構..." -ForegroundColor Yellow
    if (Test-Path "backend") {
        Write-Host "✅ backend 目錄存在" -ForegroundColor Green
    } else {
        Write-Host "❌ backend 目錄不存在" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    if (Test-Path "frontend") {
        Write-Host "✅ frontend 目錄存在" -ForegroundColor Green
    } else {
        Write-Host "❌ frontend 目錄不存在" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    # 檢查配置文件
    Write-Host ""
    Write-Host "[4/7] 檢查配置文件..." -ForegroundColor Yellow
    if (Test-Path "backend/package.json") {
        Write-Host "✅ backend/package.json 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ backend/package.json 不存在" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    if (Test-Path "frontend/package.json") {
        Write-Host "✅ frontend/package.json 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ frontend/package.json 不存在" -ForegroundColor Red
        Read-Host "按 Enter 退出"
        exit 1
    }

    # 檢查依賴
    Write-Host ""
    Write-Host "[5/7] 檢查後端依賴..." -ForegroundColor Yellow
    if (Test-Path "backend/node_modules") {
        Write-Host "✅ backend/node_modules 存在" -ForegroundColor Green
    } else {
        Write-Host "⚠️ backend/node_modules 不存在，正在安裝..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 後端依賴安裝失敗" -ForegroundColor Red
            Set-Location ..
            Read-Host "按 Enter 退出"
            exit 1
        }
        Set-Location ..
        Write-Host "✅ 後端依賴安裝完成" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "[6/7] 檢查前端依賴..." -ForegroundColor Yellow
    if (Test-Path "frontend/node_modules") {
        Write-Host "✅ frontend/node_modules 存在" -ForegroundColor Green
    } else {
        Write-Host "⚠️ frontend/node_modules 不存在，正在安裝..." -ForegroundColor Yellow
        Set-Location frontend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 前端依賴安裝失敗" -ForegroundColor Red
            Set-Location ..
            Read-Host "按 Enter 退出"
            exit 1
        }
        Set-Location ..
        Write-Host "✅ 前端依賴安裝完成" -ForegroundColor Green
    }

    # 清理舊進程
    Write-Host ""
    Write-Host "[7/7] 清理舊進程..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ 舊進程已清理" -ForegroundColor Green

    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "開始啟動服務..." -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""

    # 啟動後端
    Write-Host "🔧 啟動後端服務..." -ForegroundColor Cyan
    Set-Location backend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '後端服務啟動中...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Set-Location ..

    # 等待後端啟動
    Write-Host "⏳ 等待後端啟動..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    # 啟動前端
    Write-Host "🎨 啟動前端服務..." -ForegroundColor Cyan
    Set-Location frontend
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '前端服務啟動中...' -ForegroundColor Green; npm run dev" -WindowStyle Normal
    Set-Location ..

    Write-Host ""
    Write-Host "================================" -ForegroundColor Green
    Write-Host "✅ 啟動完成！" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📱 前端應用: http://localhost:3002/" -ForegroundColor Cyan
    Write-Host "🔧 後端 API: http://localhost:3004/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 提示:" -ForegroundColor Yellow
    Write-Host "- 兩個服務在新的 PowerShell 視窗中運行" -ForegroundColor White
    Write-Host "- 關閉對應的視窗即可停止服務" -ForegroundColor White
    Write-Host ""

    # 等待並打開瀏覽器
    Write-Host "🌐 3秒後自動打開瀏覽器..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    Start-Process "http://localhost:3002/"

} catch {
    Write-Host ""
    Write-Host "❌ 發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

Read-Host "按 Enter 關閉此視窗"