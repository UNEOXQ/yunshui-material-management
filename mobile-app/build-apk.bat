@echo off
echo 雲水基材管理系統 - Android APK 建置工具
echo =====================================
echo.

set /p profile="請選擇建置模式 (debug/preview/release) [預設: preview]: "
if "%profile%"=="" set profile=preview

echo.
echo 開始建置 Android APK (%profile% 模式)...
echo.

cd /d "%~dp0"
node scripts/build-android.js %profile%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 建置成功完成！
    echo 📱 APK 檔案已生成，請查看建置輸出中的檔案路徑
    echo.
    pause
) else (
    echo.
    echo ❌ 建置失敗，請檢查錯誤訊息
    echo.
    pause
)