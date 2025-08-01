@echo off
echo Starting NW Buddy Scraper Beta v1.0.0...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --production
)

REM Start the application
echo Starting application...
npm start

echo.
echo Application closed.
pause
