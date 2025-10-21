@echo off
echo ========================================
echo 雲水基材管理系統 - 清除開發端口占用
echo ========================================
echo.

set ports=3000 3001 3004 5173

echo 正在檢查以下端口的占用情況：
for %%p in (%ports%) do (
    echo - 端口 %%p
)
echo.

for %%p in (%ports%) do (
    echo 檢查端口 %%p...
    
    REM 查找占用端口的進程
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%%p') do (
        set pid=%%a
        
        REM 獲取進程名稱
        for /f "tokens=1" %%b in ('tasklist /fi "pid eq %%a" /fo table /nh 2^>nul') do (
            echo   找到進程: %%b (PID: %%a)
            echo   正在終止...
            taskkill /f /pid %%a >nul 2>&1
            if !errorlevel! == 0 (
                echo   ✅ 成功終止端口 %%p 的進程
            ) else (
                echo   ❌ 終止端口 %%p 的進程失敗
            )
        )
    )
)

echo.
echo ========================================
echo 所有端口檢查完成！
echo ========================================
echo.

REM 顯示當前端口使用情況
echo 當前端口使用情況：
netstat -an | findstr "3000 3001 3004 5173" | findstr LISTENING

echo.
pause