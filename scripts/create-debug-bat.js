const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class DebugBatCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createDebugBat() {
    console.log('🔧 Creating debug NW Nexus batch file...');
    console.log('='.repeat(50));
    
    try {
      // Create the debug batch file
      await this.createDebugBatchFile();
      
      console.log('\n✅ Debug NW Nexus batch file created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create debug NW Nexus batch file:', error.message);
      throw error;
    }
  }

  async createDebugBatchFile() {
    console.log('📝 Creating debug NW Nexus batch file...');
    
    const batchContent = `@echo off
title NW Nexus - Debug Launcher
color 0A

echo.
echo ============================================================
echo 🎮 NW Nexus - Debug Launcher
echo ============================================================
echo Version: 1.0.0-debug
echo.
echo This debug version will show you exactly what's happening.
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
echo 📁 Launcher directory: %LAUNCHER_DIR%

echo.
echo ============================================================
echo STEP 1: Checking current directory contents
echo ============================================================
echo.
echo 📁 Current directory contents:
dir /b "%LAUNCHER_DIR%"
echo.

echo ============================================================
echo STEP 2: Checking for Node.js
echo ============================================================
echo.
echo 🔍 Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo 📥 Please install Node.js from: https://nodejs.org/
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ Node.js found
    node --version
)

echo.
echo ============================================================
echo STEP 3: Checking for npm
echo ============================================================
echo.
echo 🔍 Checking for npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    echo.
    echo 💡 Try reinstalling Node.js or restarting your computer.
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ npm found
    npm --version
)

echo.
echo ============================================================
echo STEP 4: Checking for win-unpacked directory
echo ============================================================
echo.
set "WIN_UNPACKED=%LAUNCHER_DIR%win-unpacked"
echo 🔍 Looking for: %WIN_UNPACKED%
if not exist "%WIN_UNPACKED%" (
    echo ❌ win-unpacked directory not found!
    echo.
    echo 💡 This launcher needs to be in the same folder as win-unpacked.
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ win-unpacked directory found!
    echo.
    echo 📁 win-unpacked contents:
    dir /b "%WIN_UNPACKED%"
)

echo.
echo ============================================================
echo STEP 5: Checking for package.json in win-unpacked
echo ============================================================
echo.
set "PACKAGE_JSON=%WIN_UNPACKED%\\package.json"
echo 🔍 Looking for: %PACKAGE_JSON%
if not exist "%PACKAGE_JSON%" (
    echo ❌ package.json not found in win-unpacked!
    echo.
    echo 💡 The win-unpacked directory may not contain the correct files.
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ package.json found!
)

echo.
echo ============================================================
echo STEP 6: Checking for electron directory
echo ============================================================
echo.
set "ELECTRON_DIR=%WIN_UNPACKED%\\electron"
echo 🔍 Looking for: %ELECTRON_DIR%
if not exist "%ELECTRON_DIR%" (
    echo ❌ electron directory not found!
    echo.
    echo 💡 The win-unpacked directory may not contain the correct files.
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ electron directory found!
    echo.
    echo 📁 electron contents:
    dir /b "%ELECTRON_DIR%"
)

echo.
echo ============================================================
echo STEP 7: Checking for main.js
echo ============================================================
echo.
set "MAIN_JS=%ELECTRON_DIR%\\main.js"
echo 🔍 Looking for: %MAIN_JS%
if not exist "%MAIN_JS%" (
    echo ❌ main.js not found!
    echo.
    echo 💡 The electron directory may not contain the correct files.
    echo.
    echo Press any key to continue...
    pause >nul
    goto :end
) else (
    echo ✅ main.js found!
)

echo.
echo ============================================================
echo STEP 8: Testing npm start command
echo ============================================================
echo.
echo 🔍 Testing if we can run npm start...
cd /d "%WIN_UNPACKED%"
echo 📂 Changed to directory: %CD%
echo.
echo 💡 About to test npm start...
echo 💡 This will show if the app can actually start.
echo.
echo Press any key to test npm start (or Ctrl+C to cancel)...
pause >nul

echo.
echo 🚀 Testing npm start...
npm start

set EXIT_CODE=%errorlevel%

echo.
echo ============================================================
echo RESULT: npm start exited with code: %EXIT_CODE%
echo ============================================================

:end
echo.
echo ============================================================
echo DEBUG SESSION COMPLETE
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
`;
    
    const batchPath = path.join(this.distBetaPath, 'NW-NEXUS-DEBUG.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Debug NW Nexus batch file created:', batchPath);
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new DebugBatCreator();
  creator.createDebugBat().then(() => {
    console.log('\n🎉 Debug NW Nexus batch file creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created debug NW Nexus batch file');
    console.log('\n🚀 Your debug NW Nexus batch file is ready!');
    console.log('📁 Launcher: dist-beta/NW-NEXUS-DEBUG.bat');
    console.log('\n💡 For Testing:');
    console.log('   1. Double-click NW-NEXUS-DEBUG.bat');
    console.log('   2. It will show you exactly what\'s happening');
    console.log('   3. It will stay open even if there are errors');
    console.log('\n🎯 This will help us identify the exact issue!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Debug NW Nexus batch file creation failed!');
    process.exit(1);
  });
}

module.exports = DebugBatCreator;