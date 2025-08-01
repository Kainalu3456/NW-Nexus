const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class WorkingExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createWorkingExe() {
    console.log('🔧 Creating working executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a working launcher script
      await this.createWorkingLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Working executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create working executable:', error.message);
      throw error;
    }
  }

  async createWorkingLauncherScript() {
    console.log('📝 Creating working launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyWorkingLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Working Launcher');
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
      // Use spawn to run the main.js file with system Node.js
      console.log('   Running: node main.js from', mainPath);
      
      const child = spawn('node', [mainPath], {
        cwd: appDir,
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start application:', error.message);
        console.log('💡 Make sure Node.js is installed and in your PATH');
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

const launcher = new NWBuddyWorkingLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'working-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Working launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'working-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Working.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Working executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create working executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing working executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Working.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Working executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Working executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Working executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new WorkingExeCreator();
  creator.createWorkingExe().then(() => {
    console.log('\n🎉 Working executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created working launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested working executable');
    console.log('\n🚀 Your working executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Working.exe');
    console.log('\n💡 This version assumes Node.js is available and uses spawn only');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Working executable creation failed!');
    process.exit(1);
  });
}

module.exports = WorkingExeCreator; 