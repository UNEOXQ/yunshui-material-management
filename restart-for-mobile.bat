@echo off
echo Restarting servers for mobile access...

echo Stopping existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev:simple"

timeout /t 5

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo Servers are starting...
echo Backend: http://192.168.68.103:3004
echo Frontend: http://192.168.68.103:3000
echo.
echo Wait a few seconds for servers to fully start, then access:
echo http://192.168.68.103:3000
pause