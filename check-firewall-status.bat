@echo off
echo Checking Firewall Status for Yun-Shui System
echo =============================================
echo.

echo Current Windows Firewall Status:
netsh advfirewall show allprofiles state
echo.

echo Checking if ports are listening:
echo Port 3000 (Frontend):
netstat -an | findstr :3000
echo.
echo Port 3004 (Backend):
netstat -an | findstr :3004
echo.

echo Testing network connectivity:
echo Testing frontend port...
powershell -Command "Test-NetConnection -ComputerName 192.168.68.99 -Port 3000 -InformationLevel Quiet"
if %errorLevel% == 0 (
    echo [OK] Frontend port 3000 is accessible
) else (
    echo [ERROR] Frontend port 3000 is blocked
)

echo Testing backend port...
powershell -Command "Test-NetConnection -ComputerName 192.168.68.99 -Port 3004 -InformationLevel Quiet"
if %errorLevel% == 0 (
    echo [OK] Backend port 3004 is accessible
) else (
    echo [ERROR] Backend port 3004 is blocked
)

echo.
echo Mobile access URLs:
echo Test page: http://192.168.68.99:3000/mobile-test.html
echo Main app:  http://192.168.68.99:3000/
echo.
pause