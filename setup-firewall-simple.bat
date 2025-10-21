@echo off
echo Setting up firewall for Yun-Shui System...
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

echo.
echo Adding firewall rules...

REM Add frontend port rule (3000)
netsh advfirewall firewall add rule name="YunShui-Frontend-3000" dir=in action=allow protocol=TCP localport=3000
if %errorLevel% == 0 (
    echo [OK] Frontend port 3000 rule added
) else (
    echo [ERROR] Frontend port rule failed
)

REM Add backend port rule (3004)
netsh advfirewall firewall add rule name="YunShui-Backend-3004" dir=in action=allow protocol=TCP localport=3004
if %errorLevel% == 0 (
    echo [OK] Backend port 3004 rule added
) else (
    echo [ERROR] Backend port rule failed
)

echo.
echo Firewall setup completed!
echo.
echo Mobile access URLs:
echo Test page: http://192.168.68.99:3000/mobile-test.html
echo Main app:  http://192.168.68.99:3000/
echo.
pause