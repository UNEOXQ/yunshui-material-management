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
        
        # Get orders first
        Write-Host "Getting orders..." -ForegroundColor Yellow
        $ordersResponse = Invoke-RestMethod -Uri "$baseUrl/orders" -Method GET -Headers $headers
        
        if ($ordersResponse.success -and $ordersResponse.data.orders.Count -gt 0) {
            $firstOrder = $ordersResponse.data.orders[0]
            $orderId = $firstOrder.id
            Write-Host "Testing with order: $orderId" -ForegroundColor Gray
            
            # Test ORDER status update
            Write-Host "Testing ORDER status update..." -ForegroundColor Yellow
            $orderStatusBody = @{
                primaryStatus = "Ordered"
                secondaryStatus = "Processing"
            } | ConvertTo-Json
            
            try {
                $response = Invoke-RestMethod -Uri "$baseUrl/status/orders/$orderId/status/order" -Method PUT -Body $orderStatusBody -ContentType "application/json" -Headers $headers
                Write-Host "ORDER status update successful" -ForegroundColor Green
            } catch {
                Write-Host "ORDER status update failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
            # Test PICKUP status update
            Write-Host "Testing PICKUP status update..." -ForegroundColor Yellow
            $pickupStatusBody = @{
                primaryStatus = "Picked"
                secondaryStatus = "(B.T.W)"
            } | ConvertTo-Json
            
            try {
                $response = Invoke-RestMethod -Uri "$baseUrl/status/orders/$orderId/status/pickup" -Method PUT -Body $pickupStatusBody -ContentType "application/json" -Headers $headers
                Write-Host "PICKUP status update successful" -ForegroundColor Green
            } catch {
                Write-Host "PICKUP status update failed: $($_.Exception.Message)" -ForegroundColor Red
            }
            
        } else {
            Write-Host "No orders found for testing" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "Mark login failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Status API test completed!" -ForegroundColor Cyan
Write-Host ""