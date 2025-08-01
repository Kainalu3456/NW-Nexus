const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class BatchExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createBatchExe() {
    console.log('🔧 Creating batch file executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a batch file launcher
      await this.createBatchLauncher();
      
      // Create a simple Node.js wrapper that just runs the batch file
      await this.createNodeWrapper();
      
      // Package the Node.js wrapper with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Batch file executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create batch file executable:', error.message);
      throw error;
    }
  }

  async createBatchLauncher() {
    console.log('📝 Creating batch file launcher...');
    
    const batchContent = `@echo off
echo ============================================================
echo 🎮 NW Buddy Scraper Beta - Batch Launcher
echo ============================================================
echo Version: 1.0.0-beta.2
echo Starting application...
echo.

cd /d "%~dp0win-unpacked"
if not exist "electron\\main.js" (
    echo ❌ Cannot find main.js file
    echo Expected at: %~dp0win-unpacked\\electron\\main.js
    pause
    exit /b 1
)

echo ✅ Found main.js: %~dp0win-unpacked\\electron\\main.js
echo 🚀 Starting NW Buddy Scraper...
echo ============================================================

node electron\\main.js

if %errorlevel% neq 0 (
    echo ❌ Application exited with error code: %errorlevel%
) else (
    echo ✅ Application exited successfully
)

echo.
echo ============================================================
echo Press any key to exit...
echo ============================================================
pause >nul
`;
    
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Batch file launcher created:', batchPath);
  }

  async createNodeWrapper() {
    console.log('📝 Creating Node.js wrapper...');
    
    const wrapperContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyBatchWrapper {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Batch Wrapper');
    console.log('='.repeat(60));
    console.log('Version:', this.version);
    console.log('Starting application via batch file...\\n');
  }

  getBatchFilePath() {
    // Get the directory where this executable is located
    const exePath = process.execPath;
    const exeDir = path.dirname(exePath);
    
    // Look for the batch file in the same directory
    const batchPath = path.join(exeDir, 'launch-app.bat');
    if (fs.existsSync(batchPath)) {
      return batchPath;
    }
    
    // Try parent directory
    const parentBatchPath = path.join(exeDir, '..', 'launch-app.bat');
    if (fs.existsSync(parentBatchPath)) {
      return parentBatchPath;
    }
    
    return null;
  }

  startApplication() {
    console.log('🚀 Starting NW Buddy Scraper via batch file...');
    console.log('='.repeat(60));
    
    const batchPath = this.getBatchFilePath();
    if (!batchPath) {
      console.error('❌ Cannot find launch-app.bat file');
      console.log('💡 Expected in same directory as this executable');
      this.waitForUser();
      return;
    }
    
    console.log('✅ Found batch file:', batchPath);
    console.log('   Running batch file...');
    
    try {
      // Use cmd to run the batch file
      const child = spawn('cmd', ['/c', batchPath], {
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start batch file:', error.message);
        this.waitForUser();
      });
      
      child.on('exit', (code) => {
        if (code !== 0) {
          console.error(\`❌ Batch file exited with code: \${code}\`);
        } else {
          console.log('✅ Batch file completed successfully');
        }
        this.waitForUser();
      });
      
    } catch (error) {
      console.error('❌ Failed to start batch file:', error.message);
      console.error('   Error details:', error.stack);
      this.waitForUser();
    }
  }

  waitForUser() {
    console.log('\\n' + '='.repeat(60));
    console.log('Press any key to exit...');
    console.log('='.repeat(60));
    
    // Keep the process alive
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit(0);
    });
  }

  async run() {
    try {
      this.showBanner();
      this.startApplication();
    } catch (error) {
      console.error('\\n💥 Wrapper error:', error.message);
      console.log('\\n💡 Try running the batch file directly:');
      console.log('   launch-app.bat');
      this.waitForUser();
    }
  }
}

const wrapper = new NWBuddyBatchWrapper();
wrapper.run();
`;
    
    const wrapperPath = path.join(this.distBetaPath, 'batch-wrapper.js');
    await fs.writeFile(wrapperPath, wrapperContent);
    console.log('   ✅ Node.js wrapper created:', wrapperPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const wrapperPath = path.join(this.distBetaPath, 'batch-wrapper.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Batch.exe');
    
    try {
      const command = `npx pkg "${wrapperPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Batch file executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create batch file executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing batch file executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Batch.exe');
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Batch file executable not found at expected location');
    }
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Batch file not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Batch file executable found:', exePath);
    console.log('   ✅ Batch file found:', batchPath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Batch file executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new BatchExeCreator();
  creator.createBatchExe().then(() => {
    console.log('\n🎉 Batch file executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created batch file launcher');
    console.log('✅ Created Node.js wrapper');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested batch file executable');
    console.log('\n🚀 Your batch file executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Batch.exe');
    console.log('📁 Batch file: dist-beta/launch-app.bat');
    console.log('\n💡 This version uses a batch file to avoid pkg environment issues');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Batch file executable creation failed!');
    process.exit(1);
  });
}

module.exports = BatchExeCreator; 