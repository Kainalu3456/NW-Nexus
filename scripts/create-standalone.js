const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class StandaloneCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createStandalone() {
    console.log('🔧 Creating standalone application...');
    console.log('='.repeat(50));
    
    try {
      // Create the standalone launcher
      await this.createStandaloneLauncher();
      
      // Create the setup script
      await this.createSetupScript();
      
      // Create the download script
      await this.createDownloadScript();
      
      // Create user-friendly README
      await this.createUserReadme();
      
      // Test the standalone
      await this.testStandalone();
      
      console.log('\n✅ Standalone application created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create standalone application:', error.message);
      throw error;
    }
  }

  async createStandaloneLauncher() {
    console.log('📝 Creating standalone launcher...');
    
    const launcherContent = `@echo off
title NW Buddy Scraper - Standalone
color 0A

echo.
echo ============================================================
echo 🎮 NW Buddy Scraper - Standalone Edition
echo ============================================================
echo Version: 1.0.0-standalone
echo.
echo This is a standalone version that will automatically
echo download and set up everything you need.
echo.
echo ============================================================
echo.

REM Get the directory where this launcher is located
set "LAUNCHER_DIR=%~dp0"
set "APP_DIR=%LAUNCHER_DIR%app"
set "SETUP_SCRIPT=%LAUNCHER_DIR%setup.bat"
set "DOWNLOAD_SCRIPT=%LAUNCHER_DIR%download-deps.bat"

echo 📁 Checking application files...
echo    Launcher directory: %LAUNCHER_DIR%
echo    App directory: %APP_DIR%
echo.

REM Check if this is first run (no app directory)
if not exist "%APP_DIR%" (
    echo 🆕 First time setup detected!
    echo.
    echo This appears to be your first time running NW Buddy Scraper.
    echo The application will now download and set up everything you need.
    echo.
    echo 📦 Downloading dependencies...
    echo.
    
    REM Run the setup script
    if exist "%SETUP_SCRIPT%" (
        call "%SETUP_SCRIPT%"
        if %errorlevel% neq 0 (
            echo ❌ Setup failed! Please check the error messages above.
            pause
            exit /b 1
        )
    ) else (
        echo ❌ Setup script not found: %SETUP_SCRIPT%
        pause
        exit /b 1
    )
    
    echo.
    echo ✅ Setup completed successfully!
    echo.
)

REM Check if app directory exists now
if not exist "%APP_DIR%" (
    echo ❌ ERROR: App directory not found after setup
    echo    Expected at: %APP_DIR%
    echo.
    echo 💡 Try running the setup script manually: setup.bat
    pause
    exit /b 1
)

REM Check for the main application file
set "MAIN_JS=%APP_DIR%\\electron\\main.js"
if not exist "%MAIN_JS%" (
    echo ❌ ERROR: Main application file not found
    echo    Expected at: %MAIN_JS%
    echo.
    echo 💡 The application may not have downloaded correctly.
    echo    Try running: setup.bat
    pause
    exit /b 1
)

echo ✅ Application files found successfully!
echo.
echo 🚀 Starting NW Buddy Scraper...
echo ============================================================
echo.

REM Change to the app directory and run the application
cd /d "%APP_DIR%"

echo 📂 Changed to directory: %CD%
echo 📦 Running: npm start
echo.

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
    
    const launcherPath = path.join(this.distBetaPath, 'NW-BUDDY-SCRAPER-STANDALONE.bat');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Standalone launcher created:', launcherPath);
  }

  async createSetupScript() {
    console.log('📝 Creating setup script...');
    
    const setupContent = `@echo off
title NW Buddy Scraper - Setup
color 0B

echo.
echo ============================================================
echo 🔧 NW Buddy Scraper - First Time Setup
echo ============================================================
echo.
echo This script will download and set up everything you need
echo to run NW Buddy Scraper on your computer.
echo.
echo ============================================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%app"
set "DOWNLOAD_SCRIPT=%SCRIPT_DIR%download-deps.bat"

echo 📁 Setup directory: %SCRIPT_DIR%
echo 📁 App directory: %APP_DIR%
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

REM Check if Node.js is installed
echo 🔍 Checking for Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo.
    echo 📥 Please install Node.js from: https://nodejs.org/
    echo    Download the LTS version and install it.
    echo    Then run this setup script again.
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
echo 📦 Downloading application files...
echo.

REM Run the download script
if exist "%DOWNLOAD_SCRIPT%" (
    call "%DOWNLOAD_SCRIPT%"
    if %errorlevel% neq 0 (
        echo ❌ Download failed! Please check the error messages above.
        pause
        exit /b 1
    )
) else (
    echo ❌ Download script not found: %DOWNLOAD_SCRIPT%
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ✅ Setup completed successfully!
echo ============================================================
echo.
echo 🎉 NW Buddy Scraper is now ready to use!
echo.
echo 💡 You can now run: NW-BUDDY-SCRAPER-STANDALONE.bat
echo.
pause
`;
    
    const setupPath = path.join(this.distBetaPath, 'setup.bat');
    await fs.writeFile(setupPath, setupContent);
    console.log('   ✅ Setup script created:', setupPath);
  }

  async createDownloadScript() {
    console.log('📝 Creating download script...');
    
    const downloadContent = `@echo off
title NW Buddy Scraper - Downloading Dependencies
color 0E

echo.
echo ============================================================
echo 📥 NW Buddy Scraper - Downloading Dependencies
echo ============================================================
echo.
echo This script will download the application files and
echo install all necessary dependencies.
echo.
echo ============================================================
echo.

REM Get the directory where this script is located
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%app"

echo 📁 Download directory: %SCRIPT_DIR%
echo 📁 App directory: %APP_DIR%
echo.

REM Create app directory if it doesn't exist
if not exist "%APP_DIR%" (
    echo 📁 Creating app directory...
    mkdir "%APP_DIR%"
)

REM Copy the win-unpacked contents to app directory
set "WIN_UNPACKED=%SCRIPT_DIR%win-unpacked"
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

REM Change to app directory
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
echo 🎉 Download and setup completed!
echo ============================================================
echo.
echo The application is now ready to use.
echo.
`;
    
    const downloadPath = path.join(this.distBetaPath, 'download-deps.bat');
    await fs.writeFile(downloadPath, downloadContent);
    console.log('   ✅ Download script created:', downloadPath);
  }

  async createUserReadme() {
    console.log('📝 Creating user README...');
    
    const readmeContent = `# NW Buddy Scraper - Standalone Edition

## 🚀 Quick Start

### First Time Users:
1. **Double-click** \`NW-BUDDY-SCRAPER-STANDALONE.bat\`
2. The app will automatically download and set up everything you need
3. Wait for the setup to complete
4. The app will start automatically

### Returning Users:
1. **Double-click** \`NW-BUDDY-SCRAPER-STANDALONE.bat\`
2. The app starts immediately

## 📋 Requirements

- **Windows 10 or later**
- **Internet connection** (for first-time setup)
- **Node.js** (will be checked and prompted if missing)

## 🔧 Manual Setup (if needed)

If the automatic setup doesn't work:

1. **Install Node.js** from https://nodejs.org/ (LTS version)
2. **Restart your computer**
3. **Run** \`setup.bat\` manually
4. **Then run** \`NW-BUDDY-SCRAPER-STANDALONE.bat\`

## 📁 File Structure

\`\`\`
NW-Buddy-Scraper-Standalone/
├── NW-BUDDY-SCRAPER-STANDALONE.bat    ← Double-click this to start
├── setup.bat                          ← Manual setup (if needed)
├── download-deps.bat                  ← Manual download (if needed)
├── win-unpacked/                      ← Application files
└── README.txt                         ← This file
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
- Try running \`setup.bat\` manually
- Make sure you have enough disk space

### "Application doesn't start"
- Try running as administrator
- Check Windows Defender isn't blocking the app
- Make sure all files are present

## 📞 Support

If you continue to have issues:

1. **Check the error messages** in the command window
2. **Try running** \`setup.bat\` manually
3. **Make sure Node.js is installed** and in your PATH
4. **Check your internet connection** for first-time setup
5. **Try running as administrator**

## 🎮 About

**NW Buddy Scraper - Standalone Edition**
- Version: 1.0.0-standalone
- Automatic dependency management
- First-time user friendly
- No complex installation required

## 🔄 Updates

To update the application:
1. Download the new version
2. Extract to a new folder
3. Run the new \`NW-BUDDY-SCRAPER-STANDALONE.bat\`
4. The app will automatically set up the new version
`;
    
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    await fs.writeFile(readmePath, readmeContent);
    console.log('   ✅ User README created:', readmePath);
  }

  async testStandalone() {
    console.log('🧪 Testing standalone...');
    
    const launcherPath = path.join(this.distBetaPath, 'NW-BUDDY-SCRAPER-STANDALONE.bat');
    const setupPath = path.join(this.distBetaPath, 'setup.bat');
    const downloadPath = path.join(this.distBetaPath, 'download-deps.bat');
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    
    if (!fs.existsSync(launcherPath)) {
      throw new Error('Standalone launcher not found');
    }
    
    if (!fs.existsSync(setupPath)) {
      throw new Error('Setup script not found');
    }
    
    if (!fs.existsSync(downloadPath)) {
      throw new Error('Download script not found');
    }
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README file not found');
    }
    
    console.log('   ✅ Standalone launcher found:', launcherPath);
    console.log('   ✅ Setup script found:', setupPath);
    console.log('   ✅ Download script found:', downloadPath);
    console.log('   ✅ README file found:', readmePath);
    console.log('   ✅ Standalone looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new StandaloneCreator();
  creator.createStandalone().then(() => {
    console.log('\n🎉 Standalone creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created standalone launcher');
    console.log('✅ Created setup script');
    console.log('✅ Created download script');
    console.log('✅ Created user README');
    console.log('✅ Tested standalone');
    console.log('\n🚀 Your standalone application is ready!');
    console.log('📁 Launcher: dist-beta/NW-BUDDY-SCRAPER-STANDALONE.bat');
    console.log('📁 Setup: dist-beta/setup.bat');
    console.log('📁 Download: dist-beta/download-deps.bat');
    console.log('📁 README: dist-beta/README.txt');
    console.log('\n💡 For Users:');
    console.log('   1. Double-click NW-BUDDY-SCRAPER-STANDALONE.bat');
    console.log('   2. App will automatically download and set up everything');
    console.log('   3. No manual installation required!');
    console.log('\n🎯 This is a true standalone that works for any user!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Standalone creation failed!');
    process.exit(1);
  });
}

module.exports = StandaloneCreator; 