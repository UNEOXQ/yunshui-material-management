# Deploy Backend to Render
Write-Host "🚀 Deploying Backend to Render..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if git is available
Write-Host "`n📦 Checking Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check git status
Write-Host "`n📋 Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes found. Committing..." -ForegroundColor Yellow
    
    # Add all changes
    git add .
    
    # Commit with timestamp
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Deploy: Project tags fix and improvements - $timestamp"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Push to main branch
Write-Host "`n🔄 Pushing to main branch..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to main branch" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to main branch" -ForegroundColor Red
    Write-Host "💡 This might trigger automatic deployment on Render anyway" -ForegroundColor Cyan
}

Write-Host "`n📋 Render Deployment Info:" -ForegroundColor Yellow
Write-Host "1. Render should automatically detect the push and start deployment" -ForegroundColor White
Write-Host "2. Check your Render dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "3. Look for 'yunshui-backend' service" -ForegroundColor White
Write-Host "4. Monitor the build logs for any issues" -ForegroundColor White

Write-Host "`n🔗 Expected Backend URL:" -ForegroundColor Cyan
Write-Host "https://yunshui-backend1.onrender.com" -ForegroundColor White

Write-Host "`n⏱️  Note: Render deployments typically take 2-5 minutes" -ForegroundColor Yellow