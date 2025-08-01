const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class OldBuildsCleaner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
  }

  async cleanupOldBuilds() {
    console.log('🧹 Cleaning up old builds and packages...');
    console.log('='.repeat(50));
    
    try {
      // Clean up old package directories
      await this.cleanupPackageDirectories();
      
      // Clean up old zip files
      await this.cleanupZipFiles();
      
      // Clean up old dist directories
      await this.cleanupDistDirectories();
      
      // Clean up old output files
      await this.cleanupOutputFiles();
      
      console.log('\n✅ Old builds cleanup completed successfully!');
      
    } catch (error) {
      console.error('❌ Failed to cleanup old builds:', error.message);
      throw error;
    }
  }

  async cleanupPackageDirectories() {
    console.log('📁 Cleaning up old package directories...');
    
    const packageDirs = [
      'NW-Nexus-Standalone',
      'NW-Nexus-Single', 
      'NW-Nexus-Ultimate',
      'NW-Nexus-Standalone-Folder',
      'NW-Nexus-Single-Folder',
      'NW-Nexus-Ultimate-Folder'
    ];
    
    for (const dir of packageDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        try {
          await fs.remove(dirPath);
          console.log(`   ✅ Removed: ${dir}`);
        } catch (error) {
          console.log(`   ⚠️  Could not remove: ${dir} (${error.message})`);
        }
      }
    }
  }

  async cleanupZipFiles() {
    console.log('🗜️  Cleaning up old zip files...');
    
    const zipFiles = [
      'NW-Nexus-Standalone.zip',
      'NW-Nexus-Single.zip',
      'NW-Nexus-Ultimate.zip',
      'NW-Buddy-Scraper-Beta.zip',
      'electron-webapp-build.zip'
    ];
    
    for (const zip of zipFiles) {
      const zipPath = path.join(this.projectRoot, zip);
      if (fs.existsSync(zipPath)) {
        try {
          await fs.remove(zipPath);
          console.log(`   ✅ Removed: ${zip}`);
        } catch (error) {
          console.log(`   ⚠️  Could not remove: ${zip} (${error.message})`);
        }
      }
    }
  }

  async cleanupDistDirectories() {
    console.log('📦 Cleaning up old dist directories...');
    
    const distDirs = [
      'dist',
      'out',
      'out-fixed'
    ];
    
    for (const dir of distDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        try {
          await fs.remove(dirPath);
          console.log(`   ✅ Removed: ${dir}`);
        } catch (error) {
          console.log(`   ⚠️  Could not remove: ${dir} (${error.message})`);
        }
      }
    }
  }

  async cleanupOutputFiles() {
    console.log('📄 Cleaning up old output files...');
    
    const outputDir = path.join(this.projectRoot, 'output');
    if (fs.existsSync(outputDir)) {
      try {
        // Keep only the most recent files, remove older ones
        const files = await fs.readdir(outputDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 10) {
          // Sort by modification time and keep only the 10 most recent
          const fileStats = await Promise.all(
            jsonFiles.map(async (file) => {
              const filePath = path.join(outputDir, file);
              const stats = await fs.stat(filePath);
              return { file, mtime: stats.mtime };
            })
          );
          
          fileStats.sort((a, b) => b.mtime - a.mtime);
          const filesToRemove = fileStats.slice(10);
          
          for (const { file } of filesToRemove) {
            const filePath = path.join(outputDir, file);
            await fs.remove(filePath);
            console.log(`   ✅ Removed old output: ${file}`);
          }
        }
      } catch (error) {
        console.log(`   ⚠️  Could not cleanup output files (${error.message})`);
      }
    }
  }
}

// Run the cleaner if this script is executed directly
if (require.main === module) {
  const cleaner = new OldBuildsCleaner();
  cleaner.cleanupOldBuilds().then(() => {
    console.log('\n🎉 Old builds cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Cleaned up old package directories');
    console.log('✅ Cleaned up old zip files');
    console.log('✅ Cleaned up old dist directories');
    console.log('✅ Cleaned up old output files');
    console.log('\n🧹 Your project folder is now clean!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Old builds cleanup failed!');
    process.exit(1);
  });
}

module.exports = OldBuildsCleaner;