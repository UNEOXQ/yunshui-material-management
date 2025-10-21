# 雲水基材管理系統 - 快速還原腳本
param(
    [string]$BackupPath,
    [string]$RestorePath = (Get-Location),
    [switch]$Force
)

if (-not $BackupPath) {
    Write-Host "請指定備份路徑！" -ForegroundColor Red
    Write-Host "使用方法: .\quick-restore.ps1 -BackupPath 'C:\Backups\YunShuiSystem\雲水基材管理系統_2024-01-01_12-00-00'" -ForegroundColor Yellow
    
    # 列出可用的備份
    $backupRoot = "C:\Backups\YunShuiSystem"
    if (Test-Path $backupRoot) {
        Write-Host "`n可用的備份:" -ForegroundColor Green
        Get-ChildItem $backupRoot | Sort-Object CreationTime -Descending | ForEach-Object {
            Write-Host "  $($_.FullName)" -ForegroundColor Cyan
        }
    }
    exit 1
}

if (-not (Test-Path $BackupPath)) {
    Write-Host "備份路徑不存在: $BackupPath" -ForegroundColor Red
    exit 1
}

# 檢查備份信息
$backupInfoPath = Join-Path $BackupPath "BACKUP_INFO.json"
if (Test-Path $backupInfoPath) {
    $backupInfo = Get-Content $backupInfoPath | ConvertFrom-Json
    Write-Host "備份信息:" -ForegroundColor Green
    Write-Host "  時間: $($backupInfo.'備份時間')" -ForegroundColor White
    Write-Host "  描述: $($backupInfo.'備份描述')" -ForegroundColor White
    Write-Host "  版本: $($backupInfo.'系統版本')" -ForegroundColor White
}

if (-not $Force) {
    $confirm = Read-Host "`n確定要還原到此版本嗎？這將覆蓋當前文件！(y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "還原已取消" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "開始還原..." -ForegroundColor Yellow

# 停止可能運行的服務
Write-Host "停止運行中的服務..." -ForegroundColor Gray
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 備份當前版本（以防萬一）
$currentBackupPath = "C:\Backups\YunShuiSystem\BEFORE_RESTORE_$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
Write-Host "創建當前版本備份: $currentBackupPath" -ForegroundColor Gray
robocopy $RestorePath $currentBackupPath /E /XD node_modules dist build .git /XF *.log *.tmp /R:1 /W:1 > $null

# 還原文件
Write-Host "還原文件..." -ForegroundColor Yellow
robocopy $BackupPath $RestorePath /E /XF "BACKUP_INFO.json" "RESTORE_INSTRUCTIONS.bat" /R:3 /W:1

Write-Host "還原完成！" -ForegroundColor Green
Write-Host "`n後續步驟:" -ForegroundColor Magenta
Write-Host "1. cd backend && npm install" -ForegroundColor White
Write-Host "2. cd frontend && npm install" -ForegroundColor White
Write-Host "3. 執行 start-system.bat" -ForegroundColor White
Write-Host "`n當前版本已備份至: $currentBackupPath" -ForegroundColor Cyan