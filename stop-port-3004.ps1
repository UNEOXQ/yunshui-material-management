Write-Host "Stopping processes on port 3004..." -ForegroundColor Yellow

$connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue

if ($connections) {
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "Stopping process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Port 3004 processes stopped" -ForegroundColor Green
} else {
    Write-Host "No processes found on port 3004" -ForegroundColor Green
}

Start-Sleep -Seconds 1
Write-Host "Ready to start backend server" -ForegroundColor Cyan