# 調試專案創建功能
param(
    [string]$BaseUrl = "http://localhost:3004",
    [string]$Token = ""
)

Write-Host "🔍 調試專案創建功能" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""

if (-not $Token) {
    Write-Host "⚠️  請提供認證 Token" -ForegroundColor Yellow
    Write-Host "從瀏覽器開發者工具的 Application > Local Storage 中獲取 authToken" -ForegroundColor Gray
    $Token = Read-Host "請輸入 Token"
}

$headers = @{
    'Authorization' = "Bearer $Token"
    'Content-Type' = 'application/json'
}

Write-Host "📍 測試目標: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# 測試 1: 檢查現有專案
Write-Host "1️⃣ 檢查現有專案" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Gray
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects" -Method Get -Headers $headers
    
    if ($response.success) {
        Write-Host "✅ 獲取專案列表成功" -ForegroundColor Green
        Write-Host "   專案數量: $($response.data.Count)" -ForegroundColor White
        
        if ($response.data.Count -gt 0) {
            Write-Host "   現有專案:" -ForegroundColor White
            foreach ($project in $response.data) {
                Write-Host "     - ID: $($project.id), 名稱: $($project.projectName)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   沒有現有專案" -ForegroundColor Gray
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
$testProjectName = "調試專案-$(Get-Date -Format 'HHmmss')"
$projectData = @{
    projectName = $testProjectName
    description = "這是一個調試專案"
} | ConvertTo-Json

try {
    Write-Host "   創建專案: $testProjectName" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/projects" -Method Post -Headers $headers -Body $projectData
    
    if ($response.success) {
        Write-Host "✅ 創建專案成功" -ForegroundColor Green
        Write-Host "   專案ID: $($response.data.id)" -ForegroundColor White
        Write-Host "   專案名稱: $($response.data.projectName)" -ForegroundColor White
        $createdProjectId = $response.data.id
    } else {
        Write-Host "❌ 創建專案失敗: $($response.message)" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ 創建專案失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   響應內容: $($_.Exception.Response)" -ForegroundColor Gray
}
Write-Host ""

# 測試 3: 測試帶專案的訂單創建
Write-Host "3️⃣ 測試帶專案的訂單創建" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Gray

# 首先獲取材料列表
try {
    $materialsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/materials?type=AUXILIARY&limit=1" -Method Get -Headers $headers
    
    if ($materialsResponse.success -and $materialsResponse.data.materials.Count -gt 0) {
        $material = $materialsResponse.data.materials[0]
        Write-Host "   使用材料: $($material.name) (ID: $($material.id))" -ForegroundColor Cyan
        
        # 創建訂單數據
        $orderData = @{
            items = @(
                @{
                    materialId = $material.id
                    quantity = 1
                }
            )
            newProjectName = "訂單專案-$(Get-Date -Format 'HHmmss')"
            orderName = "調試訂單-$(Get-Date -Format 'HHmmss')"
        } | ConvertTo-Json -Depth 3
        
        Write-Host "   創建帶專案的輔材訂單..." -ForegroundColor Cyan
        $orderResponse = Invoke-RestMethod -Uri "$BaseUrl/api/orders/auxiliary-with-project" -Method Post -Headers $headers -Body $orderData
        
        if ($orderResponse.success) {
            Write-Host "✅ 創建訂單成功" -ForegroundColor Green
            Write-Host "   訂單ID: $($orderResponse.data.id)" -ForegroundColor White
            Write-Host "   訂單名稱: $($orderResponse.data.name)" -ForegroundColor White
            Write-Host "   專案ID: $($orderResponse.data.projectId)" -ForegroundColor White
        } else {
            Write-Host "❌ 創建訂單失敗: $($orderResponse.message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 無法獲取材料列表進行測試" -ForegroundColor Red
    }
}
catch {
    Write-Host "❌ 訂單創建測試失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   響應內容: $($_.Exception.Response)" -ForegroundColor Gray
}
Write-Host ""

# 測試 4: 檢查服務器健康狀態
Write-Host "4️⃣ 檢查服務器健康狀態" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Gray
try {
    $healthResponse = Invoke-RestMethod -Uri "$BaseUrl/health" -Method Get
    
    Write-Host "✅ 服務器健康檢查成功" -ForegroundColor Green
    Write-Host "   狀態: $($healthResponse.status)" -ForegroundColor White
    Write-Host "   運行時間: $([math]::Floor($healthResponse.uptime))秒" -ForegroundColor White
    Write-Host "   環境: $($healthResponse.environment)" -ForegroundColor White
}
catch {
    Write-Host "❌ 服務器健康檢查失敗: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "📊 調試完成" -ForegroundColor Green
Write-Host "==========" -ForegroundColor Green
Write-Host "請檢查上述測試結果，如果有錯誤請提供詳細信息。" -ForegroundColor White