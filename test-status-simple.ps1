#!/usr/bin/env pwsh

Write-Host "Testing Status Management API..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://192.168.68.103:3004/api"

# Login Mark
$loginBody = @{
    username = "warehouse001"
    password = "wh123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "Mark login successful" -ForegroundColor Green
        $token = $loginResponse.data.token
        $headers = @{ "Authorization" = "Bearer $token" }
        
        # Test status endpoints
        Write-Host "Testing status endpoints..." -ForegroundColor Yellow
        
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/status/project-1" -Method GET -Headers $headers -ErrorAction SilentlyContinue
            Write-Host "Status query API available" -ForegroundColor Green
        } catch {
            Write-Host "Status query API not available" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "Mark login failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed!" -ForegroundColor Cyan
Write-Host "Now test the mobile app with Mark account" -ForegroundColor Green
Write-Host ""