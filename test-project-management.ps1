# 專案管理功能測試腳本
param(
    [string]$BaseUrl = "http://localhost:3004",
    [string]$Token = ""
)

Write-Host "🧪 專案管理功能測試" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

if (-not $Token) {
    Write-Host "⚠️  未提供認證 Token，嘗試從環境變數獲取..." -ForegroundColor Yellow
    $Token = $env:AUTH_TOKEN
    
    if (-not $Token) {
        Write-Host "❌ 請提供認證 Token" -ForegroundColor Red
        Write-Host "使用方法: .\test-project-management.ps1 -Token 'your-token'" -ForegroundColor Yellow
        exit 1
    }
}

$headers = @{
    'Authorization' = "Bearer $Token"
    'Content-Type' = 'application/json'
}

Write-Host "📍 測試目標: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# 測試 1: 獲取所有專案
Write-Host "1️⃣ 測試獲取所有專案" -ForegroundColor Yellow
Write-Host "-------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects" -Method Get -Headers $headers
    
    if ($response.success) {
        Write-Host "✅ 獲取專案列表成功" -ForegroundColor Green
        Write-Host "   專案數量: $($response.data.Count)" -ForegroundColor White
        
        if ($response.data.Count -gt 0) {
            Write-Host "   現有專案:" -ForegroundColor White
            foreach ($project in $response.data) {
                Write-Host "     - $($project.projectName) (ID: $($project.id))" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ 獲取專案列表失敗: $($response.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ 獲取專案列表失敗: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 測試 2: 創建新專案
Write-Host "2️⃣ 測試創建新專案" -ForegroundColor Yellow
Write-Host "-----------------" -ForegroundColor Gray
$testProjectName = "測試專案-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$projectData = @{
    projectName = $testProjectName
    description = "這是一個測試專案"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects" -Method Post -Headers $headers -Body $projectData
    
    if ($response.success) {
        Write-Host "✅ 創建專案成功" -ForegroundColor Green
        Write-Host "   專案名稱: $($response.data.projectName)" -ForegroundColor White
        Write-Host "   專案ID: $($response.data.id)" -ForegroundColor White
        Write-Host "   狀態: $($response.data.overallStatus)" -ForegroundColor White
        $createdProjectId = $response.data.id
    } else {
        Write-Host "❌ 創建專案失敗: $($response.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ 創建專案失敗: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 測試 3: 更新專案
if ($createdProjectId) {
    Write-Host "3️⃣ 測試更新專案" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Gray
    $updateData = @{
        projectName = "$testProjectName-已更新"
        description = "這是一個已更新的測試專案"
        overallStatus = "ACTIVE"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/$createdProjectId" -Method Put -Headers $headers -Body $updateData
        
        if ($response.success) {
            Write-Host "✅ 更新專案成功" -ForegroundColor Green
            Write-Host "   新名稱: $($response.data.projectName)" -ForegroundColor White
            Write-Host "   新描述: $($response.data.description)" -ForegroundColor White
        } else {
            Write-Host "❌ 更新專案失敗: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ 更新專案失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 測試 4: 獲取專案訂單
if ($createdProjectId) {
    Write-Host "4️⃣ 測試獲取專案訂單" -ForegroundColor Yellow
    Write-Host "-------------------" -ForegroundColor Gray
    try {
        $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/$createdProjectId/orders" -Method Get -Headers $headers
        
        if ($response.success) {
            Write-Host "✅ 獲取專案訂單成功" -ForegroundColor Green
            Write-Host "   訂單數量: $($response.data.Count)" -ForegroundColor White
            
            if ($response.data.Count -gt 0) {
                Write-Host "   專案訂單:" -ForegroundColor White
                foreach ($order in $response.data) {
                    Write-Host "     - $($order.name) (總額: CAD $($order.totalAmount))" -ForegroundColor Gray
                }
            } else {
                Write-Host "   該專案暫無訂單" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ 獲取專案訂單失敗: $($response.message)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "❌ 獲取專案訂單失敗: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# 測試 5: 測試健康檢查（確保 Keep-Alive 正常）
Write-Host "5️⃣ 測試服務器健康狀態" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    
    Write-Host "✅ 服務器健康檢查成功" -ForegroundColor Green
    Write-Host "   狀態: $($response.status)" -ForegroundColor White
    Write-Host "   運行時間: $([math]::Floor($response.uptime))秒" -ForegroundColor White
    Write-Host "   環境: $($response.environment)" -ForegroundColor White
    
    if ($response.keepAlive) {
        Write-Host "   Keep-Alive 狀態:" -ForegroundColor White
        Write-Host "     - 啟用: $($response.keepAlive.enabled)" -ForegroundColor Gray
        Write-Host "     - 運行: $($response.keepAlive.running)" -ForegroundColor Gray
        Write-Host "     - 間隔: $($response.keepAlive.pingInterval / 1000 / 60)分鐘" -ForegroundColor Gray
    }
}
catch {
    Write-Host "❌ 服務器健康檢查失敗: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 測試 6: 清理測試數據（可選）
if ($createdProjectId) {
    Write-Host "6️⃣ 清理測試數據" -ForegroundColor Yellow
    Write-Host "---------------" -ForegroundColor Gray
    
    $cleanup = Read-Host "是否刪除測試專案？(y/N)"
    
    if ($cleanup -eq 'y' -or $cleanup -eq 'Y') {
        try {
            $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects/$createdProjectId" -Method Delete -Headers $headers
            
            if ($response.success) {
                Write-Host "✅ 測試專案已刪除" -ForegroundColor Green
            } else {
                Write-Host "❌ 刪除測試專案失敗: $($response.message)" -ForegroundColor Red
            }
        }
        catch {
            Write-Host "❌ 刪除測試專案失敗: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "💡 測試專案保留，ID: $createdProjectId" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "📊 測試完成" -ForegroundColor Green
Write-Host "==========" -ForegroundColor Green
Write-Host "專案管理 API 功能已測試完成。" -ForegroundColor White
Write-Host ""
Write-Host "💡 下一步:" -ForegroundColor Cyan
Write-Host "1. 在前端材料選擇頁面集成專案選擇器" -ForegroundColor White
Write-Host "2. 在訂單狀態管理頁面添加專案篩選功能" -ForegroundColor White
Write-Host "3. 顯示專案標籤在訂單列表中" -ForegroundColor White