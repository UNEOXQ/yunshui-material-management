@echo off
chcp 65001 >nul

echo ================================
echo 網頁連接測試
echo ================================
echo.

echo 正在測試網頁連接...
echo.

REM 測試 localhost:3002
echo [1/4] 測試前端 (localhost:3002)...
ping -n 1 localhost >nul 2>&1
if errorlevel 1 (
    echo ❌ localhost 無法解析
) else (
    echo ✅ localhost 可以解析
)

REM 使用 telnet 測試端口（如果可用）
echo.
echo [2/4] 測試端口連接...
powershell -Command "Test-NetConnection -ComputerName localhost -Port 3002 -InformationLevel Quiet" >nul 2>&1
if errorlevel 1 (
    echo ❌ 端口 3002 無法連接
) else (
    echo ✅ 端口 3002 可以連接
)

powershell -Command "Test-NetConnection -ComputerName localhost -Port 3004 -InformationLevel Quiet" >nul 2>&1
if errorlevel 1 (
    echo ❌ 端口 3004 無法連接
) else (
    echo ✅ 端口 3004 可以連接
)

echo.
echo [3/4] 檢查防火牆...
echo 如果端口無法連接，可能是防火牆阻擋了連接
echo.

echo [4/4] 嘗試用不同方式打開網頁...
echo.
echo 方式 1: 使用默認瀏覽器
start http://localhost:3002/
timeout /t 2 >nul

echo 方式 2: 使用 127.0.0.1
start http://127.0.0.1:3002/
timeout /t 2 >nul

echo.
echo ================================
echo 手動測試步驟:
echo ================================
echo.
echo 1. 打開瀏覽器
echo 2. 在地址欄輸入: http://localhost:3002/
echo 3. 如果無法訪問，嘗試: http://127.0.0.1:3002/
echo 4. 如果還是無法訪問，檢查:
echo    - 服務器命令視窗是否有錯誤
echo    - 防火牆設置
echo    - 其他程序是否占用端口
echo.

pause