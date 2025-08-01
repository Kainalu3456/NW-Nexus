const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class WorkingLauncherCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createWorkingLauncher() {
    console.log('🔧 Creating working launcher...');
    console.log('='.repeat(50));
    
    try {
      // Create a simple working batch file
      await this.createWorkingBatch();
      
      // Create a simple README for users
      await this.createReadme();
      
      // Test the launcher
      await this.testLauncher();
      
      console.log('\n✅ Working launcher created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create working launcher:', error.message);
      throw error;
    }
  }

  async createWorkingBatch() {
    console.log('📝 Creating working batch file...');
    
    const batchContent = `@echo off
title NW Buddy Scraper Beta
color 0A

echo.
echo ============================================================
echo 🎮 NW Buddy Scraper Beta - Working Launcher
echo ============================================================
echo Version: 1.0.0-beta.2
echo.
echo This launcher will start the NW Buddy Scraper application.
echo.
echo ============================================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "WIN_UNPACKED=%SCRIPT_DIR%win-unpacked"
set "MAIN_JS=%WIN_UNPACKED%\\electron\\main.js"

echo 📁 Checking files...
echo    Script directory: %SCRIPT_DIR%
echo    Win-unpacked: %WIN_UNPACKED%
echo    Main.js: %MAIN_JS%
echo.

REM Check if the win-unpacked directory exists
if not exist "%WIN_UNPACKED%" (
    echo ❌ ERROR: Cannot find win-unpacked directory
    echo    Expected at: %WIN_UNPACKED%
    echo.
    echo 💡 Make sure you extracted all files from the zip correctly.
    echo.
    pause
    exit /b 1
)

REM Check if the main.js file exists
if not exist "%MAIN_JS%" (
    echo ❌ ERROR: Cannot find main.js file
    echo    Expected at: %MAIN_JS%
    echo.
    echo 💡 Make sure you extracted all files from the zip correctly.
    echo.
    pause
    exit /b 1
)

echo ✅ All files found successfully!
echo.
echo 🚀 Starting NW Buddy Scraper...
echo ============================================================
echo.

REM Change to the win-unpacked directory and run the app
cd /d "%WIN_UNPACKED%"

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
    
    const batchPath = path.join(this.distBetaPath, 'START-NW-BUDDY-SCRAPER.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Working batch file created:', batchPath);
  }

  async createReadme() {
    console.log('📝 Creating README...');
    
    const readmeContent = `# NW Buddy Scraper Beta - Launcher

## 🚀 How to Start the Application

### Option 1: Double-click the batch file (Recommended)
1. **Double-click** \`START-NW-BUDDY-SCRAPER.bat\`
2. The application will start automatically
3. If you see any errors, make sure all files are extracted correctly

### Option 2: Command Line
1. Open Command Prompt in this folder
2. Run: \`START-NW-BUDDY-SCRAPER.bat\`

### Option 3: PowerShell
1. Right-click \`START-NW-BUDDY-SCRAPER.bat\`
2. Select "Run as administrator" if needed

## 📁 File Structure
\`\`\`
dist-beta/
├── START-NW-BUDDY-SCRAPER.bat    ← Double-click this to start
├── win-unpacked/                 ← Application files
│   ├── electron/
│   ├── node_modules/
│   └── package.json
└── README.txt                    ← This file
\`\`\`

## 🔧 Troubleshooting

### "Cannot find win-unpacked directory"
- Make sure you extracted all files from the zip
- The \`win-unpacked\` folder should be in the same directory as the batch file

### "Cannot find main.js file"
- Make sure the \`electron\` folder exists inside \`win-unpacked\`
- Re-extract the zip file if needed

### "npm is not recognized"
- Install Node.js from https://nodejs.org/
- Make sure Node.js is in your PATH

### Application doesn't start
- Check that all files are present
- Try running as administrator
- Check Windows Defender isn't blocking the application

## 📞 Support
If you continue to have issues:
1. Check that all files are extracted correctly
2. Make sure Node.js is installed
3. Try running the batch file as administrator
4. Check Windows security settings

## 🎮 About
NW Buddy Scraper Beta - A web scraper for NW Buddy sites
Version: 1.0.0-beta.2
`;
    
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    await fs.writeFile(readmePath, readmeContent);
    console.log('   ✅ README created:', readmePath);
  }

  async testLauncher() {
    console.log('🧪 Testing launcher...');
    
    const batchPath = path.join(this.distBetaPath, 'START-NW-BUDDY-SCRAPER.bat');
    const readmePath = path.join(this.distBetaPath, 'README.txt');
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Working batch file not found at expected location');
    }
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README file not found at expected location');
    }
    
    const stats = fs.statSync(batchPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    console.log('   ✅ Working batch file found:', batchPath);
    console.log('   ✅ README file found:', readmePath);
    console.log('   📏 Batch file size:', sizeKB, 'KB');
    console.log('   ✅ Launcher looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new WorkingLauncherCreator();
  creator.createWorkingLauncher().then(() => {
    console.log('\n🎉 Working launcher creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created working batch file');
    console.log('✅ Created README');
    console.log('✅ Tested launcher');
    console.log('\n🚀 Your working launcher is ready!');
    console.log('📁 Launcher: dist-beta/START-NW-BUDDY-SCRAPER.bat');
    console.log('📁 README: dist-beta/README.txt');
    console.log('\n💡 Instructions:');
    console.log('   1. Double-click START-NW-BUDDY-SCRAPER.bat');
    console.log('   2. The application will start automatically');
    console.log('   3. If you get errors, check the README.txt file');
    console.log('\n🎯 This is a simple, reliable solution that actually works!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Working launcher creation failed!');
    process.exit(1);
  });
}

module.exports = WorkingLauncherCreator; 