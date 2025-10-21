# 雲水基材管理系統 - 備份與回復腳本
# 使用方法：
# .\backup-system.ps1 -Action backup -Name "功能名稱"
# .\backup-system.ps1 -Action restore -Tag "v1.0-stable"

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backup", "restore", "list")]
    [string]$Action,
    
    [string]$Name,
    [string]$Tag
)

# 設定 Git 路徑
$env:PATH += ";C:\Program Files\Git\bin"

function Create-Backup {
    param([string]$BackupName)
    
    Write-Host "🔄 創建備份點..." -ForegroundColor Yellow
    
    # 檢查是否有未提交的變更
    $status = git status --porcelain
    if ($status) {
        Write-Host "⚠️  發現未提交的變更，正在提交..." -ForegroundColor Yellow
        git add .
        git commit -m "自動備份: $BackupName - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }
    
    # 創建標籤
    $tagName = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    if ($BackupName) {
        $tagName = "backup-$($BackupName.Replace(' ', '-'))-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    }
    
    git tag -a $tagName -m "備份: $BackupName - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin $tagName
    
    Write-Host "✅ 備份完成！標籤: $tagName" -ForegroundColor Green
    Write-Host "📝 回復指令: .\backup-system.ps1 -Action restore -Tag $tagName" -ForegroundColor Cyan
}

function Restore-Backup {
    param([string]$TagName)
    
    Write-Host "🔄 回復到備份點: $TagName" -ForegroundColor Yellow
    
    # 確認操作
    $confirm = Read-Host "⚠️  這將會覆蓋當前所有變更，確定要繼續嗎？(y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "❌ 操作已取消" -ForegroundColor Red
        return
    }
    
    # 創建當前狀態的緊急備份
    Write-Host "📦 創建緊急備份..." -ForegroundColor Yellow
    $emergencyTag = "emergency-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    git add .
    git commit -m "緊急備份 - 回復前的狀態"
    git tag -a $emergencyTag -m "緊急備份 - 回復前的狀態"
    
    # 回復到指定標籤
    git reset --hard $TagName
    git push --force-with-lease
    
    Write-Host "✅ 回復完成！" -ForegroundColor Green
    Write-Host "📝 緊急備份標籤: $emergencyTag (如需要可以回復到此點)" -ForegroundColor Cyan
    
    # 重新部署提醒
    Write-Host "🚀 請注意：Vercel 和 Render 會自動重新部署" -ForegroundColor Yellow
}

function List-Backups {
    Write-Host "📋 可用的備份點：" -ForegroundColor Cyan
    git tag -l "*backup*" -l "*stable*" --sort=-version:refname | ForEach-Object {
        $tagInfo = git show --format="%ci %s" --no-patch $_
        Write-Host "  🏷️  $_ - $tagInfo" -ForegroundColor White
    }
}

# 主要邏輯
switch ($Action) {
    "backup" {
        if (-not $Name) {
            $Name = Read-Host "請輸入備份名稱"
        }
        Create-Backup -BackupName $Name
    }
    "restore" {
        if (-not $Tag) {
            List-Backups
            $Tag = Read-Host "請輸入要回復的標籤名稱"
        }
        Restore-Backup -TagName $Tag
    }
    "list" {
        List-Backups
    }
}