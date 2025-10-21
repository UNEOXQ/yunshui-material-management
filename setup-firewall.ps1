# Yun-Shui Material Management System - Firewall Setup
# Run as Administrator

Write-Host "Setting up firewall rules for Yun-Shui System..." -ForegroundColor Cyan

# Check if running as administrator
$currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: Administrator privileges required!" -ForegroundColor Red
    Write-Host "Please right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Administrator privileges confirmed" -ForegroundColor Green

# Add firewall rules
Write-Host "`nAdding firewall rules..." -ForegroundColor Yellow

try {
    # Frontend port 3000
    New-NetFirewallRule -DisplayName "YunShui-Frontend-3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction Stop
    Write-Host "✓ Frontend port 3000 rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend port rule failed: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    # Backend port 3004  
    New-NetFirewallRule -DisplayName "YunShui-Backend-3004" -Direction Inbound -Protocol TCP -LocalPort 3004 -Action Allow -ErrorAction Stop
    Write-Host "✓ Backend port 3004 rule added" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend port rule failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nFirewall setup completed!" -ForegroundColor Cyan
Write-Host "`nMobile access URLs:" -ForegroundColor Yellow
Write-Host "Test page: http://192.168.68.99:3000/mobile-test.html" -ForegroundColor White
Write-Host "Main app:  http://192.168.68.99:3000/" -ForegroundColor White
Write-Host "Backend:   http://192.168.68.99:3004/api" -ForegroundColor White

Read-Host "`nPress Enter to exit"