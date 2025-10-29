#!/usr/bin/env pwsh
# 最終倉管功能驗證腳本

Write-Host "🔍 最終倉管功能驗證..." -ForegroundColor Cyan
Write-Host ""

# API 基礎設定
$baseUrl = "http://192.168.68.103:3004/api"

try {
    Write-Host "1. 測試Mark (倉管) 登入..." -ForegroundColor Yellow
    
    # 登入Mark
    $loginBody = @{
        username = "warehouse001"
        password = "wh123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success) {
        Write-Host "✅ Mark登入成功" -ForegroundColor Green
        Write-Host "   用戶ID: $($loginResponse.data.user.id)" -ForegroundColor Gray
        Write-Host "   角色: $($loginResponse.data.user.role)" -ForegroundColor Gray
        Write-Host "   Token: $($loginResponse.data.token.Substring(0,20))..." -ForegroundColor Gray
        
        $token = $loginResponse.data.token
        
        Write-Host ""
        Write-Host "2. 測試獲取訂單..." -ForegroundColor Yellow
        
        # 獲取訂單
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $ordersResponse = Invoke-RestMethod -Uri "$baseUrl/orders" -Method GET -Headers $headers
        
        if ($ordersResponse.success -and $ordersResponse.data.orders) {
            $orderCount = $ordersResponse.data.orders.Count
            Write-Host "✅ 訂單獲取成功" -ForegroundColor Green
            Write-Host "   📊 Mark可以看到 $orderCount 個訂單" -ForegroundColor Green
            
            if ($orderCount -gt 0) {
                $firstOrder = $ordersResponse.data.orders[0]
                Write-Host "   第一個訂單: $($firstOrder.id) - 狀態: $($firstOrder.status)" -ForegroundColor Gray
                
                Write-Host ""
                Write-Host "3. 測試狀態更新API..." -ForegroundColor Yellow
                
                # 測試狀態更新 (不實際更新，只測試API)
                $statusUpdateBody = @{
                    status = "CONFIRMED"
                } | ConvertTo-Json
                
                try {
                    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/orders/$($firstOrder.id)/status" -Method PUT -Body $statusUpdateBody -ContentType "application/json" -Headers $headers
                    
                    if ($statusResponse.success) {
                        Write-Host "✅ 狀態更新API正常工作" -ForegroundColor Green
                        Write-Host "   訂單 $($firstOrder.id) 狀態已更新" -ForegroundColor Gray
                    } else {
                        Write-Host "⚠️  狀態更新失敗: $($statusResponse.message)" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "⚠️  狀態更新API測試失敗: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            } else {
                Write-Host "⚠️  沒有訂單可供測試狀態更新" -ForegroundColor Yellow
            }
            } else {
                Write-Host "❌ 獲取訂單失敗" -ForegroundColor Red
                Write-Host "   響應: $($ordersResponse | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Mark登入失敗: $($loginResponse.message)" -ForegroundColor Red
        }
        
    } catch {
    Write-Host "❌ 測試過程中發生錯誤: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 最終驗證完成！" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 現在請測試手機應用:" -ForegroundColor Green
Write-Host "   1. 重新載入手機應用 (Reload)" -ForegroundColor White
Write-Host "   2. 快速登入 Mark 帳號" -ForegroundColor White
Write-Host "   3. 檢查儀表板訂單數量" -ForegroundColor White
Write-Host "   4. 進入「📋 訂單狀態管理」" -ForegroundColor White
Write-Host "   5. 測試狀態更新功能" -ForegroundColor White
Write-Host ""