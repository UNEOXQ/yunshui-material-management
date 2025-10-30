# 手動部署腳本
Write-Host "🚀 開始手動部署雲水基材管理系統..." -ForegroundColor Green

# 檢查 Git 狀態
Write-Host "📋 檢查 Git 狀態..." -ForegroundColor Yellow
git status

# 確保所有更改都已提交
Write-Host "💾 確保所有更改都已提交..." -ForegroundColor Yellow
git add .
git commit -m "Manual deployment trigger - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ErrorAction SilentlyContinue

# 推送到 GitHub
Write-Host "📤 推送到 GitHub..." -ForegroundColor Yellow
git push origin main

# 構建前端
Write-Host "🔨 構建前端..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

# 構建後端
Write-Host "🔨 構建後端..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

Write-Host "✅ 本地構建完成！" -ForegroundColor Green
Write-Host "📝 接下來需要手動觸發線上部署..." -ForegroundColor Yellow

# 創建部署狀態文件
$deployTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
@"
# 手動部署記錄

## 部署時間
$deployTime

## 部署狀態
- ✅ 代碼已推送到 GitHub
- ✅ 前端本地構建成功
- ✅ 後端本地構建成功
- ⏳ 等待線上部署觸發

## 下一步
1. 檢查 Render 控制台是否有新的部署
2. 檢查 Vercel 控制台是否有新的部署
3. 如果沒有，需要手動觸發部署

## 部署 URL
- Render: https://dashboard.render.com
- Vercel: https://vercel.com/dashboard
"@ | Out-File -FilePath "MANUAL_DEPLOY_LOG.md" -Encoding UTF8

Write-Host "📄 部署日誌已保存到 MANUAL_DEPLOY_LOG.md" -ForegroundColor Cyan
Write-Host "🌐 請檢查以下控制台:" -ForegroundColor Yellow
Write-Host "   - Render: https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "   - Vercel: https://vercel.com/dashboard" -ForegroundColor Cyan