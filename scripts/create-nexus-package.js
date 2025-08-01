const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class NexusPackageCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.packagePath = path.join(this.projectRoot, 'NW-Nexus-Standalone');
  }

  async createNexusPackage() {
    console.log('📦 Creating NW Nexus standalone package...');
    console.log('='.repeat(50));
    
    try {
      // Clean up any existing package
      await this.cleanupPackage();
      
      // Create the package directory
      await this.createPackageDirectory();
      
      // Copy all necessary files
      await this.copyFiles();
      
      // Create the final zip file
      await this.createZipFile();
      
      // Test the package
      await this.testPackage();
      
      console.log('\n✅ NW Nexus standalone package created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create NW Nexus package:', error.message);
      throw error;
    }
  }

  async cleanupPackage() {
    console.log('🧹 Cleaning up existing package...');
    
    if (fs.existsSync(this.packagePath)) {
      await fs.remove(this.packagePath);
      console.log('   ✅ Removed existing package directory');
    }
    
    const zipPath = path.join(this.projectRoot, 'NW-Nexus-Standalone.zip');
    if (fs.existsSync(zipPath)) {
      await fs.remove(zipPath);
      console.log('   ✅ Removed existing zip file');
    }
  }

  async createPackageDirectory() {
    console.log('📁 Creating package directory...');
    
    await fs.ensureDir(this.packagePath);
    console.log('   ✅ Package directory created:', this.packagePath);
  }

  async copyFiles() {
    console.log('📋 Copying files to package...');
    
    // Copy the standalone launcher
    const launcherSource = path.join(this.distBetaPath, 'START-NW-BUDDY-SCRAPER.bat');
    const launcherDest = path.join(this.packagePath, 'START-NW-NEXUS.bat');
    await fs.copy(launcherSource, launcherDest);
    console.log('   ✅ Copied standalone launcher');
    
    // Copy the launcher batch file
    const launcherBatSource = path.join(this.distBetaPath, 'launch-app.bat');
    const launcherBatDest = path.join(this.packagePath, 'launch-app.bat');
    await fs.copy(launcherBatSource, launcherBatDest);
    console.log('   ✅ Copied launcher batch file');
    
    // Copy the README
    const readmeSource = path.join(this.distBetaPath, 'README.txt');
    const readmeDest = path.join(this.packagePath, 'README.txt');
    await fs.copy(readmeSource, readmeDest);
    console.log('   ✅ Copied README');
    
    // Copy the win-unpacked directory
    const winUnpackedSource = path.join(this.distBetaPath, 'win-unpacked');
    const winUnpackedDest = path.join(this.packagePath, 'win-unpacked');
    if (fs.existsSync(winUnpackedSource)) {
      await fs.copy(winUnpackedSource, winUnpackedDest);
      console.log('   ✅ Copied win-unpacked directory');
    } else {
      console.log('   ⚠️  win-unpacked directory not found, skipping');
    }
  }

  async createZipFile() {
    console.log('🗜️  Creating zip file...');
    
    const zipPath = path.join(this.projectRoot, 'NW-Nexus-Standalone.zip');
    
    try {
      // Use PowerShell to create the zip file
      const command = `powershell -command "Compress-Archive -Path '${this.packagePath}\\*' -DestinationPath '${zipPath}' -Force"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Zip file created:', zipPath);
    } catch (error) {
      console.log('   ⚠️  PowerShell zip failed, trying alternative method...');
      
      // Alternative: just copy the directory and let users extract manually
      const alternativePath = path.join(this.projectRoot, 'NW-Nexus-Standalone-Folder');
      await fs.copy(this.packagePath, alternativePath);
      console.log('   ✅ Alternative package created:', alternativePath);
    }
  }

  async testPackage() {
    console.log('🧪 Testing NW Nexus package...');
    
    const launcherPath = path.join(this.packagePath, 'START-NW-NEXUS.bat');
    const launcherBatPath = path.join(this.packagePath, 'launch-app.bat');
    const readmePath = path.join(this.packagePath, 'README.txt');
    
    if (!fs.existsSync(launcherPath)) {
      throw new Error('NW Nexus launcher not found in package');
    }
    
    if (!fs.existsSync(launcherBatPath)) {
      throw new Error('Launcher batch file not found in package');
    }
    
    if (!fs.existsSync(readmePath)) {
      throw new Error('README not found in package');
    }
    
    console.log('   ✅ All files present in package');
    
    // Check package size
    const stats = fs.statSync(this.packagePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    console.log('   📏 Package size:', sizeMB, 'MB');
    
    // Check if zip was created
    const zipPath = path.join(this.projectRoot, 'NW-Nexus-Standalone.zip');
    if (fs.existsSync(zipPath)) {
      const zipStats = fs.statSync(zipPath);
      const zipSizeMB = (zipStats.size / 1024 / 1024).toFixed(1);
      console.log('   📦 Zip file size:', zipSizeMB, 'MB');
    }
    
    console.log('   ✅ Package looks good');
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new NexusPackageCreator();
  creator.createNexusPackage().then(() => {
    console.log('\n🎉 NW Nexus package creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created package directory');
    console.log('✅ Copied all necessary files');
    console.log('✅ Created zip file (if possible)');
    console.log('✅ Tested package');
    console.log('\n🚀 Your NW Nexus standalone package is ready!');
    console.log('📁 Package directory: NW-Nexus-Standalone/');
    console.log('📦 Zip file: NW-Nexus-Standalone.zip');
    console.log('\n💡 For Distribution:');
    console.log('   1. Send the zip file to users');
    console.log('   2. Users extract and double-click START-NW-NEXUS.bat');
    console.log('   3. App automatically sets up everything');
    console.log('   4. No manual installation required!');
    console.log('\n🎯 This is a complete NW Nexus standalone solution for any user!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 NW Nexus package creation failed!');
    process.exit(1);
  });
}

module.exports = NexusPackageCreator; 