const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SimplePowerShellTestCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createSimplePowerShellTest() {
    console.log('🔧 Creating simple PowerShell test script...');
    console.log('='.repeat(50));
    
    try {
      // Create the simple PowerShell test script
      await this.createSimplePowerShellTestScript();
      
      console.log('\n✅ Simple PowerShell test script created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create simple PowerShell test script:', error.message);
      throw error;
    }
  }

  async createSimplePowerShellTestScript() {
    console.log('📝 Creating simple PowerShell test script...');
    
    const psContent = `# Simple PowerShell Test Script
# This will help us see what's wrong with the complex scripts

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "🎮 NW Nexus - Simple PowerShell Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "📁 Script directory: $scriptDir" -ForegroundColor Cyan
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 1: Basic PowerShell test" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ PowerShell is working!" -ForegroundColor Green
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 2: Directory contents" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Current directory contents:" -ForegroundColor Cyan
try {
    Get-ChildItem -Name | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} catch {
    Write-Host "❌ Error listing directory: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 3: Node.js test" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Testing Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking Node.js: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 4: npm test" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 Testing npm..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✅ npm found: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ npm not found" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking npm: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 5: win-unpacked test" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
$winUnpackedPath = Join-Path $scriptDir "win-unpacked"
Write-Host "🔍 Looking for: $winUnpackedPath" -ForegroundColor Cyan
try {
    if (Test-Path $winUnpackedPath) {
        Write-Host "✅ win-unpacked directory found!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📁 win-unpacked contents:" -ForegroundColor Cyan
        Get-ChildItem -Path $winUnpackedPath -Name | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    } else {
        Write-Host "❌ win-unpacked directory not found!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking win-unpacked: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 6: package.json test" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
$packageJsonPath = Join-Path $winUnpackedPath "package.json"
Write-Host "🔍 Looking for: $packageJsonPath" -ForegroundColor Cyan
try {
    if (Test-Path $packageJsonPath) {
        Write-Host "✅ package.json found!" -ForegroundColor Green
    } else {
        Write-Host "❌ package.json not found!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error checking package.json: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "============================================================" -ForegroundColor Green
Write-Host "STEP 7: npm start test (optional)" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Do you want to test npm start?" -ForegroundColor Yellow
Write-Host "   This will try to actually start the application." -ForegroundColor White
Write-Host ""
$response = Read-Host "Type 'yes' to test npm start, or press Enter to skip"
if ($response -eq "yes") {
    Write-Host ""
    Write-Host "🚀 Testing npm start..." -ForegroundColor Green
    try {
        Set-Location $winUnpackedPath
        Write-Host "📂 Changed to: $(Get-Location)" -ForegroundColor Cyan
        Write-Host ""
        npm start
        $exitCode = $LASTEXITCODE
        Write-Host ""
        Write-Host "✅ npm start completed with exit code: $exitCode" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error running npm start: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⏭️  Skipping npm start test" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "SIMPLE POWERSHELL TEST COMPLETE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor White
Read-Host
`;
    
    const psPath = path.join(this.distBetaPath, 'SIMPLE-POWERSHELL-TEST.ps1');
    await fs.writeFile(psPath, psContent);
    console.log('   ✅ Simple PowerShell test script created:', psPath);
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new SimplePowerShellTestCreator();
  creator.createSimplePowerShellTest().then(() => {
    console.log('\n🎉 Simple PowerShell test script creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created simple PowerShell test script');
    console.log('\n🚀 Your simple PowerShell test script is ready!');
    console.log('📁 Launcher: dist-beta/SIMPLE-POWERSHELL-TEST.ps1');
    console.log('\n💡 For Testing:');
    console.log('   1. Right-click SIMPLE-POWERSHELL-TEST.ps1');
    console.log('   2. Select "Run with PowerShell"');
    console.log('   3. This version will stay open even with errors');
    console.log('\n🎯 This will show us exactly what\'s wrong!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Simple PowerShell test script creation failed!');
    process.exit(1);
  });
}

module.exports = SimplePowerShellTestCreator;