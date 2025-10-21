# 雲水基材管理系統 - 完整備份腳本
param(
    [string]$BackupLocation = "C:\Backups\YunShuiSystem",
    [string]$Description = "手動備份"
)

# 獲取當前日期時間
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$currentPath = Get-Location
$projectName = "雲水基材管理系統"

# 創建備份目錄
$backupPath = Join-Path $BackupLocation "$projectName`_$timestamp"
Write-Host "創建備份目錄: $backupPath" -ForegroundColor Green

if (!(Test-Path $BackupLocation)) {
    New-Item -ItemType Directory -Path $BackupLocation -Force
}

# 要排除的文件夾和文件
$excludeItems = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    "*.log",
    "*.tmp",
    ".cache"
)

Write-Host "開始備份項目文件..." -ForegroundColor Yellow

# 使用 robocopy 進行備份（Windows 內建工具）
$excludeString = $excludeItems -join " "
$robocopyArgs = @(
    $currentPath,
    $backupPath,
    "/E",  # 複製子目錄，包括空目錄
    "/XD", "node_modules", "dist", "build", ".git",  # 排除目錄
    "/XF", "*.log", "*.tmp",  # 排除文件
    "/R:3",  # 重試次數
    "/W:1"   # 重試等待時間
)

$result = Start-Process -FilePath "robocopy" -ArgumentList $robocopyArgs -Wait -PassThru -NoNewWindow

# 創建備份信息文件
$backupInfo = @{
    "備份時間" = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "備份描述" = $Description
    "原始路徑" = $currentPath
    "備份路徑" = $backupPath
    "系統版本" = "1.0"
    "包含功能" = @(
        "用戶認證系統",
        "材料管理",
        "訂單管理",
        "狀態管理",
        "PM/AM/倉管角色權限",
        "訂單名稱編輯",
        "四大狀態追蹤",
        "數據持久化"
    )
} | ConvertTo-Json -Depth 3

$backupInfo | Out-File -FilePath (Join-Path $backupPath "BACKUP_INFO.json") -Encoding UTF8

# 創建還原腳本
$restoreScript = @"
@echo off
echo 雲水基材管理系統 - 還原腳本
echo 備份時間: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
echo.
echo 還原步驟：
echo 1. 將此備份文件夾複製到目標位置
echo 2. 在 backend 目錄執行: npm install
echo 3. 在 frontend 目錄執行: npm install
echo 4. 執行 start-system.bat 啟動系統
echo.
echo 注意：還原前請備份當前版本！
pause
"@

$restoreScript | Out-File -FilePath (Join-Path $backupPath "RESTORE_INSTRUCTIONS.bat") -Encoding UTF8

Write-Host "備份完成！" -ForegroundColor Green
Write-Host "備份位置: $backupPath" -ForegroundColor Cyan
Write-Host "備份大小: $((Get-ChildItem $backupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB) MB" -ForegroundColor Cyan

# 列出最近的備份
Write-Host "`n最近的備份:" -ForegroundColor Yellow
Get-ChildItem $BackupLocation | Sort-Object CreationTime -Descending | Select-Object -First 5 | ForEach-Object {
    Write-Host "  $($_.Name) - $($_.CreationTime)" -ForegroundColor Gray
}

Write-Host "`n備份腳本使用方法:" -ForegroundColor Magenta
Write-Host "  基本備份: .\create-backup.ps1" -ForegroundColor White
Write-Host "  指定位置: .\create-backup.ps1 -BackupLocation 'D:\MyBackups'" -ForegroundColor White
Write-Host "  添加描述: .\create-backup.ps1 -Description '修復AM狀態顯示問題'" -ForegroundColor White