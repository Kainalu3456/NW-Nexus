const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class WorkingBetaCopier {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.outPath = path.join(this.projectRoot, 'out');
  }

  async copyWorkingBeta() {
    console.log('🔄 Copying working beta package...');
    console.log('='.repeat(50));
    
    try {
      // Create out directory if it doesn't exist
      if (!fs.existsSync(this.outPath)) {
        fs.mkdirSync(this.outPath, { recursive: true });
      }
      
      // Copy the working beta package
      const sourceDir = path.join(this.distBetaPath, 'win-unpacked');
      const destDir = path.join(this.outPath, 'NWBuddyScraper-win32-x64');
      
      if (fs.existsSync(sourceDir)) {
        // Remove destination if it exists
        if (fs.existsSync(destDir)) {
          await fs.remove(destDir);
        }
        
        // Copy the working package
        await fs.copy(sourceDir, destDir);
        console.log('✅ Working beta package copied successfully!');
        
        // Copy launcher files to the root of out directory
        const launcherFiles = [
          'NW Buddy Scraper Beta.bat',
          'NW Buddy Scraper Beta.ps1',
          'launcher.js',
          'HOW_TO_RUN.txt'
        ];
        
        for (const file of launcherFiles) {
          const sourceFile = path.join(this.distBetaPath, file);
          const destFile = path.join(this.outPath, file);
          
          if (fs.existsSync(sourceFile)) {
            await fs.copy(sourceFile, destFile);
            console.log(`   📄 Copied: ${file}`);
          }
        }
        
        console.log('\n🎉 Success! Working package is now available at:');
        console.log(`📁 ${destDir}`);
        console.log('\n🚀 You can now run the application using:');
        console.log('   - NW Buddy Scraper Beta.bat (in out/ folder)');
        console.log('   - Or navigate to the win-unpacked folder and run the .exe');
        
      } else {
        throw new Error('Working beta package not found in dist-beta/win-unpacked');
      }
      
    } catch (error) {
      console.error('❌ Failed to copy working beta:', error.message);
      throw error;
    }
  }
}

// Run the copier if this script is executed directly
if (require.main === module) {
  const copier = new WorkingBetaCopier();
  copier.copyWorkingBeta().then(() => {
    console.log('\n✅ Working beta package copied successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Copied working beta package to out/');
    console.log('✅ Copied launcher files');
    console.log('✅ Ready to use!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Failed to copy working beta!');
    process.exit(1);
  });
}

module.exports = WorkingBetaCopier; 