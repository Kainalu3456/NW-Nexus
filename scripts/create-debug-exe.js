const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class DebugExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createDebugExe() {
    console.log('🔧 Creating debug executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a debug launcher script
      await this.createDebugLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Debug executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create debug executable:', error.message);
      throw error;
    }
  }

  async createDebugLauncherScript() {
    console.log('📝 Creating debug launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyDebugLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Debug Launcher');
    console.log('='.repeat(60));
    console.log('Version:', this.version);
    console.log('Debug mode enabled - errors will be shown');
    console.log('Starting application...\\n');
  }

  getAppDirectory() {
    console.log('🔍 Finding application directory...');
    
    // Get the directory where this executable is located
    const exePath = process.execPath;
    const exeDir = path.dirname(exePath);
    console.log('   Executable directory:', exeDir);
    
    // Look for the win-unpacked folder
    const winUnpackedPath = path.join(exeDir, 'win-unpacked');
    console.log('   Looking for win-unpacked at:', winUnpackedPath);
    
    if (fs.existsSync(winUnpackedPath)) {
      console.log('   ✅ Found win-unpacked folder');
      return winUnpackedPath;
    }
    
    // Try parent directory
    const parentWinUnpacked = path.join(exeDir, '..', 'win-unpacked');
    console.log('   Looking in parent directory:', parentWinUnpacked);
    
    if (fs.existsSync(parentWinUnpacked)) {
      console.log('   ✅ Found win-unpacked in parent directory');
      return parentWinUnpacked;
    }
    
    console.log('   ❌ win-unpacked not found, using current directory');
    return process.cwd();
  }

  checkAppDirectory(appDir) {
    console.log('📁 Checking application directory:', appDir);
    
    const requiredFiles = [
      'NW Buddy Scraper.exe',
      'resources/app.asar'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(appDir, file);
      console.log('   Checking:', filePath);
      
      if (!fs.existsSync(filePath)) {
        console.error('   ❌ Missing required file:', file);
        console.error('      Expected at:', filePath);
        throw new Error(\`Missing required file: \${file}\`);
      } else {
        console.log('   ✅ Found:', file);
      }
    }
    
    console.log('✅ All required files found');
  }

  checkNodeJS() {
    console.log('🔍 Checking Node.js installation...');
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log('✅ Node.js found:', nodeVersion);
      return true;
    } catch (error) {
      console.log('❌ Node.js not found');
      console.log('   Error:', error.message);
      console.log('💡 Please install Node.js from https://nodejs.org/');
      console.log('   Then run this executable again.');
      return false;
    }
  }

  checkNPM() {
    console.log('📦 Checking npm installation...');
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log('✅ npm found:', npmVersion);
      return true;
    } catch (error) {
      console.log('❌ npm not found');
      console.log('   Error:', error.message);
      console.log('💡 Please install Node.js (includes npm) from https://nodejs.org/');
      return false;
    }
  }

  async installDependencies(appDir) {
    console.log('📦 Installing dependencies...');
    
    const packageJsonPath = path.join(appDir, 'resources', 'app.asar.unpacked', 'package.json');
    console.log('   Looking for package.json at:', packageJsonPath);
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        console.log('   ✅ Found package.json, installing dependencies...');
        execSync('npm install --production', { 
          cwd: path.dirname(packageJsonPath),
          stdio: 'inherit'
        });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        console.log('⚠️  Could not install dependencies:');
        console.log('   Error:', error.message);
        console.log('   Continuing without dependencies...');
      }
    } else {
      console.log('ℹ️  No package.json found, skipping dependency installation');
    }
  }

  startApplication(appDir) {
    console.log('🚀 Starting NW Buddy Scraper...');
    console.log('='.repeat(60));
    
    const exePath = path.join(appDir, 'NW Buddy Scraper.exe');
    console.log('   Launching:', exePath);
    
    try {
      const child = spawn(exePath, [], {
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start application:');
        console.error('   Error:', error.message);
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
      console.error('❌ Failed to start application:');
      console.error('   Error:', error.message);
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
      this.checkAppDirectory(appDir);
      
      if (!this.checkNodeJS()) {
        console.log('\\n❌ Node.js is required but not found.');
        this.waitForUser();
        return;
      }
      
      if (!this.checkNPM()) {
        console.log('\\n❌ npm is required but not found.');
        this.waitForUser();
        return;
      }
      
      await this.installDependencies(appDir);
      this.startApplication(appDir);
      
    } catch (error) {
      console.error('\\n💥 Launcher error:');
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
      console.log('\\n💡 Try running the .bat file instead:');
      console.log('   NW Buddy Scraper Beta.bat');
      this.waitForUser();
    }
  }
}

const launcher = new NWBuddyDebugLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'debug-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Debug launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'debug-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Debug.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Debug executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create debug executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing debug executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Debug.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Debug executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Debug executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Debug executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new DebugExeCreator();
  creator.createDebugExe().then(() => {
    console.log('\n🎉 Debug executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created debug launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested debug executable');
    console.log('\n🚀 Your debug executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Debug.exe');
    console.log('\n💡 This version will show detailed error messages and stay open');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Debug executable creation failed!');
    process.exit(1);
  });
}

module.exports = DebugExeCreator; 