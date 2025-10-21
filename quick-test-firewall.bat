@echo off
echo Quick Firewall Test for Mobile Access
echo =====================================
echo.

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Administrator privileges confirmed
) else (
    echo [ERROR] Need administrator privileges!
    echo Please right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo This will temporarily disable Windows Firewall for testing.
echo IMPORTANT: Remember to re-enable it after testing!
echo.
set /p choice="Continue? (y/n): "
if /i "%choice%" neq "y" goto :end

echo.
echo Disabling Windows Firewall for Private network...
netsh advfirewall set privateprofile state off

echo.
echo Firewall disabled for testing.
echo.
echo Now test mobile access:
echo http://192.168.68.99:3000/mobile-test.html
echo.
echo Press any key when testing is complete...
pause

echo.
echo Re-enabling Windows Firewall...
netsh advfirewall set privateprofile state on

echo.
echo Firewall re-enabled. Testing complete.

:end
pause