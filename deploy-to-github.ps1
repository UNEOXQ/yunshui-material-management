# 雲水基材管理系統 - GitHub部署腳本
Write-Host "🚀 雲水基材管理系統 - GitHub部署腳本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 檢查Git是否安裝
try {
    $gitVersion = git --version
    Write-Host "✅ Git已安裝: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git未安裝！" -ForegroundColor Red
    Write-Host "請先安裝Git:" -ForegroundColor Yellow
    Write-Host "1. 前往 https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. 下載並安裝 Git for Windows" -ForegroundColor White
    Write-Host "3. 重新啟動命令提示字元後再試" -ForegroundColor White
    Read-Host "按Enter鍵退出"
    exit 1
}

# 檢查是否已初始化Git
if (-not (Test-Path ".git")) {
    Write-Host "初始化Git倉庫..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git倉庫已初始化" -ForegroundColor Green
} else {
    Write-Host "✅ Git倉庫已存在" -ForegroundColor Green
}

Write-Host ""
Write-Host "添加所有文件到Git..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "提交更改..." -ForegroundColor Yellow
git commit -m "部署準備: 雲水基材管理系統"

Write-Host ""
Write-Host "設定主分支..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "⚠️  重要提醒: 你需要先在GitHub創建倉庫" -ForegroundColor Yellow
Write-Host ""
Write-Host "建議倉庫名稱: yunshui-material-management" -ForegroundColor White
Write-Host ""
Write-Host "創建完成後，請執行以下指令:" -ForegroundColor Yellow
Write-Host "git remote add origin https://github.com/你的用戶名/yunshui-material-management.git" -ForegroundColor White
Write-Host "git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "請將 '你的用戶名' 替換為你的實際GitHub用戶名" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "按Enter鍵繼續"