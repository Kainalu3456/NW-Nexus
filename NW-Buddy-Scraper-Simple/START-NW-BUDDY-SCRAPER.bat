@echo off
title NW Buddy Scraper - All-in-One Launcher
color 0A

echo.
echo ============================================================
echo 🎮 NW Buddy Scraper - All-in-One Launcher
echo ============================================================
echo Version: 1.0.0-standalone
echo.
echo This launcher will automatically set up and run NW Buddy Scraper.
echo No manual installation required!
echo.
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
set "APP_DIR=%LAUNCHER_DIR%app"
set "WIN_UNPACKED=%LAUNCHER_DIR%win-unpacked"
set "LAUNCHER_BAT=%LAUNCHER_DIR%launch-app.bat"

echo 📁 Checking environment...
echo    Launcher directory: %LAUNCHER_DIR%
echo    App directory: %APP_DIR%
echo.

REM Check if this is first run (no app directory)
if not exist "%APP_DIR%" (
    echo 🆕 First time setup detected!
    echo.
    echo This appears to be your first time running NW Buddy Scraper.
    echo The application will now set up everything you need.
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
    echo 📦 Setting up application...
    echo.
    
    REM Create app directory
    if not exist "%APP_DIR%" (
        echo 📁 Creating app directory...
        mkdir "%APP_DIR%"
        if %errorlevel% neq 0 (
            echo ❌ Failed to create app directory
            pause
            exit /b 1
        )
    )
    
    REM Copy the win-unpacked contents to app directory
    if exist "%WIN_UNPACKED%" (
        echo 📁 Copying application files...
        xcopy "%WIN_UNPACKED%\*" "%APP_DIR%\" /E /I /Y
        if %errorlevel% neq 0 (
            echo ❌ Failed to copy application files
            pause
            exit /b 1
        )
        echo ✅ Application files copied successfully
    ) else (
        echo ❌ win-unpacked directory not found: %WIN_UNPACKED%
        echo.
        echo 💡 Make sure the application files are available.
        pause
        exit /b 1
    )
    
    REM Change to app directory and install dependencies
    cd /d "%APP_DIR%"
    
    echo.
    echo 📦 Installing dependencies...
    echo.
    
    REM Install dependencies
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        echo.
        echo 💡 Try running: npm install --force
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Dependencies installed successfully!
    echo.
    echo ============================================================
    echo ✅ Setup completed successfully!
    echo ============================================================
    echo.
    echo 🎉 NW Buddy Scraper is now ready to use!
    echo.
) else (
    echo ✅ Application already set up!
    echo.
)

REM Check if app directory exists now
if not exist "%APP_DIR%" (
    echo ❌ ERROR: App directory not found after setup
    echo    Expected at: %APP_DIR%
    echo.
    echo 💡 Try deleting the app folder and running this launcher again.
    pause
    exit /b 1
)

REM Check for the main application file
set "MAIN_JS=%APP_DIR%\electron\main.js"
if not exist "%MAIN_JS%" (
    echo ❌ ERROR: Main application file not found
    echo    Expected at: %MAIN_JS%
    echo.
    echo 💡 The application may not have set up correctly.
    echo    Try deleting the app folder and running this launcher again.
    pause
    exit /b 1
)

echo ✅ Application files found successfully!
echo.
echo 🚀 Starting NW Buddy Scraper...
echo ============================================================
echo.

REM Check if the launcher batch file exists
if exist "%LAUNCHER_BAT%" (
    echo 📂 Found launcher: %LAUNCHER_BAT%
    echo 📦 Launching application via launcher...
    echo.
    
    REM Launch the launcher batch file
    call "%LAUNCHER_BAT%"
    
    set EXIT_CODE=%errorlevel%
) else (
    echo ⚠️  Launcher not found, launching directly...
    echo.
    
    REM Change to the app directory and run the application directly
    cd /d "%APP_DIR%"
    
    echo 📂 Changed to directory: %CD%
    echo 📦 Running: npm start
    echo.
    
    npm start
    
    set EXIT_CODE=%errorlevel%
)

echo.
echo ============================================================
if %EXIT_CODE% equ 0 (
    echo ✅ Application exited successfully
) else (
    echo ❌ Application exited with error code: %EXIT_CODE%
)
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
