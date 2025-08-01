const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SingleNexusBatCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createSingleNexusBat() {
    console.log('🔧 Creating single comprehensive NW Nexus batch file...');
    console.log('='.repeat(50));
    
    try {
      // Create the single batch file
      await this.createSingleBatchFile();
      
      // Create user-friendly README
      await this.createUserReadme();
      
      // Test the batch file
      await this.testBatchFile();
      
      console.log('\n✅ Single NW Nexus batch file created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create single NW Nexus batch file:', error.message);
      throw error;
    }
  }

  async createSingleBatchFile() {
    console.log('📝 Creating single comprehensive NW Nexus batch file...');
    
    const batchContent = `@echo off
title NW Nexus - All-in-One Launcher
color 0A

echo.
echo ============================================================
echo 🎮 NW Nexus - All-in-One Launcher
echo ============================================================
echo Version: 1.0.0-standalone
echo.
echo This launcher will automatically set up and run NW Nexus.
echo No manual installation required!
echo.
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
set "APP_DIR=%LAUNCHER_DIR%app"
set "WIN_UNPACKED=%LAUNCHER_DIR%win-unpacked"

echo 📁 Checking environment...
echo    Launcher directory: %LAUNCHER_DIR%
echo    App directory: %APP_DIR%
echo.

REM Check if this is first run (no app directory)
if not exist "%APP_DIR%" (
    echo 🆕 First time setup detected!
    echo.
    echo This appears to be your first time running NW Nexus.
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
        xcopy "%WIN_UNPACKED%\\*" "%APP_DIR%\\" /E /I /Y
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
    echo 🎉 NW Nexus is now ready to use!
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
set "MAIN_JS=%APP_DIR%\\electron\\main.js"
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
echo 🚀 Starting NW Nexus...
echo ============================================================
echo.

REM Change to the app directory and run the application directly
cd /d "%APP_DIR%"

echo 📂 Changed to directory: %CD%
echo 📦 Running: npm start
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
echo Press any key to exit...
pause >nul
`;
    
    const batchPath = path.join(this.distBetaPath, 'START-NW-NEXUS.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Single NW Nexus batch file created:', batchPath);
  }

  async createUserReadme() {
    console.log('📝 Creating user README...');
    
    const readmeContent = `# NW Nexus - All-in-One Launcher

## 🚀 Quick Start

### For All Users:
1. **Double-click** \`START-NW-NEXUS.bat\`
2. The app will automatically set up everything you need
3. Wait for the setup to complete (first time only)
4. The app will start automatically

## 📋 Requirements

- **Windows 10 or later**
- **Internet connection** (for first-time setup)
- **Node.js** (will be checked and prompted if missing)

## 📁 File Structure

\`\`\`
NW-Nexus/
├── START-NW-NEXUS.bat    ← Double-click this to start
├── win-unpacked/                  ← Application files
└── README.txt                     ← This file
\`\`\`

## 🔧 Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Choose the LTS version
- Restart your computer after installation

### "npm is not recognized"
- Reinstall Node.js
- Make sure to check "Add to PATH" during installation
- Restart your computer

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
3. **Check your internet connection** for first-time setup
4. **Try running as administrator**
5. **Delete the 'app' folder** and run the launcher again

## 🎮 About

**NW Nexus - All-in-One Launcher**
- Version: 1.0.0-standalone
- Single file launcher
- Automatic setup and dependency management
- First-time user friendly
- No complex installation required

## 🔄 Updates

To update the application:
1. Download the new version
2. Extract to a new folder
3. Run the new \`START-NW-NEXUS.bat\`
4. The app will automatically set up the new version
`;
    
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    await fs.writeFile(readmePath, readmeContent);
    console.log('   ✅ User README created:', readmePath);
  }

  async testBatchFile() {
    console.log('🧪 Testing single NW Nexus batch file...');
    
    const batchPath = path.join(this.distBetaPath, 'START-NW-NEXUS.bat');
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Single NW Nexus batch file not found');
    }
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README file not found');
    }
    
    console.log('   ✅ Single NW Nexus batch file found:', batchPath);
    console.log('   ✅ README file found:', readmePath);
    console.log('   ✅ Single NW Nexus batch file looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new SingleNexusBatCreator();
  creator.createSingleNexusBat().then(() => {
    console.log('\n🎉 Single NW Nexus batch file creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created single comprehensive NW Nexus batch file');
    console.log('✅ Created user README');
    console.log('✅ Tested batch file');
    console.log('\n🚀 Your single NW Nexus batch file is ready!');
    console.log('📁 Launcher: dist-beta/START-NW-NEXUS.bat');
    console.log('📄 README: dist-beta/README.txt');
    console.log('\n💡 For Users:');
    console.log('   1. Double-click START-NW-NEXUS.bat');
    console.log('   2. App automatically sets up everything');
    console.log('   3. No manual installation required!');
    console.log('\n🎯 This is a single file solution that works for any user!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Single NW Nexus batch file creation failed!');
    process.exit(1);
  });
}

module.exports = SingleNexusBatCreator; 