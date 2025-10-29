#!/usr/bin/env pwsh
# 測試狀態管理API

Write-Host "🔍 測試狀態管理API..." -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://192.168.68.103:3004/api"

try {
    # 1. 登入Mark
    Write-Host "1. 測試Mark登入..." -ForegroundColor Yellow
    $loginBody = @{
        username = "warehouse001"
        password = "wh123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Mark登入成功" -ForegroundColor Green
        $token = $loginResponse.data.token
        $headers = @{ "Authorization" = "Bearer $token" }
        
        # 2. 測試狀態API端點
        Write-Host ""
        Write-Host "2. 測試狀態API端點..." -ForegroundColor Yellow
        
        $projectId = "project-1"
        
        # 測試叫貨狀態更新
        Write-Host "   測試叫貨狀態API..." -ForegroundColor Gray
        try {
            $orderStatusBody = @{
                projectId = $projectId
                primaryStatus = "Ordered"
                secondaryStatus = "Processing"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$baseUrl/status/order" -Method PUT -Body $orderStatusBody -ContentType "application/json" -Headers $headers -ErrorAction SilentlyContinue
            Write-Host "   ✅ 叫貨狀態API可用" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  叫貨狀態API不可用: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # 測試取貨狀態更新
        Write-Host "   測試取貨狀態API..." -ForegroundColor Gray
        try {
            $pickupStatusBody = @{
                projectId = $projectId
                primaryStatus = "Picked"
                secondaryStatus = "(B.T.W)"
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$baseUrl/status/pickup" -Method PUT -Body $pickupStatusBody -ContentType "application/json" -Headers $headers -ErrorAction SilentlyContinue
            Write-Host "   ✅ 取貨狀態API可用" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  取貨狀態API不可用: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        # 測試專案狀態查詢
        Write-Host "   測試專案狀態查詢API..." -ForegroundColor Gray
        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/status/$projectId" -Method GET -Headers $headers -ErrorAction SilentlyContinue
            Write-Host "   ✅ 專案狀態查詢API可用" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  專案狀態查詢API不可用: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "❌ Mark登入失敗" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 測試失敗: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 狀態管理API測試完成！" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 現在請測試手機應用:" -ForegroundColor Green
Write-Host "   1. 重新載入手機應用 (Reload)" -ForegroundColor White
Write-Host "   2. 快速登入 Mark 帳號" -ForegroundColor White
Write-Host "   3. 點擊「📋 訂單狀態管理」" -ForegroundColor White
Write-Host "   4. 查看四大狀態管理系統" -ForegroundColor White
Write-Host "   5. 檢查右上角連線狀態指示器" -ForegroundColor White
Write-Host ""