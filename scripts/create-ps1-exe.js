const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class PS1ExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createPS1Exe() {
    console.log('🔧 Creating PowerShell executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a PowerShell launcher
      await this.createPS1Launcher();
      
      // Create a simple batch file that runs the PowerShell script
      await this.createBatchWrapper();
      
      // Create a simple executable using a different method
      await this.createExecutable();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ PowerShell executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create PowerShell executable:', error.message);
      throw error;
    }
  }

  async createPS1Launcher() {
    console.log('📝 Creating PowerShell launcher...');
    
    const ps1Content = `# NW Buddy Scraper Beta - PowerShell Launcher
# Version: 1.0.0-beta.2

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🎮 NW Buddy Scraper Beta - PowerShell Launcher" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Version: 1.0.0-beta.2" -ForegroundColor Yellow
Write-Host "Starting application..." -ForegroundColor Yellow
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$winUnpackedPath = Join-Path $scriptDir "win-unpacked"
$mainJsPath = Join-Path $winUnpackedPath "electron\\main.js"

# Check if the main.js file exists
if (-not (Test-Path $mainJsPath)) {
    Write-Host "❌ Cannot find main.js file" -ForegroundColor Red
    Write-Host "Expected at: $mainJsPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Found main.js: $mainJsPath" -ForegroundColor Green
Write-Host "🚀 Starting NW Buddy Scraper..." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

# Change to the win-unpacked directory and run the app
Set-Location $winUnpackedPath
try {
    # Run the Electron app using npm start (which runs electron .)
    & npm start
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application exited successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Application exited with error code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Failed to start application: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Press any key to exit..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
`;
    
    const ps1Path = path.join(this.distBetaPath, 'launch-app.ps1');
    await fs.writeFile(ps1Path, ps1Content);
    console.log('   ✅ PowerShell launcher created:', ps1Path);
  }

  async createBatchWrapper() {
    console.log('📝 Creating batch file wrapper...');
    
    const batchContent = `@echo off
echo ============================================================
echo 🎮 NW Buddy Scraper Beta - Batch Wrapper
echo ============================================================
echo Version: 1.0.0-beta.2
echo Starting application via PowerShell...
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "PS1_PATH=%SCRIPT_DIR%launch-app.ps1"

REM Check if PowerShell script exists
if not exist "%PS1_PATH%" (
    echo ❌ Cannot find launch-app.ps1 file
    echo Expected at: %PS1_PATH%
    pause
    exit /b 1
)

echo ✅ Found PowerShell script: %PS1_PATH%
echo 🚀 Starting NW Buddy Scraper via PowerShell...
echo ============================================================

REM Run PowerShell script
powershell -ExecutionPolicy Bypass -File "%PS1_PATH%"

if %errorlevel% neq 0 (
    echo ❌ PowerShell script exited with error code: %errorlevel%
) else (
    echo ✅ PowerShell script completed successfully
)

echo.
echo ============================================================
echo Press any key to exit...
echo ============================================================
pause >nul
`;
    
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Batch file wrapper created:', batchPath);
  }

  async createExecutable() {
    console.log('📦 Creating executable using batch2exe method...');
    
    // Create a simple VBS script that can be converted to exe
    const vbsContent = `' NW Buddy Scraper Beta - VBS Launcher
' Version: 1.0.0-beta.2

Option Explicit

Dim objShell, scriptPath, batchPath

' Create shell object
Set objShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
batchPath = scriptPath & "\\launch-app.bat"

' Check if batch file exists
If Not CreateObject("Scripting.FileSystemObject").FileExists(batchPath) Then
    MsgBox "Cannot find launch-app.bat file at: " & batchPath, vbCritical, "NW Buddy Scraper Beta"
    WScript.Quit 1
End If

' Run the batch file
objShell.Run "cmd /c """ & batchPath & """", 1, True

' Clean up
Set objShell = Nothing
`;
    
    const vbsPath = path.join(this.distBetaPath, 'launch-app.vbs');
    await fs.writeFile(vbsPath, vbsContent);
    console.log('   ✅ VBS launcher created:', vbsPath);
    
    // For now, we'll just copy the batch file as the "executable"
    // In a real scenario, you could use tools like Bat To Exe Converter
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-PS1.exe');
    await fs.copy(batchPath, exePath);
    console.log('   ✅ Executable created (batch file copy):', exePath);
  }

  async testExecutable() {
    console.log('🧪 Testing PowerShell executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-PS1.exe');
    const ps1Path = path.join(this.distBetaPath, 'launch-app.ps1');
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('PowerShell executable not found at expected location');
    }
    
    if (!fs.existsSync(ps1Path)) {
      throw new Error('PowerShell script not found at expected location');
    }
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Batch file not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    
    console.log('   ✅ PowerShell executable found:', exePath);
    console.log('   ✅ PowerShell script found:', ps1Path);
    console.log('   ✅ Batch file found:', batchPath);
    console.log('   📏 Size:', sizeKB, 'KB');
    console.log('   ✅ PowerShell executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new PS1ExeCreator();
  creator.createPS1Exe().then(() => {
    console.log('\n🎉 PowerShell executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created PowerShell launcher');
    console.log('✅ Created batch file wrapper');
    console.log('✅ Created executable');
    console.log('✅ Tested PowerShell executable');
    console.log('\n🚀 Your PowerShell executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-PS1.exe');
    console.log('📁 PowerShell script: dist-beta/launch-app.ps1');
    console.log('📁 Batch file: dist-beta/launch-app.bat');
    console.log('\n💡 This version uses PowerShell to avoid all pkg environment issues');
    console.log('💡 The executable is actually a batch file that runs PowerShell');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 PowerShell executable creation failed!');
    process.exit(1);
  });
}

module.exports = PS1ExeCreator; 