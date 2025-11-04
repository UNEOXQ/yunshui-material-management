# Deploy Frontend to Vercel
Write-Host "🚀 Deploying Frontend to Vercel..." -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if vercel CLI is installed
Write-Host "`n📦 Checking Vercel CLI..." -ForegroundColor Yellow
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
}

# Build frontend first
Write-Host "`n🔨 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend build successful" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Go back to root
Set-Location ..

# Deploy to Vercel
Write-Host "`n🚀 Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment to Vercel successful!" -ForegroundColor Green
    Write-Host "🌐 Your app should be available at your Vercel domain" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment to Vercel failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check your Vercel dashboard for the deployment URL" -ForegroundColor White
Write-Host "2. Test the deployed application" -ForegroundColor White
Write-Host "3. Verify that project tags are properly centered" -ForegroundColor White