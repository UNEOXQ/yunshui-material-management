# 部署專案標籤修正到線上
Write-Host "🚀 部署專案標籤修正到線上" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

Write-Host "`n📋 修正內容摘要:" -ForegroundColor Yellow
Write-Host "✅ 修正專案標籤文字偏上問題 (對稱padding)" -ForegroundColor Green
Write-Host "✅ 修正專案標籤文字居中問題 (center alignment)" -ForegroundColor Green
Write-Host "✅ 同時修正一般頁面和訂單管理頁面" -ForegroundColor Green

Write-Host "`n🔍 檢查 Git 狀態..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 發現未提交的變更，正在提交..." -ForegroundColor Cyan
    git add .
    git commit -m "Fix: Project tags text alignment and centering"
    git push origin main
    Write-Host "✅ 變更已推送到 GitHub" -ForegroundColor Green
} else {
    Write-Host "✅ 所有變更已經提交並推送" -ForegroundColor Green
}

Write-Host "`n🔄 部署狀態:" -ForegroundColor Yellow
Write-Host "📊 後端 (Render): 已自動部署" -ForegroundColor Green
Write-Host "   URL: https://yunshui-backend1.onrender.com" -ForegroundColor White

Write-Host "`n🌐 前端 (Vercel): 需要手動觸發重新部署" -ForegroundColor Yellow
Write-Host "請按照以下步驟操作:" -ForegroundColor Cyan
Write-Host "1. 打開 https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. 找到你的專案 (yunshui 或類似名稱)" -ForegroundColor White
Write-Host "3. 點擊專案進入詳情頁面" -ForegroundColor White
Write-Host "4. 點擊 'Redeploy' 按鈕重新部署" -ForegroundColor White
Write-Host "5. 等待部署完成 (通常 1-2 分鐘)" -ForegroundColor White

Write-Host "`n🧪 部署完成後測試步驟:" -ForegroundColor Yellow
Write-Host "1. 打開你的 Vercel 部署 URL" -ForegroundColor White
Write-Host "2. 登入任何用戶帳號" -ForegroundColor White
Write-Host "3. 進入訂單管理頁面" -ForegroundColor White
Write-Host "4. 檢查專案標籤 (dds, Hill, 1, 2, 3, 4) 是否:" -ForegroundColor White
Write-Host "   - 文字垂直居中 (不再偏上)" -ForegroundColor Cyan
Write-Host "   - 文字水平居中 (不再偏左)" -ForegroundColor Cyan

Write-Host "`n✨ 修正已準備就緒，請手動觸發 Vercel 重新部署！" -ForegroundColor Green