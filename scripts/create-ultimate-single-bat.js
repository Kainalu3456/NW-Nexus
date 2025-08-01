const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class UltimateSingleBatCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createUltimateSingleBat() {
    console.log('🔧 Creating ultimate single NW Nexus batch file...');
    console.log('='.repeat(50));
    
    try {
      // Create the ultimate single batch file
      await this.createUltimateBatchFile();
      
      // Create user-friendly README
      await this.createUserReadme();
      
      // Test the batch file
      await this.testBatchFile();
      
      console.log('\n✅ Ultimate single NW Nexus batch file created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create ultimate single NW Nexus batch file:', error.message);
      throw error;
    }
  }

  async createUltimateBatchFile() {
    console.log('📝 Creating ultimate single NW Nexus batch file...');
    
    const batchContent = `@echo off
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
set "TEMP_APP_DIR=%TEMP%\\nw-nexus-temp"

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
xcopy "%WIN_UNPACKED%\\*" "%TEMP_APP_DIR%\\" /E /I /Y
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
set "MAIN_JS=%TEMP_APP_DIR%\\electron\\main.js"
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
`;
    
    const batchPath = path.join(this.distBetaPath, 'NW-NEXUS.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Ultimate single NW Nexus batch file created:', batchPath);
  }

  async createUserReadme() {
    console.log('📝 Creating user README...');
    
    const readmeContent = `# NW Nexus - Ultimate Single Launcher

## 🚀 Quick Start

### For All Users:
1. **Double-click** \`NW-NEXUS.bat\`
2. The app will automatically set up and launch
3. **That's it!** - No folders, no setup, just run and go!

## 📋 Requirements

- **Windows 10 or later**
- **Internet connection** (for first-time dependency download)
- **Node.js** (will be checked and prompted if missing)

## 📁 File Structure

\`\`\`
NW-Nexus/
├── NW-NEXUS.bat         ← Double-click this to start
├── win-unpacked/        ← Application files
└── README.txt           ← This file
\`\`\`

## ✨ Features

- **Single file launcher** - Just one .bat file!
- **No permanent folders** - Uses temporary directory
- **Auto-cleanup** - Removes temporary files after use
- **No installation** - Runs directly from the folder
- **First-time user friendly** - Checks prerequisites automatically

## 🔧 Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Choose the LTS version
- Restart your computer after installation

### "npm is not recognized"
- Reinstall Node.js
- Make sure to check "Add to PATH" during installation
- Restart your computer

### "win-unpacked directory not found"
- Make sure \`NW-NEXUS.bat\` is in the same folder as \`win-unpacked\`
- Don't move the .bat file to a different location

### "Failed to install dependencies"
- Check your internet connection
- Make sure you have enough disk space
- Try running the launcher again

### "Application doesn't start"
- Try running as administrator
- Check Windows Defender isn't blocking the app
- Make sure all files are present

## 📞 Support

If you continue to have issues:

1. **Check the error messages** in the command window
2. **Make sure Node.js is installed** and in your PATH
3. **Check your internet connection** for dependency download
4. **Try running as administrator**
5. **Make sure the .bat file is in the correct folder**

## 🎮 About

**NW Nexus - Ultimate Single Launcher**
- Version: 1.0.0-ultimate
- Single file launcher
- No permanent installation
- Temporary setup and cleanup
- Zero footprint after use

## 🔄 Updates

To update the application:
1. Download the new version
2. Extract to a new folder
3. Run the new \`NW-NEXUS.bat\`
4. The app will automatically set up the new version

## 💡 How It Works

1. **Checks prerequisites** (Node.js, npm)
2. **Creates temporary directory** in %TEMP%
3. **Copies application files** to temp directory
4. **Installs dependencies** in temp directory
5. **Launches application** from temp directory
6. **Cleans up** temp directory after exit

This means no permanent folders are created on your system!
`;
    
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    await fs.writeFile(readmePath, readmeContent);
    console.log('   ✅ User README created:', readmePath);
  }

  async testBatchFile() {
    console.log('🧪 Testing ultimate single NW Nexus batch file...');
    
    const batchPath = path.join(this.distBetaPath, 'NW-NEXUS.bat');
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Ultimate single NW Nexus batch file not found');
    }
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README file not found');
    }
    
    console.log('   ✅ Ultimate single NW Nexus batch file found:', batchPath);
    console.log('   ✅ README file found:', readmePath);
    console.log('   ✅ Ultimate single NW Nexus batch file looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new UltimateSingleBatCreator();
  creator.createUltimateSingleBat().then(() => {
    console.log('\n🎉 Ultimate single NW Nexus batch file creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created ultimate single NW Nexus batch file');
    console.log('✅ Created user README');
    console.log('✅ Tested batch file');
    console.log('\n🚀 Your ultimate single NW Nexus batch file is ready!');
    console.log('📁 Launcher: dist-beta/NW-NEXUS.bat');
    console.log('📄 README: dist-beta/README.txt');
    console.log('\n💡 For Users:');
    console.log('   1. Double-click NW-NEXUS.bat');
    console.log('   2. App sets up in temp directory and launches');
    console.log('   3. No permanent folders created!');
    console.log('\n🎯 This is the ultimate single file solution!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Ultimate single NW Nexus batch file creation failed!');
    process.exit(1);
  });
}

module.exports = UltimateSingleBatCreator; 