@echo off
echo 🚀 Starting Render Keep-Alive Service
echo.

REM 檢查是否提供了 URL 參數
if "%1"=="" (
    if "%RENDER_URL%"=="" (
        echo ❌ 錯誤: 請提供目標 URL
        echo.
        echo 使用方法:
        echo   start-keep-alive.bat https://your-app.onrender.com
        echo.
        echo 或設置環境變數:
        echo   set RENDER_URL=https://your-app.onrender.com
        echo   start-keep-alive.bat
        pause
        exit /b 1
    )
    set TARGET_URL=%RENDER_URL%
) else (
    set TARGET_URL=%1
)

echo 📍 Target URL: %TARGET_URL%
echo ⏰ Starting Node.js keep-alive service...
echo.

REM 啟動 Node.js keep-alive 服務
node keep-render-alive.js %TARGET_URL%

pause