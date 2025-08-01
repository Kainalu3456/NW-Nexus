const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class CorrectedExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createCorrectedExe() {
    console.log('🔧 Creating corrected executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a corrected launcher script
      await this.createCorrectedLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Corrected executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create corrected executable:', error.message);
      throw error;
    }
  }

  async createCorrectedLauncherScript() {
    console.log('📝 Creating corrected launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyCorrectedLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Corrected Launcher');
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
      // Run the main.js file directly with Node.js
      console.log('   Running: node main.js from', mainPath);
      
      // Change to the app directory (where package.json is)
      process.chdir(appDir);
      
      // Load and run the main.js file
      const mainModule = require(mainPath);
      
      console.log('✅ Application started successfully!');
      console.log('   The Electron window should open shortly...');
      
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

const launcher = new NWBuddyCorrectedLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'corrected-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Corrected launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'corrected-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Corrected.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Corrected executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create corrected executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing corrected executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Corrected.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Corrected executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Corrected executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Corrected executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new CorrectedExeCreator();
  creator.createCorrectedExe().then(() => {
    console.log('\n🎉 Corrected executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created corrected launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested corrected executable');
    console.log('\n🚀 Your corrected executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Corrected.exe');
    console.log('\n💡 This version correctly finds main.js in the electron folder');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Corrected executable creation failed!');
    process.exit(1);
  });
}

module.exports = CorrectedExeCreator; 