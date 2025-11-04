# Complete Deployment Script - Deploy to both Render and Vercel
Write-Host "🚀 Complete Deployment: Render + Vercel" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

$startTime = Get-Date

# Step 1: Pre-deployment checks
Write-Host "`n🔍 Pre-deployment checks..." -ForegroundColor Yellow

# Check if we're in the right directory
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: frontend or backend directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project structure verified" -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Step 2: Build and test frontend locally
Write-Host "`n🔨 Building frontend locally..." -ForegroundColor Yellow
Set-Location frontend

Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️  Building frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build successful" -ForegroundColor Green
Set-Location ..

# Step 3: Build and test backend locally
Write-Host "`n🔨 Building backend locally..." -ForegroundColor Yellow
Set-Location backend

Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️  Building backend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend build successful" -ForegroundColor Green
Set-Location ..

# Step 4: Git operations
Write-Host "`n📝 Preparing Git commit..." -ForegroundColor Yellow

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📋 Uncommitted changes found. Committing..." -ForegroundColor Cyan
    
    # Add all changes
    git add .
    
    # Commit with detailed message
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Deploy: Project tags fix and UI improvements - $timestamp

- Fixed project tag text vertical alignment (symmetric padding)
- Fixed project tag text horizontal alignment (center alignment)  
- Applied fixes to both general and order management page styles
- Ready for production deployment"

    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Changes committed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No uncommitted changes" -ForegroundColor Green
}

# Step 5: Deploy to Render (Backend)
Write-Host "`n🚀 Deploying Backend to Render..." -ForegroundColor Yellow

Write-Host "🔄 Pushing to main branch for Render deployment..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to main branch" -ForegroundColor Green
    Write-Host "🔄 Render should start automatic deployment..." -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Push failed, but continuing with Vercel deployment..." -ForegroundColor Yellow
}

# Step 6: Deploy to Vercel (Frontend)
Write-Host "`n🚀 Deploying Frontend to Vercel..." -ForegroundColor Yellow

# Check if vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
    
    Write-Host "🚀 Starting Vercel deployment..." -ForegroundColor Cyan
    vercel --prod --yes
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Vercel deployment failed" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Vercel CLI not found. Please install with: npm install -g vercel" -ForegroundColor Yellow
    Write-Host "💡 You can deploy manually at: https://vercel.com" -ForegroundColor Cyan
}

# Step 7: Summary
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n🎉 Deployment Summary" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "⏱️  Total time: $($duration.Minutes)m $($duration.Seconds)s" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Backend (Render):" -ForegroundColor Yellow
Write-Host "   URL: https://yunshui-backend1.onrender.com" -ForegroundColor White
Write-Host "   Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Frontend (Vercel):" -ForegroundColor Yellow
Write-Host "   Check your Vercel dashboard for the URL" -ForegroundColor White
Write-Host "   Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Monitor Render deployment logs" -ForegroundColor White
Write-Host "2. Test the deployed backend API" -ForegroundColor White
Write-Host "3. Test the deployed frontend application" -ForegroundColor White
Write-Host "4. Verify project tags are properly centered" -ForegroundColor White
Write-Host "5. Test the complete user workflow" -ForegroundColor White

Write-Host "`n✨ Deployment process completed!" -ForegroundColor Green