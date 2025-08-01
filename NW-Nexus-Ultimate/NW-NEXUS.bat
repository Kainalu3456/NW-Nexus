@echo off
title NW Nexus - Ultimate Single Launcher
color 0A

echo.
echo ============================================================
echo 🎮 NW Nexus - Ultimate Single Launcher
echo ============================================================
echo Version: 1.0.0-ultimate
echo.
echo This is the ONLY file you need to run NW Nexus!
echo No folders, no setup, just double-click and go!
echo.
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
set "TEMP_APP_DIR=%TEMP%\nw-nexus-temp"

echo 📁 Checking environment...
echo    Launcher directory: %LAUNCHER_DIR%
echo    Temporary app directory: %TEMP_APP_DIR%
echo.

REM Check if Node.js is installed
echo 🔍 Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo 📥 Please install Node.js from: https://nodejs.org/
    echo    Download the LTS version and install it.
    echo    Then run this launcher again.
    echo.
    echo 💡 After installing Node.js, restart your computer
    echo    to ensure it's properly added to PATH.
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Node.js found
    node --version
)

REM Check if npm is available
echo 🔍 Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    echo.
    echo 💡 Try reinstalling Node.js or restarting your computer.
    pause
    exit /b 1
) else (
    echo ✅ npm found
    npm --version
)

echo.
echo ✅ Prerequisites check passed!
echo.

REM Check if win-unpacked exists
set "WIN_UNPACKED=%LAUNCHER_DIR%win-unpacked"
echo 🔍 Checking for win-unpacked directory: %WIN_UNPACKED%
if not exist "%WIN_UNPACKED%" (
    echo ❌ win-unpacked directory not found: %WIN_UNPACKED%
    echo.
    echo 💡 Make sure the application files are available.
    echo    This launcher needs to be in the same folder as win-unpacked.
    echo.
    echo 📁 Current directory contents:
    dir /b "%LAUNCHER_DIR%"
    echo.
    pause
    exit /b 1
) else (
    echo ✅ win-unpacked directory found
)

echo 📦 Setting up temporary application environment...
echo.

REM Create temporary app directory
if exist "%TEMP_APP_DIR%" (
    echo 🧹 Cleaning existing temporary directory...
    rmdir /s /q "%TEMP_APP_DIR%"
)

echo 📁 Creating temporary app directory...
mkdir "%TEMP_APP_DIR%"
if %errorlevel% neq 0 (
    echo ❌ Failed to create temporary app directory
    pause
    exit /b 1
)

REM Copy the win-unpacked contents to temporary app directory
echo 📁 Copying application files...
echo    From: %WIN_UNPACKED%
echo    To: %TEMP_APP_DIR%
xcopy "%WIN_UNPACKED%\*" "%TEMP_APP_DIR%\" /E /I /Y
if %errorlevel% neq 0 (
    echo ❌ Failed to copy application files
    echo.
    echo 💡 Check if you have permission to write to the temp directory.
    pause
    exit /b 1
)
echo ✅ Application files copied successfully

REM Change to temporary app directory and install dependencies
cd /d "%TEMP_APP_DIR%"
echo 📂 Changed to directory: %CD%

echo.
echo 📦 Installing dependencies...
echo.

REM Install dependencies
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    echo.
    echo 💡 Try running: npm install --force
    echo 💡 Check your internet connection
    pause
    exit /b 1
)

echo.
echo ✅ Dependencies installed successfully!
echo.

REM Check for the main application file
set "MAIN_JS=%TEMP_APP_DIR%\electron\main.js"
echo 🔍 Checking for main application file: %MAIN_JS%
if not exist "%MAIN_JS%" (
    echo ❌ ERROR: Main application file not found
    echo    Expected at: %MAIN_JS%
    echo.
    echo 💡 The application may not have set up correctly.
    echo 💡 Check if win-unpacked contains the correct files.
    echo.
    echo 📁 Contents of temp directory:
    dir /b "%TEMP_APP_DIR%"
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Main application file found
)

echo ✅ Application files found successfully!
echo.
echo 🚀 Starting NW Nexus...
echo ============================================================
echo.

REM Run the application directly
npm start

set EXIT_CODE=%errorlevel%

echo.
echo ============================================================
if %EXIT_CODE% equ 0 (
    echo ✅ Application exited successfully
) else (
    echo ❌ Application exited with error code: %EXIT_CODE%
)
echo ============================================================
echo.

REM Clean up temporary directory
echo 🧹 Cleaning up temporary files...
if exist "%TEMP_APP_DIR%" (
    rmdir /s /q "%TEMP_APP_DIR%"
    echo ✅ Temporary files cleaned up
)

echo.
echo Press any key to exit...
pause >nul
