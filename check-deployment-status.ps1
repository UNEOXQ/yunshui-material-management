# Check Deployment Status for both Render and Vercel
Write-Host "🔍 Checking Deployment Status" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Function to test URL
function Test-Url {
    param($url, $name)
    
    try {
        Write-Host "🌐 Testing $name..." -ForegroundColor Yellow
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $name is online (Status: $($response.StatusCode))" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  $name returned status: $($response.StatusCode)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ $name is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Test Backend (Render)
Write-Host "`n🔧 Backend Status (Render):" -ForegroundColor Cyan
$backendUrl = "https://yunshui-backend1.onrender.com"
$backendHealthUrl = "$backendUrl/api/health"

$backendOnline = Test-Url $backendUrl "Backend Root"
$backendHealthOnline = Test-Url $backendHealthUrl "Backend Health Check"

if ($backendOnline -or $backendHealthOnline) {
    Write-Host "🎉 Backend is deployed and running!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend may still be deploying or has issues" -ForegroundColor Yellow
}

# Test API endpoints
Write-Host "`n🔌 Testing API Endpoints:" -ForegroundColor Cyan
$apiEndpoints = @(
    "$backendUrl/api/auth/me",
    "$backendUrl/api/users",
    "$backendUrl/api/materials",
    "$backendUrl/api/orders"
)

foreach ($endpoint in $apiEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 5
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "🔐 $endpoint - Requires authentication (401) - Normal" -ForegroundColor Yellow
        } else {
            Write-Host "❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Check Vercel deployment (we can't know the exact URL without CLI)
Write-Host "`n🌐 Frontend Status (Vercel):" -ForegroundColor Cyan
Write-Host "💡 To check your Vercel deployment:" -ForegroundColor Yellow
Write-Host "   1. Visit https://vercel.com/dashboard" -ForegroundColor White
Write-Host "   2. Look for your project deployment" -ForegroundColor White
Write-Host "   3. Click on the deployment to get the URL" -ForegroundColor White

# Check if vercel CLI is available to get project info
try {
    Write-Host "`n🔍 Checking Vercel CLI for project info..." -ForegroundColor Yellow
    $vercelList = vercel list 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Vercel CLI available - run 'vercel list' to see deployments" -ForegroundColor Green
    }
} catch {
    Write-Host "💡 Install Vercel CLI with: npm install -g vercel" -ForegroundColor Cyan
}

# Deployment links
Write-Host "`n🔗 Useful Links:" -ForegroundColor Yellow
Write-Host "📊 Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "📊 Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "🔧 Backend URL: $backendUrl" -ForegroundColor White
Write-Host "🩺 Backend Health: $backendHealthUrl" -ForegroundColor White

# Final status
Write-Host "`n📋 Deployment Status Summary:" -ForegroundColor Green
if ($backendOnline -or $backendHealthOnline) {
    Write-Host "✅ Backend: Deployed and running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend: Check Render dashboard for deployment status" -ForegroundColor Yellow
}
Write-Host "🌐 Frontend: Check Vercel dashboard for deployment URL" -ForegroundColor Cyan

Write-Host "`n🧪 Testing Steps:" -ForegroundColor Yellow
Write-Host "1. Open your Vercel deployment URL" -ForegroundColor White
Write-Host "2. Try to login with test credentials" -ForegroundColor White
Write-Host "3. Navigate to Order Management page" -ForegroundColor White
Write-Host "4. Check that project tags are properly centered" -ForegroundColor White
Write-Host "5. Test creating and managing orders" -ForegroundColor White