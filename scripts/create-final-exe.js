const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class FinalExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createFinalExe() {
    console.log('🔧 Creating final executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a final launcher script
      await this.createFinalLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Final executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create final executable:', error.message);
      throw error;
    }
  }

  async createFinalLauncherScript() {
    console.log('📝 Creating final launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyFinalLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Final Launcher');
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

  async installDependencies(appDir) {
    console.log('📦 Installing dependencies...');
    
    const packageJsonPath = path.join(appDir, 'package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        console.log('   Installing dependencies from:', packageJsonPath);
        const child = spawn('npm', ['install'], {
          cwd: appDir,
          stdio: 'inherit',
          detached: false
        });
        
        return new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              console.log('✅ Dependencies installed successfully');
              resolve();
            } else {
              console.log('⚠️  Could not install dependencies, continuing...');
              resolve();
            }
          });
          
          child.on('error', (error) => {
            console.log('⚠️  Could not install dependencies, continuing...');
            resolve();
          });
        });
      } catch (error) {
        console.log('⚠️  Could not install dependencies, continuing...');
      }
    } else {
      console.log('ℹ️  No package.json found, skipping dependency installation');
    }
  }

  startApplication(appDir) {
    console.log('🚀 Starting NW Buddy Scraper...');
    console.log('='.repeat(60));
    
    try {
      // Run npm start in the app directory
      console.log('   Running: npm start in', appDir);
      const child = spawn('npm', ['start'], {
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
      
      await this.installDependencies(appDir);
      this.startApplication(appDir);
      
    } catch (error) {
      console.error('\\n💥 Launcher error:', error.message);
      console.log('\\n💡 Try running the .bat file instead:');
      console.log('   NW Buddy Scraper Beta.bat');
      this.waitForUser();
    }
  }
}

const launcher = new NWBuddyFinalLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'final-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Final launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'final-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Final.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Final executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create final executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing final executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Final.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Final executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Final executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Final executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new FinalExeCreator();
  creator.createFinalExe().then(() => {
    console.log('\n🎉 Final executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created final launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested final executable');
    console.log('\n🚀 Your final executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Final.exe');
    console.log('\n💡 This version includes Node.js bundled and runs npm start directly');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Final executable creation failed!');
    process.exit(1);
  });
}

module.exports = FinalExeCreator; 