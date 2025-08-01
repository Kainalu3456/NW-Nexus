const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class PowerShellTestCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createPowerShellTest() {
    console.log('🔧 Creating PowerShell test script...');
    console.log('='.repeat(50));
    
    try {
      // Create the PowerShell test script
      await this.createPowerShellTestScript();
      
      console.log('\n✅ PowerShell test script created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create PowerShell test script:', error.message);
      throw error;
    }
  }

  async createPowerShellTestScript() {
    console.log('📝 Creating PowerShell test script...');
    
    const psContent = `# PowerShell Test Script for NW Nexus
# This script will help us test if PowerShell works better than batch files

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "🎮 NW Nexus - PowerShell Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Version: 1.0.0-powershell" -ForegroundColor Yellow
Write-Host ""
Write-Host "This PowerShell version will help us test the environment." -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "📁 Script directory: $scriptDir" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 1: Checking current directory contents" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Current directory contents:" -ForegroundColor Cyan
Get-ChildItem -Name | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 2: Checking for Node.js" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Checking for Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to continue..."
        exit 1
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 3: Checking for npm" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Checking for npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm is not available" -ForegroundColor Red
        Write-Host ""
        Write-Host "💡 Try reinstalling Node.js or restarting your computer." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to continue..."
        exit 1
    }
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try reinstalling Node.js or restarting your computer." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 4: Checking for win-unpacked directory" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
$winUnpackedPath = Join-Path $scriptDir "win-unpacked"
Write-Host "🔍 Looking for: $winUnpackedPath" -ForegroundColor Cyan
if (Test-Path $winUnpackedPath) {
    Write-Host "✅ win-unpacked directory found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 win-unpacked contents:" -ForegroundColor Cyan
    Get-ChildItem -Path $winUnpackedPath -Name | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} else {
    Write-Host "❌ win-unpacked directory not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 This launcher needs to be in the same folder as win-unpacked." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue..."
    exit 1
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 5: Testing npm start command" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Testing if we can run npm start..." -ForegroundColor Cyan
Set-Location $winUnpackedPath
Write-Host "📂 Changed to directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 About to test npm start..." -ForegroundColor Yellow
Write-Host "💡 This will show if the app can actually start." -ForegroundColor Yellow
Write-Host ""
$response = Read-Host "Press Enter to test npm start (or type 'no' to cancel)"
if ($response -eq "no") {
    Write-Host "Test cancelled by user." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "🚀 Testing npm start..." -ForegroundColor Green
    try {
        npm start
        $exitCode = $LASTEXITCODE
        Write-Host ""
        Write-Host "============================================================" -ForegroundColor Green
        Write-Host "RESULT: npm start exited with code: $exitCode" -ForegroundColor Yellow
        Write-Host "============================================================" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error running npm start: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "POWERSHELL TEST COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Read-Host "Press Enter to exit..."
`;
    
    const psPath = path.join(this.distBetaPath, 'NW-NEXUS-TEST.ps1');
    await fs.writeFile(psPath, psContent);
    console.log('   ✅ PowerShell test script created:', psPath);
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new PowerShellTestCreator();
  creator.createPowerShellTest().then(() => {
    console.log('\n🎉 PowerShell test script creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created PowerShell test script');
    console.log('\n🚀 Your PowerShell test script is ready!');
    console.log('📁 Launcher: dist-beta/NW-NEXUS-TEST.ps1');
    console.log('\n💡 For Testing:');
    console.log('   1. Right-click NW-NEXUS-TEST.ps1');
    console.log('   2. Select "Run with PowerShell"');
    console.log('   3. Or run: powershell -ExecutionPolicy Bypass -File NW-NEXUS-TEST.ps1');
    console.log('\n🎯 This PowerShell version might work better than batch files!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 PowerShell test script creation failed!');
    process.exit(1);
  });
}

module.exports = PowerShellTestCreator;