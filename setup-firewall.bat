@echo off
echo 設定雲水基材管理系統防火牆規則...
echo.

REM 檢查管理員權限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 已取得管理員權限
) else (
    echo ❌ 需要管理員權限！
    echo 請右鍵點擊此檔案，選擇「以系統管理員身分執行」
    pause
    exit /b 1
)

echo.
echo 正在添加防火牆規則...

REM 添加前端端口規則
netsh advfirewall firewall add rule name="雲水系統前端3001" dir=in action=allow protocol=TCP localport=3001
if %errorLevel% == 0 (
    echo ✅ 前端端口 3001 規則已添加
) else (
    echo ❌ 前端端口規則添加失敗
)

REM 添加後端端口規則  
netsh advfirewall firewall add rule name="雲水系統後端3004" dir=in action=allow protocol=TCP localport=3004
if %errorLevel% == 0 (
    echo ✅ 後端端口 3004 規則已添加
) else (
    echo ❌ 後端端口規則添加失敗
)

echo.
echo 防火牆設定完成！
echo.
echo 現在你可以用手機訪問：
echo 📱 測試頁面: http://192.168.68.99:3001/mobile-test.html
echo 🌐 主應用: http://192.168.68.99:3001/
echo.
pause