# Fix CORS for mobile access
Write-Host "Fixing CORS for mobile access..." -ForegroundColor Yellow

# Get local IP address
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" | Where-Object {$_.IPAddress -like "192.168.*"})[0].IPAddress
Write-Host "Detected IP: $ipAddress" -ForegroundColor Green

# Update frontend environment variables
$frontendEnvPath = "frontend\.env.development"
if (Test-Path $frontendEnvPath) {
    Write-Host "Updating frontend environment..." -ForegroundColor Yellow
    
    # Read existing content
    $content = Get-Content $frontendEnvPath
    
    # Update API URL
    $newContent = $content -replace "VITE_API_URL=.*", "VITE_API_URL=http://${ipAddress}:3004/api"
    $newContent = $newContent -replace "VITE_WS_URL=.*", "VITE_WS_URL=http://${ipAddress}:3004"
    
    # Write to file
    $newContent | Set-Content $frontendEnvPath
    Write-Host "Frontend environment updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "Fix completed! Next steps:" -ForegroundColor Green
Write-Host "1. Restart backend server" -ForegroundColor White
Write-Host "2. Restart frontend server" -ForegroundColor White
Write-Host "3. Access from http://${ipAddress}:3000" -ForegroundColor White