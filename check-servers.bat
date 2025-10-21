@echo off
chcp 65001 >nul
title 雲水基材管理系統 - 服務器狀態檢查

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🔍 雲水基材管理系統                        ║
echo ║                      服務器狀態檢查                          ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 🔍 檢查服務器狀態...
echo.

REM 檢查 Node.js
echo 📋 環境檢查:
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js: 未安裝
) else (
    for /f %%i in ('node --version') do echo ✅ Node.js: %%i
)

npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm: 未安裝
) else (
    for /f %%i in ('npm --version') do echo ✅ npm: %%i
)

echo.
echo 📋 端口狀態:

REM 檢查前端端口 (3002)
netstat -aon | findstr ":3002 " >nul 2>&1
if errorlevel 1 (
    echo ❌ 前端服務 (3002): 未運行
) else (
    echo ✅ 前端服務 (3002): 運行中
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do (
        if not "%%a"=="0" echo    PID: %%a
    )
)

REM 檢查後端端口 (3004)
netstat -aon | findstr ":3004 " >nul 2>&1
if errorlevel 1 (
    echo ❌ 後端服務 (3004): 未運行
) else (
    echo ✅ 後端服務 (3004): 運行中
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
        if not "%%a"=="0" echo    PID: %%a
    )
)

echo.
echo 📋 服務連接測試:

REM 測試前端連接
echo 測試前端服務...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '✅ 前端服務: 可訪問' } else { Write-Host '⚠️ 前端服務: 響應異常' } } catch { Write-Host '❌ 前端服務: 無法連接' }" 2>nul

REM 測試後端連接
echo 測試後端服務...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3004/health' -TimeoutSec 5 -UseBasicParsing; if ($response.StatusCode -eq 200) { Write-Host '✅ 後端服務: 可訪問' } else { Write-Host '⚠️ 後端服務: 響應異常' } } catch { Write-Host '❌ 後端服務: 無法連接' }" 2>nul

echo.
echo 📋 文件檢查:

if exist "backend\package.json" (
    echo ✅ 後端配置: 存在
) else (
    echo ❌ 後端配置: 缺失
)

if exist "frontend\package.json" (
    echo ✅ 前端配置: 存在
) else (
    echo ❌ 前端配置: 缺失
)

if exist "backend\node_modules" (
    echo ✅ 後端依賴: 已安裝
) else (
    echo ❌ 後端依賴: 未安裝
)

if exist "frontend\node_modules" (
    echo ✅ 前端依賴: 已安裝
) else (
    echo ❌ 前端依賴: 未安裝
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                      📊 檢查完成                             ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║  💡 如果服務未運行，請執行 start-servers.bat                  ║
echo ║  🔧 如果有問題，請檢查上述狀態信息                             ║
echo ║  📱 前端地址: http://localhost:3002/                         ║
echo ║  🔧 後端地址: http://localhost:3004/                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

echo 按任意鍵關閉此視窗...
pause >nul