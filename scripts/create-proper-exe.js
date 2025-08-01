const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ProperExeBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.version = this.getVersion();
  }

  getVersion() {
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    return packageJson.version;
  }

  async createProperExecutable() {
    console.log('🔨 Creating proper executable...');
    
    // First, let's create a simple Node.js launcher script
    const launcherScript = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this executable is located
const exeDir = path.dirname(process.execPath);
const appDir = path.join(exeDir, 'win-unpacked');

console.log('🚀 Starting NW Buddy Scraper Beta...');
console.log('📁 Application directory:', appDir);

// Check if the app directory exists
if (!fs.existsSync(appDir)) {
  console.error('❌ Application directory not found:', appDir);
  console.error('Please ensure the win-unpacked folder is in the same directory as this executable.');
  process.exit(1);
}

// Change to the app directory
process.chdir(appDir);

// Check if Node.js is available
try {
  require('child_process').execSync('node --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Node.js is not installed or not in PATH');
  console.error('Please install Node.js from https://nodejs.org/');
  process.exit(1);
}

// Install dependencies if needed
if (!fs.existsSync('node_modules')) {
  console.log('📦 Installing dependencies...');
  try {
    require('child_process').execSync('npm install --production', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install dependencies');
    process.exit(1);
  }
}

// Start the application
console.log('🎮 Starting application...');
const app = spawn('npm', ['start'], { 
  stdio: 'inherit',
  shell: true 
});

app.on('close', (code) => {
  console.log('👋 Application closed with code:', code);
  process.exit(code);
});

app.on('error', (error) => {
  console.error('❌ Failed to start application:', error.message);
  process.exit(1);
});
`;

    const launcherPath = path.join(this.distBetaPath, 'launcher.js');
    await fs.writeFile(launcherPath, launcherScript);

    // Create a proper batch file that works
    const batchContent = `@echo off
title NW Buddy Scraper Beta v${this.version}-beta.2
echo.
echo ========================================
echo   NW Buddy Scraper Beta v${this.version}-beta.2
echo ========================================
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "APP_DIR=%SCRIPT_DIR%win-unpacked"

echo 📁 Application directory: %APP_DIR%
echo.

REM Check if the app directory exists
if not exist "%APP_DIR%" (
    echo ❌ Application directory not found: %APP_DIR%
    echo Please ensure the win-unpacked folder is in the same directory as this batch file.
    pause
    exit /b 1
)

REM Change to the app directory
cd /d "%APP_DIR%"

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install --production
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Start the application
echo 🎮 Starting application...
npm start

echo.
echo 👋 Application closed.
pause
`;

    const batchPath = path.join(this.distBetaPath, 'NW Buddy Scraper Beta.bat');
    await fs.writeFile(batchPath, batchContent);

    // Create a PowerShell script as well
    const psContent = `# NW Buddy Scraper Beta Launcher
param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$AppDir = Join-Path $ScriptDir "win-unpacked"

Write-Host "🚀 Starting NW Buddy Scraper Beta..." -ForegroundColor Green
Write-Host "📁 Application directory: $AppDir" -ForegroundColor Yellow

# Check if the app directory exists
if (-not (Test-Path $AppDir)) {
    Write-Host "❌ Application directory not found: $AppDir" -ForegroundColor Red
    Write-Host "Please ensure the win-unpacked folder is in the same directory as this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Change to the app directory
Set-Location $AppDir

# Check if Node.js is available
try {
    $nodeVersion = node --version
    if ($Verbose) {
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install --production
    } catch {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the application
Write-Host "🎮 Starting application..." -ForegroundColor Green
try {
    npm start
} catch {
    Write-Host "❌ Failed to start application" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "👋 Application closed." -ForegroundColor Green
Read-Host "Press Enter to exit"
`;

    const psPath = path.join(this.distBetaPath, 'NW Buddy Scraper Beta.ps1');
    await fs.writeFile(psPath, psContent);

    console.log('✅ Created proper launcher files:');
    console.log(`   📄 Batch file: ${batchPath}`);
    console.log(`   📄 PowerShell: ${psPath}`);
    console.log(`   📄 Node.js launcher: ${launcherPath}`);

    return {
      batchPath,
      psPath,
      launcherPath
    };
  }

  async createInstructions() {
    console.log('📝 Creating usage instructions...');

    const instructions = `# 🎮 How to Run NW Buddy Scraper Beta

## ✅ **Recommended Method: Use the Batch File**

1. **Navigate** to the dist-beta folder
2. **Double-click**: \`NW Buddy Scraper Beta.bat\`
3. **Wait** for the application to start

## 🔧 Alternative Methods

### Option 1: PowerShell Script
1. **Right-click** on \`NW Buddy Scraper Beta.ps1\`
2. **Select**: "Run with PowerShell"
3. **Wait** for the application to start

### Option 2: Command Line
1. **Open** Command Prompt or PowerShell
2. **Navigate** to the dist-beta folder
3. **Run**: \`node launcher.js\`

## 🛠️ Troubleshooting

### If you get "This app can't run on your PC":
- ❌ **Don't use**: The .exe files (they're just wrappers)
- ✅ **Use**: The .bat file instead

### If Node.js is not found:
- Download and install Node.js from https://nodejs.org/
- Restart your command prompt after installation

### If dependencies fail to install:
- Check your internet connection
- Try running as administrator
- Check that you have write permissions to the folder

## 📁 File Structure

\`\`\`
dist-beta/
├── NW Buddy Scraper Beta.bat          ← USE THIS ONE
├── NW Buddy Scraper Beta.ps1          ← Alternative
├── launcher.js                        ← Node.js launcher
├── win-unpacked/                      ← Application files
│   ├── launch.bat
│   ├── electron/
│   ├── src/
│   ├── config/
│   ├── assets/
│   └── node_modules/
└── beta-info.json
\`\`\`

## 🎯 Quick Start

**Just double-click: \`NW Buddy Scraper Beta.bat\`**

That's it! The application will start automatically. 🚀
`;

    const instructionsPath = path.join(this.distBetaPath, 'HOW_TO_RUN.txt');
    await fs.writeFile(instructionsPath, instructions);

    console.log(`✅ Instructions created: ${instructionsPath}`);
  }

  async build() {
    try {
      console.log('🔨 Creating proper executable launchers...');
      
      const launchers = await this.createProperExecutable();
      await this.createInstructions();
      
      console.log('\n✅ Proper launchers created successfully!');
      console.log('\n📋 How to use:');
      console.log('1. Navigate to the dist-beta folder');
      console.log('2. Double-click: NW Buddy Scraper Beta.bat');
      console.log('3. The application will start automatically');
      
      console.log('\n⚠️  Note: The .exe files are just wrappers and won\'t work properly.');
      console.log('   Use the .bat file instead!');
      
      return {
        success: true,
        launchers
      };
      
    } catch (error) {
      console.error('❌ Failed to create proper launchers:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  const builder = new ProperExeBuilder();
  builder.build().then(result => {
    if (result.success) {
      console.log('\n🎉 Proper launchers created successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 Failed to create proper launchers!');
      process.exit(1);
    }
  });
}

module.exports = ProperExeBuilder; 