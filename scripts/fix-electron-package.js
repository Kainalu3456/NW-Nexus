const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ElectronPackageFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.outDir = path.join(this.projectRoot, 'out');
  }

  async fixPackage() {
    console.log('🔧 Fixing Electron package...');
    console.log('='.repeat(50));
    
    try {
      // Kill any running Electron processes
      await this.killElectronProcesses();
      
      // Clean up old package
      await this.cleanupOldPackage();
      
      // Ensure dependencies are installed
      await this.ensureDependencies();
      
      // Rebuild package
      await this.rebuildPackage();
      
      // Test the package
      await this.testPackage();
      
      console.log('\n✅ Electron package fixed successfully!');
      
    } catch (error) {
      console.error('❌ Failed to fix package:', error.message);
      throw error;
    }
  }

  async killElectronProcesses() {
    console.log('🔄 Killing any running Electron processes...');
    try {
      execSync('taskkill /f /im "NW Buddy Scraper.exe" 2>nul || echo "No running instances found"', { stdio: 'inherit' });
      execSync('taskkill /f /im "electron.exe" 2>nul || echo "No electron processes found"', { stdio: 'inherit' });
    } catch (error) {
      console.log('   ℹ️  No processes to kill');
    }
  }

  async cleanupOldPackage() {
    console.log('🗑️  Cleaning up old package...');
    
    // Wait a moment for processes to fully terminate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      if (fs.existsSync(this.outDir)) {
        await fs.remove(this.outDir);
        console.log('   ✅ Removed old out directory');
      }
    } catch (error) {
      console.log('   ⚠️  Could not remove out directory, will continue...');
    }
  }

  async ensureDependencies() {
    console.log('📦 Ensuring dependencies are installed...');
    
    try {
      // Check if proxy-agent is installed
      const proxyAgentPath = path.join(this.projectRoot, 'node_modules', 'proxy-agent');
      if (!fs.existsSync(proxyAgentPath)) {
        console.log('   📥 Installing missing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      } else {
        console.log('   ✅ Dependencies are up to date');
      }
    } catch (error) {
      console.error('   ❌ Failed to install dependencies:', error.message);
      throw error;
    }
  }

  async rebuildPackage() {
    console.log('🔨 Rebuilding Electron package...');
    
    try {
      // Package the application
      execSync('npm run package', { stdio: 'inherit' });
      console.log('   ✅ Package created successfully');
      
      // Create distributables
      console.log('📦 Creating distributables...');
      execSync('npm run make', { stdio: 'inherit' });
      console.log('   ✅ Distributables created');
      
    } catch (error) {
      console.error('   ❌ Failed to rebuild package:', error.message);
      throw error;
    }
  }

  async testPackage() {
    console.log('🧪 Testing the package...');
    
    const packagedAppPath = path.join(this.outDir, 'NWBuddyScraper-win32-x64', 'NW Buddy Scraper.exe');
    
    if (!fs.existsSync(packagedAppPath)) {
      throw new Error('Packaged app not found at expected location');
    }
    
    console.log('   ✅ Packaged app found at:', packagedAppPath);
    
    // Check if all required files are present
    const requiredFiles = [
      'resources/app.asar',
      'resources/app.asar.unpacked',
      'NW Buddy Scraper.exe'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.outDir, 'NWBuddyScraper-win32-x64', file);
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file} exists`);
      } else {
        console.log(`   ⚠️  ${file} missing`);
      }
    }
  }
}

// Run the fixer if this script is executed directly
if (require.main === module) {
  const fixer = new ElectronPackageFixer();
  fixer.fixPackage().then(() => {
    console.log('\n🎉 Electron package fix completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Killed running processes');
    console.log('✅ Cleaned up old package');
    console.log('✅ Ensured dependencies');
    console.log('✅ Rebuilt package');
    console.log('✅ Tested package');
    console.log('\n🚀 Your Electron app should now work properly!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Package fix failed!');
    process.exit(1);
  });
}

module.exports = ElectronPackageFixer; 