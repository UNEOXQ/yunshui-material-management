# 檢查 Vercel 部署狀態
param(
    [switch]$NoExit
)

Write-Host "🔍 檢查 Vercel 部署狀態..." -ForegroundColor Green

try {
    # 檢查 vercel.json 配置
    Write-Host "`n📄 檢查 vercel.json 配置..." -ForegroundColor Yellow
    if (Test-Path "vercel.json") {
        Write-Host "✅ vercel.json 存在" -ForegroundColor Green
        Get-Content "vercel.json" | Write-Host
    } else {
        Write-Host "❌ vercel.json 不存在！" -ForegroundColor Red
    }

    # 檢查最近的 Git 提交
    Write-Host "`n📋 最近的 Git 提交:" -ForegroundColor Yellow
    git log --oneline -5

    # 檢查 Git 遠程倉庫
    Write-Host "`n🔗 Git 遠程倉庫:" -ForegroundColor Yellow
    git remote -v

    # 檢查當前分支
    Write-Host "`n🌿 當前分支:" -ForegroundColor Yellow
    git branch --show-current

    # 檢查 Git 狀態
    Write-Host "`n📊 Git 狀態:" -ForegroundColor Yellow
    git status --porcelain

    Write-Host "`n✅ 從你的截圖看到:" -ForegroundColor Green
    Write-Host "- GitHub 連接正常 (UNEOXQ/yunshui-material-management)" -ForegroundColor White
    Write-Host "- 自動部署已啟用" -ForegroundColor White
    Write-Host "- 但最後部署是手動觸發的" -ForegroundColor Yellow

    Write-Host "`n🚨 可能的問題:" -ForegroundColor Red
    Write-Host "1. GitHub webhook 可能有延遲或失效" -ForegroundColor White
    Write-Host "2. Vercel 可能在處理大量部署請求" -ForegroundColor White
    Write-Host "3. 構建配置可能有衝突" -ForegroundColor White

    Write-Host "`n🔧 建議解決方案:" -ForegroundColor Cyan
    Write-Host "1. 在 Vercel 項目頁面點擊 'Redeploy' 按鈕" -ForegroundColor White
    Write-Host "2. 檢查 Vercel 的 Functions 日誌是否有錯誤" -ForegroundColor White
    Write-Host "3. 嘗試推送一個小的更改來觸發部署" -ForegroundColor White

} catch {
    Write-Host "❌ 發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
}

if (-not $NoExit) {
    Read-Host "`n按 Enter 鍵結束..."
}