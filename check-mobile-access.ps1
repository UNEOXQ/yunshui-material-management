# 雲水基材管理系統 - 手機訪問檢查腳本

Write-Host "🔧 雲水基材管理系統 - 手機訪問檢查" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. 檢查IP地址
Write-Host "`n📡 檢查網路配置..." -ForegroundColor Yellow
$ipConfig = ipconfig | Select-String "IPv4.*192\.168\."
if ($ipConfig) {
    $currentIP = ($ipConfig -split ":")[1].Trim()
    Write-Host "✅ 當前IP地址: $currentIP" -ForegroundColor Green
} else {
    Write-Host "❌ 無法取得IP地址" -ForegroundColor Red
    exit 1
}

# 2. 檢查端口狀態
Write-Host "`n🔌 檢查服務端口..." -ForegroundColor Yellow

$frontendPort = netstat -an | Select-String ":3002.*LISTENING"
$backendPort = netstat -an | Select-String ":3004.*LISTENING"

if ($frontendPort) {
    Write-Host "✅ 前端服務 (3002): 運行中" -ForegroundColor Green
} else {
    Write-Host "❌ 前端服務 (3002): 未運行" -ForegroundColor Red
}

if ($backendPort) {
    Write-Host "✅ 後端服務 (3004): 運行中" -ForegroundColor Green
} else {
    Write-Host "❌ 後端服務 (3004): 未運行" -ForegroundColor Red
}

# 3. 測試本地連接
Write-Host "`n🧪 測試本地連接..." -ForegroundColor Yellow

try {
    $frontendTest = Invoke-WebRequest -Uri "http://localhost:3002" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 前端本地訪問: 正常 (狀態碼: $($frontendTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端本地訪問: 失敗" -ForegroundColor Red
}

try {
    $backendTest = Invoke-WebRequest -Uri "http://localhost:3004/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 後端本地訪問: 正常 (狀態碼: $($backendTest.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端本地訪問: 失敗" -ForegroundColor Red
}

# 4. 測試網路訪問
Write-Host "`n🌐 測試網路訪問..." -ForegroundColor Yellow

try {
    $networkFrontend = Invoke-WebRequest -Uri "http://${currentIP}:3002" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 前端網路訪問: 正常 (狀態碼: $($networkFrontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 前端網路訪問: 失敗 - 可能需要設定防火牆" -ForegroundColor Red
}

try {
    $networkBackend = Invoke-WebRequest -Uri "http://${currentIP}:3004/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ 後端網路訪問: 正常 (狀態碼: $($networkBackend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 後端網路訪問: 失敗 - 可能需要設定防火牆" -ForegroundColor Red
}

# 5. 檢查防火牆規則
Write-Host "`n🛡️ 檢查防火牆規則..." -ForegroundColor Yellow

$firewallRules = netsh advfirewall firewall show rule name=all | Select-String "雲水系統|3002|3004"
if ($firewallRules) {
    Write-Host "✅ 找到相關防火牆規則" -ForegroundColor Green
    $firewallRules | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  未找到防火牆規則，可能需要手動設定" -ForegroundColor Yellow
}

# 6. 顯示訪問資訊
Write-Host "`n📱 手機訪問資訊:" -ForegroundColor Cyan
Write-Host "測試頁面: http://${currentIP}:3002/mobile-test.html" -ForegroundColor White
Write-Host "主應用:   http://${currentIP}:3002/" -ForegroundColor White
Write-Host "後端API:  http://${currentIP}:3004/api" -ForegroundColor White

Write-Host "`n💡 如果手機無法訪問，請:" -ForegroundColor Yellow
Write-Host "1. 確保手機和電腦在同一WiFi網路" -ForegroundColor White
Write-Host "2. 以管理員身分執行 setup-firewall.bat" -ForegroundColor White
Write-Host "3. 檢查路由器是否阻擋內網通訊" -ForegroundColor White

Write-Host "`n" -NoNewline