@echo off
chcp 65001 >nul
echo Yunshui Material Management System - GitHub Deployment
echo ========================================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Git is not installed!
    echo Please install Git first:
    echo 1. Go to https://git-scm.com/download/win
    echo 2. Download and install Git for Windows
    echo 3. Restart command prompt and try again
    echo.
    pause
    exit /b 1
)

echo [OK] Git is installed

REM Check if already initialized
if not exist .git (
    echo Initializing Git repository...
    git init
    echo [OK] Git repository initialized
) else (
    echo [OK] Git repository already exists
)

echo.
echo Adding all files to Git...
git add .

echo.
echo Committing changes...
git commit -m "Deploy: Yunshui Material Management System"

echo.
echo Setting main branch...
git branch -M main

echo.
echo ========================================================
echo IMPORTANT: You need to create a GitHub repository first
echo Repository name suggestion: yunshui-material-management
echo.
echo After creating the repository, run these commands:
echo git remote add origin https://github.com/YOUR_USERNAME/yunshui-material-management.git
echo git push -u origin main
echo.
echo Replace YOUR_USERNAME with your actual GitHub username
echo ========================================================
echo.

pause