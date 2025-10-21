@echo off
echo ========================================
echo 雲水基材管理系統 - 清除3004端口占用
echo ========================================
echo.

echo 正在查找占用3004端口的進程...
echo.

REM 查找占用3004端口的進程
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
    set pid=%%a
    goto :found
)

echo 沒有找到占用3004端口的進程。
echo.
goto :end

:found
echo 找到占用3004端口的進程 PID: %pid%
echo.

REM 獲取進程名稱
for /f "tokens=1" %%b in ('tasklist /fi "pid eq %pid%" /fo table /nh') do (
    set processname=%%b
    goto :kill
)

:kill
echo 進程名稱: %processname%
echo 正在終止進程 PID: %pid%...
echo.

REM 強制終止進程
taskkill /f /pid %pid%

if %errorlevel% == 0 (
    echo ✅ 成功終止進程！
    echo 3004端口現在應該可以使用了。
) else (
    echo ❌ 終止進程失敗，可能需要管理員權限。
    echo 請以管理員身份運行此腳本。
)

echo.

:end
echo ========================================
echo 操作完成！
echo ========================================
echo.
pause