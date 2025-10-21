# 雲水基材管理系統 - 自動備份設置
param(
    [int]$IntervalHours = 4,  # 每4小時備份一次
    [int]$KeepBackups = 10    # 保留最近10個備份
)

$projectPath = Get-Location
$backupRoot = "C:\Backups\YunShuiSystem"

# 創建自動備份腳本
$autoBackupScript = @"
# 自動備份腳本
`$projectPath = "$projectPath"
`$backupRoot = "$backupRoot"
`$keepBackups = $KeepBackups

Set-Location `$projectPath

# 檢查是否有文件更改（簡單檢查）
`$lastBackupFile = Join-Path `$backupRoot "last_backup_time.txt"
`$shouldBackup = `$false

if (Test-Path `$lastBackupFile) {
    `$lastBackupTime = Get-Content `$lastBackupFile | Get-Date
    `$timeDiff = (Get-Date) - `$lastBackupTime
    if (`$timeDiff.TotalHours -ge $IntervalHours) {
        `$shouldBackup = `$true
    }
} else {
    `$shouldBackup = `$true
}

if (`$shouldBackup) {
    Write-Host "執行自動備份..." -ForegroundColor Green
    
    # 執行備份
    & "`$projectPath\create-backup.ps1" -Description "自動備份"
    
    # 記錄備份時間
    Get-Date | Out-File `$lastBackupFile
    
    # 清理舊備份
    Get-ChildItem `$backupRoot -Directory | 
        Where-Object { `$_.Name -like "雲水基材管理系統_*" } |
        Sort-Object CreationTime -Descending |
        Select-Object -Skip `$keepBackups |
        Remove-Item -Recurse -Force
        
    Write-Host "自動備份完成" -ForegroundColor Green
} else {
    Write-Host "距離上次備份時間不足 $IntervalHours 小時，跳過備份" -ForegroundColor Yellow
}
"@

$autoBackupScript | Out-File -FilePath "auto-backup.ps1" -Encoding UTF8

# 創建 Windows 任務計劃
Write-Host "設置 Windows 任務計劃..." -ForegroundColor Yellow

$taskName = "YunShuiSystem_AutoBackup"
$taskAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$projectPath\auto-backup.ps1`""
$taskTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours $IntervalHours)
$taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

try {
    Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Settings $taskSettings -Force
    Write-Host "自動備份任務已設置！" -ForegroundColor Green
    Write-Host "任務名稱: $taskName" -ForegroundColor Cyan
    Write-Host "備份間隔: $IntervalHours 小時" -ForegroundColor Cyan
    Write-Host "保留備份: $KeepBackups 個" -ForegroundColor Cyan
} catch {
    Write-Host "無法創建任務計劃，請手動執行 auto-backup.ps1" -ForegroundColor Yellow
}

Write-Host "`n管理命令:" -ForegroundColor Magenta
Write-Host "  查看任務: Get-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  停用任務: Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  啟用任務: Enable-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host "  刪除任務: Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor White