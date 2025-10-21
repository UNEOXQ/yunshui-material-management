Write-Host "Testing Real System Connection..." -ForegroundColor Green

# 1. Check backend health
Write-Host "`n1. Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running" -ForegroundColor Red
    Write-Host "Please start backend with: cd backend && npm run dev" -ForegroundColor Cyan
    exit 1
}

# 2. Test login
Write-Host "`n2. Testing login..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success) {
        Write-Host "✅ Login successful" -ForegroundColor Green
        $token = $loginData.data.token
        Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Cyan
        
        # 3. Test materials API with token
        Write-Host "`n3. Testing materials API..." -ForegroundColor Yellow
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        try {
            $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials" -Headers $headers -UseBasicParsing -TimeoutSec 5
            $materialsData = $materialsResponse.Content | ConvertFrom-Json
            
            if ($materialsData.success) {
                Write-Host "✅ Materials API working" -ForegroundColor Green
                Write-Host "Materials count: $($materialsData.data.materials.Count)" -ForegroundColor Cyan
            } else {
                Write-Host "❌ Materials API failed: $($materialsData.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Materials API request failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Login failed: $($loginData.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Login request failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nOpen check-auth-token.html in browser for detailed testing" -ForegroundColor Cyan