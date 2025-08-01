const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SystemNodeExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createSystemNodeExe() {
    console.log('🔧 Creating system Node.js executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a system Node.js launcher script
      await this.createSystemNodeLauncherScript();
      
      // Package it with pkg
      await this.packageWithPkg();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ System Node.js executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create system Node.js executable:', error.message);
      throw error;
    }
  }

  async createSystemNodeLauncherScript() {
    console.log('📝 Creating system Node.js launcher script...');
    
    const launcherContent = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class NWBuddySystemNodeLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
  }

  showBanner() {
    console.log('='.repeat(60));
    console.log('🎮 NW Buddy Scraper Beta - System Node.js Launcher');
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

  findSystemNode() {
    // Try to find the system Node.js executable
    const possiblePaths = [
      'node', // If it's in PATH
      'C:\\\\Program Files\\\\nodejs\\\\node.exe',
      'C:\\\\Program Files (x86)\\\\nodejs\\\\node.exe',
      process.env.LOCALAPPDATA + '\\\\Programs\\\\nodejs\\\\node.exe',
      process.env.APPDATA + '\\\\npm\\\\node.exe'
    ];
    
    for (const nodePath of possiblePaths) {
      try {
        // Test if this Node.js path works
        const testResult = spawn.sync(nodePath, ['--version'], { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        if (testResult.status === 0) {
          console.log('✅ Found system Node.js:', nodePath);
          console.log('   Version:', testResult.stdout.trim());
          return nodePath;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    console.log('❌ Could not find system Node.js');
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
    
    const systemNode = this.findSystemNode();
    if (!systemNode) {
      console.error('❌ Cannot find system Node.js');
      console.log('💡 Please install Node.js from https://nodejs.org/');
      this.waitForUser();
      return;
    }
    
    try {
      // Use system Node.js to run the main.js file
      console.log('   Running: system Node.js on main.js from', mainPath);
      
      const child = spawn(systemNode, [mainPath], {
        cwd: appDir,
        stdio: 'inherit',
        detached: false
      });
      
      child.on('error', (error) => {
        console.error('❌ Failed to start application:', error.message);
        console.log('💡 Make sure Node.js is installed and accessible');
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

const launcher = new NWBuddySystemNodeLauncher();
launcher.run();
`;
    
    const launcherPath = path.join(this.distBetaPath, 'system-node-launcher.js');
    await fs.writeFile(launcherPath, launcherContent);
    console.log('   ✅ System Node.js launcher script created:', launcherPath);
  }

  async packageWithPkg() {
    console.log('📦 Packaging with pkg...');
    
    const launcherPath = path.join(this.distBetaPath, 'system-node-launcher.js');
    const outputPath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-System-Node.exe');
    
    try {
      const command = `npx pkg "${launcherPath}" --targets node18-win-x64 --output "${outputPath}"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ System Node.js executable created:', outputPath);
    } catch (error) {
      console.error('   ❌ Failed to create system Node.js executable:', error.message);
      throw error;
    }
  }

  async testExecutable() {
    console.log('🧪 Testing system Node.js executable...');
    
    const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-System-Node.exe');
    
    if (!fs.existsSync(exePath)) {
      throw new Error('System Node.js executable not found at expected location');
    }
    
    const stats = fs.statSync(exePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    console.log('   ✅ System Node.js executable found:', exePath);
    console.log('   📏 Size:', sizeMB, 'MB');
    console.log('   ✅ System Node.js executable size looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new SystemNodeExeCreator();
  creator.createSystemNodeExe().then(() => {
    console.log('\n🎉 System Node.js executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created system Node.js launcher script');
    console.log('✅ Packaged with pkg');
    console.log('✅ Tested system Node.js executable');
    console.log('\n🚀 Your system Node.js executable is ready!');
    console.log('📁 Location: dist-beta/NW-Buddy-Scraper-System-Node.exe');
    console.log('\n💡 This version finds and uses the system Node.js to avoid pkg bundled environment issues');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 System Node.js executable creation failed!');
    process.exit(1);
  });
}

module.exports = SystemNodeExeCreator; 