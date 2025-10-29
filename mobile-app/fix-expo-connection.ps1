# 修復 Expo Go 連線問題的腳本

Write-Host "🔧 修復 Expo Go 連線問題" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

Write-Host "`n📋 常見解決方案:" -ForegroundColor Cyan

Write-Host "`n1. 🌐 檢查網路連線" -ForegroundColor Yellow
Write-Host "   - 確保手機和電腦在同一個 WiFi 網路" -ForegroundColor White
Write-Host "   - 避免使用公司或學校的受限網路" -ForegroundColor White
Write-Host "   - 嘗試使用手機熱點" -ForegroundColor White

Write-Host "`n2. 🔥 檢查防火牆設定" -ForegroundColor Yellow
Write-Host "   - Windows 防火牆可能阻擋了連線" -ForegroundColor White
Write-Host "   - 防毒軟體可能阻擋了連線" -ForegroundColor White

Write-Host "`n3. 🚇 使用 Tunnel 模式 (推薦)" -ForegroundColor Yellow
Write-Host "   - Tunnel 模式可以繞過大部分網路問題" -ForegroundColor White
Write-Host "   - 執行: npx expo start --tunnel" -ForegroundColor Green

Write-Host "`n4. 📱 清除 Expo Go 快取" -ForegroundColor Yellow
Write-Host "   - 在 Expo Go 中清除快取" -ForegroundColor White
Write-Host "   - 重新啟動 Expo Go 應用程式" -ForegroundColor White

Write-Host "`n🎯 立即嘗試的解決方案:" -ForegroundColor Cyan

$choice = Read-Host "`n選擇解決方案 (1-4) 或按 Enter 使用 Tunnel 模式"

switch ($choice) {
    "1" {
        Write-Host "`n🌐 網路診斷..." -ForegroundColor Green
        Write-Host "正在檢查網路連線..." -ForegroundColor White
        
        # 檢查網路連線
        $networkInfo = Get-NetIPConfiguration | Where-Object { $_.NetAdapter.Status -eq "Up" -and $_.IPv4Address -ne $null }
        
        if ($networkInfo) {
            Write-Host "✅ 網路連線正常" -ForegroundColor Green
            foreach ($net in $networkInfo) {
                Write-Host "   介面: $($net.InterfaceAlias)" -ForegroundColor White
                Write-Host "   IP: $($net.IPv4Address.IPAddress)" -ForegroundColor White
            }
        } else {
            Write-Host "❌ 網路連線有問題" -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host "`n🔥 防火牆檢查..." -ForegroundColor Green
        Write-Host "正在檢查 Windows 防火牆狀態..." -ForegroundColor White
        
        try {
            $firewallStatus = Get-NetFirewallProfile | Select-Object Name, Enabled
            $firewallStatus | Format-Table -AutoSize
            
            Write-Host "建議暫時關閉防火牆測試:" -ForegroundColor Yellow
            Write-Host "1. 開啟 Windows 設定" -ForegroundColor White
            Write-Host "2. 前往 更新與安全性 > Windows 安全性" -ForegroundColor White
            Write-Host "3. 點擊 防火牆與網路保護" -ForegroundColor White
            Write-Host "4. 暫時關閉私人網路的防火牆" -ForegroundColor White
        } catch {
            Write-Host "無法檢查防火牆狀態" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host "`n🚇 啟動 Tunnel 模式..." -ForegroundColor Green
        Write-Host "這可能需要幾分鐘時間..." -ForegroundColor White
        
        Set-Location -Path (Get-Location)
        npx expo start --tunnel
    }
    
    "4" {
        Write-Host "`n📱 Expo Go 快取清除指南:" -ForegroundColor Green
        Write-Host "1. 開啟 Expo Go 應用程式" -ForegroundColor White
        Write-Host "2. 點擊右下角的 Profile 標籤" -ForegroundColor White
        Write-Host "3. 點擊 Settings (設定)" -ForegroundColor White
        Write-Host "4. 點擊 Clear cache (清除快取)" -ForegroundColor White
        Write-Host "5. 重新啟動 Expo Go" -ForegroundColor White
        Write-Host "6. 重新掃描 QR 碼" -ForegroundColor White
    }
    
    default {
        Write-Host "`n🚇 使用 Tunnel 模式 (預設選擇)..." -ForegroundColor Green
        Write-Host "Tunnel 模式可以解決大部分連線問題" -ForegroundColor White
        Write-Host "正在啟動..." -ForegroundColor White
        
        Set-Location -Path (Get-Location)
        npx expo start --tunnel
    }
}

Write-Host "`n💡 其他建議:" -ForegroundColor Cyan
Write-Host "- 如果 Tunnel 模式太慢，可以嘗試 LAN 模式: npx expo start --lan" -ForegroundColor White
Write-Host "- 確保 Expo Go 是最新版本" -ForegroundColor White
Write-Host "- 嘗試重新啟動電腦和手機" -ForegroundColor White