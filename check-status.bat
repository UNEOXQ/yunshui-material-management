@echo off
chcp 65001 >nul

echo ================================
echo 雲水基材管理系統 - 狀態檢查
echo ================================
echo.

echo [1/4] 檢查端口狀態...
echo.

REM 檢查前端端口 3002
netstat -aon | findstr ":3002" >nul 2>&1
if errorlevel 1 (
    echo ❌ 前端服務 (端口 3002): 未運行
) else (
    echo ✅ 前端服務 (端口 3002): 正在運行
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002') do (
        echo    進程 ID: %%a
    )
)

REM 檢查後端端口 3004
netstat -aon | findstr ":3004" >nul 2>&1
if errorlevel 1 (
    echo ❌ 後端服務 (端口 3004): 未運行
) else (
    echo ✅ 後端服務 (端口 3004): 正在運行
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
        echo    進程 ID: %%a
    )
)

echo.
echo [2/4] 檢查 Node.js 進程...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
    echo ❌ 沒有找到 Node.js 進程
) else (
    echo ✅ 找到 Node.js 進程:
    tasklist /fi "imagename eq node.exe" | findstr node.exe
)

echo.
echo [3/4] 測試網頁連接...
echo.

REM 測試前端連接
echo 測試前端 (http://localhost:3002/)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3002' -TimeoutSec 5 -UseBasicParsing; Write-Host '✅ 前端可訪問 - 狀態碼:' $response.StatusCode } catch { Write-Host '❌ 前端無法訪問:' $_.Exception.Message }" 2>nul

REM 測試後端連接
echo 測試後端 (http://localhost:3004/)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3004' -TimeoutSec 5 -UseBasicParsing; Write-Host '✅ 後端可訪問 - 狀態碼:' $response.StatusCode } catch { Write-Host '❌ 後端無法訪問:' $_.Exception.Message }" 2>nul

echo.
echo [4/4] 檢查服務器視窗...
echo.
echo 請檢查是否有以下命令視窗正在運行:
echo - "雲水系統-後端服務" 或 "後端服務"
echo - "雲水系統-前端服務" 或 "前端服務"
echo.
echo 如果看到錯誤信息，請記錄下來。
echo.

echo ================================
echo 診斷建議:
echo ================================
echo.

REM 檢查常見端口衝突
netstat -aon | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ 端口 3000 被占用，可能影響前端啟動
)

netstat -aon | findstr ":3001" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️ 端口 3001 被占用，可能影響服務啟動
)

echo.
echo 如果服務未運行，可能的原因:
echo 1. 依賴安裝不完整 - 運行: npm install
echo 2. 端口被其他程序占用
echo 3. 防火牆阻擋
echo 4. 服務啟動時出現錯誤
echo.
echo 解決方案:
echo 1. 檢查服務器命令視窗中的錯誤信息
echo 2. 手動重新啟動服務
echo 3. 檢查防火牆設置
echo.

pause