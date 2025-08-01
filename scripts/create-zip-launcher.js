const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ZipLauncherCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.zipPath = path.join(this.projectRoot, 'out', 'make', 'zip', 'win32', 'x64', 'NW Buddy Scraper-win32-x64-1.0.0.zip');
    this.extractPath = path.join(this.projectRoot, 'out', 'make', 'zip', 'win32', 'x64', 'extracted');
  }

  async createLauncher() {
    console.log('🔧 Creating launcher for ZIP package...');
    
    try {
      // Extract the ZIP
      console.log('📦 Extracting ZIP package...');
      await this.extractZip();
      
      // Create launcher script
      console.log('📝 Creating launcher script...');
      await this.createLauncherScript();
      
      // Create README
      console.log('📖 Creating README...');
      await this.createReadme();
      
      // Re-zip with launcher
      console.log('📦 Re-packaging with launcher...');
      await this.repackage();
      
      console.log('✅ Launcher created successfully!');
      console.log(`📁 Location: ${this.extractPath}`);
      console.log('🚀 Users can now extract and run the launcher.bat file');
      
    } catch (error) {
      console.error('❌ Failed to create launcher:', error.message);
    }
  }

  async extractZip() {
    // Use PowerShell to extract ZIP
    const command = `powershell -command "Expand-Archive -Path '${this.zipPath}' -DestinationPath '${this.extractPath}' -Force"`;
    execSync(command, { stdio: 'inherit' });
  }

  async createLauncherScript() {
    const launcherContent = `@echo off
title NW Buddy Scraper v1.0.0
echo.
echo ========================================
echo   NW Buddy Scraper v1.0.0
echo ========================================
echo.
echo 🚀 Starting NW Buddy Scraper...
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%NW Buddy Scraper-win32-x64"

REM Check if the app directory exists
if not exist "%APP_DIR%" (
    echo ❌ Application directory not found: %APP_DIR%
    echo Please ensure the ZIP was extracted properly.
    pause
    exit /b 1
)

REM Change to the app directory
cd /d "%APP_DIR%"

REM Start the application
echo 🎮 Launching application...
start "" "NW Buddy Scraper.exe"

echo.
echo ✅ Application started!
echo 👋 You can close this window now.
timeout /t 3 >nul
`;

    const launcherPath = path.join(this.extractPath, 'launcher.bat');
    await fs.writeFile(launcherPath, launcherContent);
  }

  async createReadme() {
    const readmeContent = `# 🎮 NW Buddy Scraper v1.0.0

## 🚀 Quick Start

1. **Extract** this ZIP file to any folder
2. **Double-click** \`launcher.bat\` to start the application
3. **Enjoy** using NW Buddy Scraper!

## 📁 File Structure

\`\`\`
NW Buddy Scraper-win32-x64-1.0.0/
├── launcher.bat                    ← USE THIS TO START
├── README.txt                      ← This file
└── NW Buddy Scraper-win32-x64/    ← Application files
    ├── NW Buddy Scraper.exe
    ├── resources/
    └── ...
\`\`\`

## 🎯 Features

✅ Web scraping with JavaScript support
✅ Market price integration
✅ Schedule maker
✅ Discord bot integration
✅ NW Buddy integration
✅ Daily/Weekly tracking
✅ Theme system
✅ Notification system

## 🛠️ Troubleshooting

- **If the app doesn't start**: Make sure you extracted all files
- **If you get errors**: Try running as administrator
- **For support**: Check the application's help section

## 📞 Support

This is a beta version for testing purposes.
Please report any issues you encounter.

========================================
`;

    const readmePath = path.join(this.extractPath, 'README.txt');
    await fs.writeFile(readmePath, readmeContent);
  }

  async repackage() {
    const newZipPath = path.join(this.projectRoot, 'out', 'make', 'zip', 'win32', 'x64', 'NW Buddy Scraper-with-launcher.zip');
    
    // Use PowerShell to create new ZIP
    const command = `powershell -command "Compress-Archive -Path '${this.extractPath}\\*' -DestinationPath '${newZipPath}' -Force"`;
    execSync(command, { stdio: 'inherit' });
    
    console.log(`✅ New package created: ${newZipPath}`);
  }
}

// Run the launcher creator if this script is executed directly
if (require.main === module) {
  const creator = new ZipLauncherCreator();
  creator.createLauncher().then(() => {
    console.log('\n🎉 Launcher creation completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Failed to create launcher!');
    process.exit(1);
  });
}

module.exports = ZipLauncherCreator; 