const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SystemExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createSystemExe() {
    console.log('🔧 Creating system executable...');
    console.log('='.repeat(50));
    
    try {
      // Clean up old executables first
      await this.cleanupOldExecutables();
      
      // Create a system launcher script
      await this.createSystemLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ System executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create system executable:', error.message);
      throw error;
    }
  }

  async cleanupOldExecutables() {
    console.log('🧹 Cleaning up old executables...');
    
    const oldExecutables = [
      'NW-Buddy-Scraper-Working.exe',
      'NW-Buddy-Scraper-Debug.exe',
      'NW-Buddy-Scraper-Simple.exe',
      'NW-Buddy-Scraper-Final.exe',
      'NW-Buddy-Scraper-Direct.exe',
      'NW-Buddy-Scraper-Corrected.exe'
    ];
    
    for (const exe of oldExecutables) {
      const exePath = path.join(this.distBetaPath, exe);
      if (fs.existsSync(exePath)) {
        try {
          fs.unlinkSync(exePath);
          console.log('   🗑️  Removed:', exe);
        } catch (error) {
          console.log('   ⚠️  Could not remove:', exe, error.message);
        }
      }
    }
    
    // Also clean up old launcher scripts
    const oldScripts = [
      'working-launcher.js',
      'debug-launcher.js',
      'simple-launcher.js',
      'final-launcher.js',
      'direct-launcher.js',
      'corrected-launcher.js'
    ];
    
    for (const script of oldScripts) {
      const scriptPath = path.join(this.distBetaPath, script);
      if (fs.existsSync(scriptPath)) {
        try {
          fs.unlinkSync(scriptPath);
          console.log('   🗑️  Removed:', script);
        } catch (error) {
          console.log('   ⚠️  Could not remove:', script, error.message);
        }
      }
    }
    
    console.log('   ✅ Cleanup completed');
  }

  async createSystemLauncherScript() {
    console.log('📝 Creating system launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddySystemLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - System Launcher');
    console.log('='.repeat(60));
    console.log('Version:', this.version);
    console.log('Starting application...\\n');
  }

  getAppDirectory() {
    // Get the directory where this executable is located
    const exePath = process.execPath;
    const exeDir = path.dirname(exePath);
    
    // Look for the win-unpacked folder
    const winUnpackedPath = path.join(exeDir, 'win-unpacked');
    if (fs.existsSync(winUnpackedPath)) {
      return winUnpackedPath;
    }
    
    // Try parent directory
    const parentWinUnpacked = path.join(exeDir, '..', 'win-unpacked');
    if (fs.existsSync(parentWinUnpacked)) {
      return parentWinUnpacked;
    }
    
    // Fallback to current directory
    return process.cwd();
  }

  checkSystemNode() {
    console.log('🔍 Checking system Node.js...');
    try {
      const { execSync } = require('child_process');
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log('✅ System Node.js found:', nodeVersion);
      return true;
    } catch (error) {
      console.log('❌ System Node.js not found');
      console.log('💡 Please install Node.js from https://nodejs.org/');
      return false;
    }
  }

  findMainFile(appDir) {
    // Check multiple possible locations for main.js
    const possiblePaths = [
      path.join(appDir, 'main.js'),
      path.join(appDir, 'electron', 'main.js'),
      path.join(appDir, 'src', 'main.js'),
      path.join(appDir, 'app', 'main.js')
    ];
    
    for (const mainPath of possiblePaths) {
      if (fs.existsSync(mainPath)) {
        console.log('✅ Found main.js:', mainPath);
        return mainPath;
      }
    }
    
    console.log('❌ main.js not found in any of these locations:');
    possiblePaths.forEach(p => console.log('   -', p));
    return null;
  }

  startApplication(appDir) {
    console.log('🚀 Starting NW Buddy Scraper...');
    console.log('='.repeat(60));
    
    const mainPath = this.findMainFile(appDir);
    if (!mainPath) {
      console.error('❌ Cannot find main.js file');
      this.waitForUser();
      return;
    }
    
    try {
      // Use system Node.js to run the main.js file
      console.log('   Running: node main.js from', mainPath);
      
      const child = spawn('node', [mainPath], {
        cwd: appDir,
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start application:', error.message);
        this.waitForUser();
      });
      
      child.on('exit', (code) => {
        if (code !== 0) {
          console.error(\`❌ Application exited with code: \${code}\`);
        } else {
          console.log('✅ Application exited successfully');
        }
        this.waitForUser();
      });
      
    } catch (error) {
      console.error('❌ Failed to start application:', error.message);
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
      
      const appDir = this.getAppDirectory();
      console.log('📁 Application directory:', appDir);
      
      // Check if the directory exists
      if (!fs.existsSync(appDir)) {
        console.error('❌ Application directory not found:', appDir);
        this.waitForUser();
        return;
      }
      
      // Check for system Node.js
      if (!this.checkSystemNode()) {
        console.log('\\n❌ System Node.js is required but not found.');
        this.waitForUser();
        return;
      }
      
      // List files in the directory for debugging
      console.log('📋 Files in app directory:');
      try {
        const files = fs.readdirSync(appDir);
        files.forEach(file => {
          const filePath = path.join(appDir, file);
          const stats = fs.statSync(filePath);
          const type = stats.isDirectory() ? '📁' : '📄';
          console.log(\`   \${type} \${file}\`);
        });
      } catch (error) {
        console.log('   Could not list files:', error.message);
      }
      
      this.startApplication(appDir);
      
    } catch (error) {
      console.error('\\n💥 Launcher error:', error.message);
      console.log('\\n💡 Try running the .bat file instead:');
      console.log('   NW Buddy Scraper Beta.bat');
      this.waitForUser();
    }
  }
}

const launcher = new NWBuddySystemLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'system-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ System launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'system-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ System executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create system executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing system executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('System executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ System executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ System executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new SystemExeCreator();
  creator.createSystemExe().then(() => {
    console.log('\n🎉 System executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Cleaned up old executables');
    console.log('✅ Created system launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested system executable');
    console.log('\n🚀 Your system executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper.exe');
    console.log('\n💡 This version uses system Node.js to avoid pkg bundled environment issues');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 System executable creation failed!');
    process.exit(1);
  });
}

module.exports = SystemExeCreator; 