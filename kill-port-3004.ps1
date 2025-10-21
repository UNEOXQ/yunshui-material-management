Write-Host "正在檢查端口 3004..." -ForegroundColor Yellow

# 查找占用端口 3004 的進程
$connections = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue

if ($connections) {
    Write-Host "找到占用端口 3004 的進程:" -ForegroundColor Red
    
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        
        if ($process) {
            Write-Host "進程 ID: $processId, 名稱: $($process.ProcessName)" -ForegroundColor Red
            
            # 嘗試停止進程
            try {
                Stop-Process -Id $processId -Force
                Write-Host "✅ 已停止進程 $processId ($($process.ProcessName))" -ForegroundColor Green
            } catch {
                Write-Host "❌ 無法停止進程 $processId : $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    
    # 等待一下讓端口釋放
    Start-Sleep -Seconds 2
    
    # 再次檢查
    $stillRunning = Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue
    if ($stillRunning) {
        Write-Host "❌ 端口 3004 仍被占用" -ForegroundColor Red
    } else {
        Write-Host "✅ 端口 3004 已釋放" -ForegroundColor Green
    }
} else {
    Write-Host "✅ 端口 3004 沒有被占用" -ForegroundColor Green
}

Write-Host "`n現在可以嘗試啟動後端服務器了" -ForegroundColor Cyan