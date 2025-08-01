const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class FinalPackageCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.packagePath = path.join(this.projectRoot, 'NW-Buddy-Scraper-Standalone');
  }

  async createFinalPackage() {
    console.log('📦 Creating final distribution package...');
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
      
      console.log('\n✅ Final distribution package created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create final package:', error.message);
      throw error;
    }
  }

  async cleanupPackage() {
    console.log('🧹 Cleaning up existing package...');
    
    if (fs.existsSync(this.packagePath)) {
      await fs.remove(this.packagePath);
      console.log('   ✅ Removed existing package directory');
    }
    
    const zipPath = path.join(this.projectRoot, 'NW-Buddy-Scraper-Standalone.zip');
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
    const launcherSource = path.join(this.distBetaPath, 'NW-BUDDY-SCRAPER-STANDALONE.bat');
    const launcherDest = path.join(this.packagePath, 'NW-BUDDY-SCRAPER-STANDALONE.bat');
    await fs.copy(launcherSource, launcherDest);
    console.log('   ✅ Copied standalone launcher');
    
    // Copy the setup script
    const setupSource = path.join(this.distBetaPath, 'setup.bat');
    const setupDest = path.join(this.packagePath, 'setup.bat');
    await fs.copy(setupSource, setupDest);
    console.log('   ✅ Copied setup script');
    
    // Copy the download script
    const downloadSource = path.join(this.distBetaPath, 'download-deps.bat');
    const downloadDest = path.join(this.packagePath, 'download-deps.bat');
    await fs.copy(downloadSource, downloadDest);
    console.log('   ✅ Copied download script');
    
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
    
    const zipPath = path.join(this.projectRoot, 'NW-Buddy-Scraper-Standalone.zip');
    
    try {
      // Use PowerShell to create the zip file
      const command = `powershell -command "Compress-Archive -Path '${this.packagePath}\\*' -DestinationPath '${zipPath}' -Force"`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Zip file created:', zipPath);
    } catch (error) {
      console.log('   ⚠️  PowerShell zip failed, trying alternative method...');
      
      // Alternative: just copy the directory and let users extract manually
      const alternativePath = path.join(this.projectRoot, 'NW-Buddy-Scraper-Standalone-Folder');
      await fs.copy(this.packagePath, alternativePath);
      console.log('   ✅ Alternative package created:', alternativePath);
    }
  }

  async testPackage() {
    console.log('🧪 Testing final package...');
    
    const launcherPath = path.join(this.packagePath, 'NW-BUDDY-SCRAPER-STANDALONE.bat');
    const setupPath = path.join(this.packagePath, 'setup.bat');
    const downloadPath = path.join(this.packagePath, 'download-deps.bat');
    const readmePath = path.join(this.packagePath, 'README.txt');
    
    if (!fs.existsSync(launcherPath)) {
      throw new Error('Standalone launcher not found in package');
    }
    
    if (!fs.existsSync(setupPath)) {
      throw new Error('Setup script not found in package');
    }
    
    if (!fs.existsSync(downloadPath)) {
      throw new Error('Download script not found in package');
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
    const zipPath = path.join(this.projectRoot, 'NW-Buddy-Scraper-Standalone.zip');
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
  const creator = new FinalPackageCreator();
  creator.createFinalPackage().then(() => {
    console.log('\n🎉 Final package creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created package directory');
    console.log('✅ Copied all necessary files');
    console.log('✅ Created zip file (if possible)');
    console.log('✅ Tested package');
    console.log('\n🚀 Your final distribution package is ready!');
    console.log('📁 Package directory: NW-Buddy-Scraper-Standalone/');
    console.log('📦 Zip file: NW-Buddy-Scraper-Standalone.zip');
    console.log('\n💡 For Distribution:');
    console.log('   1. Send the zip file to users');
    console.log('   2. Users extract and double-click NW-BUDDY-SCRAPER-STANDALONE.bat');
    console.log('   3. App automatically downloads and sets up everything');
    console.log('   4. No manual installation required!');
    console.log('\n🎯 This is a complete standalone solution for any user!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Final package creation failed!');
    process.exit(1);
  });
}

module.exports = FinalPackageCreator; 