@echo off
title NW Buddy Scraper - Launcher
color 0B

echo.
echo ============================================================
echo 🚀 NW Buddy Scraper - Application Launcher
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
set "APP_DIR=%LAUNCHER_DIR%app"

echo 📁 Launching from: %LAUNCHER_DIR%
echo 📁 App directory: %APP_DIR%
echo.

REM Change to the app directory
cd /d "%APP_DIR%"

echo 📂 Changed to directory: %CD%
echo 📦 Running: npm start
echo.

REM Run the application
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
