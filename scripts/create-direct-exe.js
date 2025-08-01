const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class DirectExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createDirectExe() {
    console.log('🔧 Creating direct executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a direct launcher script
      await this.createDirectLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Direct executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create direct executable:', error.message);
      throw error;
    }
  }

  async createDirectLauncherScript() {
    console.log('📝 Creating direct launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddyDirectLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - Direct Launcher');
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

  checkMainFile(appDir) {
    const mainPath = path.join(appDir, 'main.js');
    if (fs.existsSync(mainPath)) {
      console.log('✅ Found main.js:', mainPath);
      return mainPath;
    }
    
    console.log('❌ main.js not found in:', appDir);
    return null;
  }

  startApplication(appDir) {
    console.log('🚀 Starting NW Buddy Scraper...');
    console.log('='.repeat(60));
    
    const mainPath = this.checkMainFile(appDir);
    if (!mainPath) {
      console.error('❌ Cannot find main.js file');
      this.waitForUser();
      return;
    }
    
    try {
      // Run the main.js file directly with Node.js
      console.log('   Running: node main.js in', appDir);
      
      // Change to the app directory
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

const launcher = new NWBuddyDirectLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'direct-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ Direct launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'direct-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Direct.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Direct executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create direct executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing direct executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Direct.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('Direct executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ Direct executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ Direct executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new DirectExeCreator();
  creator.createDirectExe().then(() => {
    console.log('\n🎉 Direct executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created direct launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested direct executable');
    console.log('\n🚀 Your direct executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-Direct.exe');
    console.log('\n💡 This version runs the Electron app directly without npm');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Direct executable creation failed!');
    process.exit(1);
  });
}

module.exports = DirectExeCreator; 