const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SimpleZipCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.packagedPath = path.join(this.projectRoot, 'out', 'NWBuddyScraper-win32-x64');
    this.zipPath = path.join(this.projectRoot, 'out', 'NW-Buddy-Scraper-Portable.zip');
  }

  async createZip() {
    console.log('🔧 Creating simple ZIP package...');
    
    try {
      // Check if packaged app exists
      if (!fs.existsSync(this.packagedPath)) {
        throw new Error(`Packaged app not found at: ${this.packagedPath}`);
      }

      console.log('📦 Creating ZIP from packaged app...');
      
      // Use 7-Zip if available, otherwise use PowerShell
      try {
        // Try 7-Zip first (more reliable)
        const command = `7z a -tzip "${this.zipPath}" "${this.packagedPath}\\*"`;
        execSync(command, { stdio: 'inherit' });
        console.log('✅ ZIP created with 7-Zip');
      } catch (error) {
        console.log('📦 7-Zip not found, using PowerShell...');
        
        // Use PowerShell as fallback
        const psCommand = `powershell -command "Compress-Archive -Path '${this.packagedPath}\\*' -DestinationPath '${this.zipPath}' -Force"`;
        execSync(psCommand, { stdio: 'inherit' });
        console.log('✅ ZIP created with PowerShell');
      }

      // Get file size
      const stats = fs.statSync(this.zipPath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      
      console.log(`\n🎉 ZIP package created successfully!`);
      console.log(`📁 Location: ${this.zipPath}`);
      console.log(`📏 Size: ${sizeMB}MB`);
      console.log(`\n🚀 Ready for testing!`);
      console.log(`   Extract the ZIP and run NW Buddy Scraper.exe`);
      
    } catch (error) {
      console.error('❌ Failed to create ZIP:', error.message);
      throw error;
    }
  }
}

// Run the ZIP creator if this script is executed directly
if (require.main === module) {
  const creator = new SimpleZipCreator();
  creator.createZip().then(() => {
    console.log('\n🎉 ZIP creation completed!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Failed to create ZIP!');
    process.exit(1);
  });
}

module.exports = SimpleZipCreator; 