# 認證問題診斷腳本

Write-Host "🔍 認證問題診斷" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green
Write-Host ""

# 1. 測試後端健康檢查
Write-Host "1. 測試後端服務..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET -TimeoutSec 5
    Write-Host "✅ 後端服務正常運行" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端服務未運行" -ForegroundColor Red
    exit 1
}

# 2. 測試登入端點
Write-Host "2. 測試登入端點..." -ForegroundColor Yellow
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 10
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    
    Write-Host "登入響應狀態: $($loginResponse.StatusCode)" -ForegroundColor Cyan
    Write-Host "登入響應內容:" -ForegroundColor Cyan
    Write-Host $loginResponse.Content -ForegroundColor White
    
    if ($loginResult.success) {
        $token = $loginResult.data.token
        Write-Host "✅ 登入成功，獲得 token" -ForegroundColor Green
        Write-Host "Token 前 30 字符: $($token.Substring(0, [Math]::Min(30, $token.Length)))..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ 登入失敗: $($loginResult.message)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 登入請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    # 顯示詳細錯誤
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "HTTP 狀態碼: $statusCode" -ForegroundColor Red
        
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "錯誤詳情: $errorContent" -ForegroundColor Red
        } catch {
            Write-Host "無法讀取錯誤詳情" -ForegroundColor Red
        }
    }
    exit 1
}

# 3. 測試 token 驗證
Write-Host "3. 測試 token 驗證..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $validateResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/auth/validate" -Method POST -Headers $headers -TimeoutSec 10
    $validateResult = $validateResponse.Content | ConvertFrom-Json
    
    Write-Host "Token 驗證響應:" -ForegroundColor Cyan
    Write-Host $validateResponse.Content -ForegroundColor White
    
    if ($validateResult.success) {
        Write-Host "✅ Token 驗證成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Token 驗證失敗: $($validateResult.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Token 驗證請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 狀態碼: $statusCode" -ForegroundColor Red
    }
}

# 4. 測試材料 API
Write-Host "4. 測試材料 API..." -ForegroundColor Yellow
try {
    $materialsResponse = Invoke-WebRequest -Uri "http://localhost:3004/api/materials?page=1&limit=10" -Method GET -Headers $headers -TimeoutSec 10
    $materialsResult = $materialsResponse.Content | ConvertFrom-Json
    
    Write-Host "材料 API 響應狀態: $($materialsResponse.StatusCode)" -ForegroundColor Cyan
    
    if ($materialsResult.success) {
        Write-Host "✅ 材料 API 調用成功" -ForegroundColor Green
        Write-Host "材料數量: $($materialsResult.data.materials.Count)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ 材料 API 調用失敗: $($materialsResult.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ 材料 API 請求失敗: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP 狀態碼: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "🔍 這是認證失敗，token 可能無效或過期" -ForegroundColor Yellow
        }
    }
}

# 5. 檢查後端認證中間件
Write-Host "5. 檢查後端配置..." -ForegroundColor Yellow
Write-Host "請檢查後端控制台是否有錯誤信息" -ForegroundColor Cyan
Write-Host "特別注意 JWT 相關的錯誤" -ForegroundColor Cyan

Write-Host ""
Write-Host "================" -ForegroundColor Green
Write-Host "🎯 診斷完成" -ForegroundColor Green
Write-Host "================" -ForegroundColor Green