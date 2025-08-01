const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class FixedPackageCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.outDir = path.join(this.projectRoot, 'out');
    this.fixedOutDir = path.join(this.projectRoot, 'out-fixed');
  }

  async createFixedPackage() {
    console.log('🔧 Creating fixed Electron package...');
    console.log('='.repeat(50));
    
    try {
      // Create a temporary package.json with different name
      await this.createTempPackageJson();
      
      // Package with the temporary config
      await this.packageWithTempConfig();
      
      // Copy to final location
      await this.copyToFinalLocation();
      
      // Clean up temporary files
      await this.cleanup();
      
      console.log('\n✅ Fixed package created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create fixed package:', error.message);
      throw error;
    }
  }

  async createTempPackageJson() {
    console.log('📝 Creating temporary package.json...');
    
    const originalPackageJson = require(path.join(this.projectRoot, 'package.json'));
    const tempPackageJson = {
      ...originalPackageJson,
      name: 'nw-buddy-scraper-fixed',
      config: {
        forge: {
          packagerConfig: {
            name: 'NWBuddyScraperFixed',
            asar: true,
            overwrite: true,
            ignore: [
              "node_modules/.cache",
              "dist",
              "dist-beta",
              "output",
              ".git",
              ".gitignore",
              "README.md",
              "scripts",
              "test-*",
              "BETA_*",
              "ELECTRON_*",
              "out",
              "out-fixed"
            ],
            extraResource: [
              "assets/**/*"
            ]
          },
          makers: [
            {
              "name": "@electron-forge/maker-zip",
              "platforms": [
                "darwin",
                "win32"
              ]
            }
          ],
          publishers: []
        }
      }
    };
    
    const tempPackagePath = path.join(this.projectRoot, 'package-temp.json');
    await fs.writeJson(tempPackagePath, tempPackageJson, { spaces: 2 });
    console.log('   ✅ Temporary package.json created');
  }

  async packageWithTempConfig() {
    console.log('📦 Packaging with temporary config...');
    
    try {
      // Use electron-forge directly with custom config
      const command = `npx electron-forge package --config package-temp.json`;
      execSync(command, { stdio: 'inherit' });
      console.log('   ✅ Package created successfully');
    } catch (error) {
      console.error('   ❌ Failed to create package:', error.message);
      throw error;
    }
  }

  async copyToFinalLocation() {
    console.log('📋 Copying to final location...');
    
    try {
      const sourceDir = path.join(this.outDir, 'NWBuddyScraperFixed-win32-x64');
      const destDir = path.join(this.outDir, 'NWBuddyScraper-win32-x64');
      
      if (fs.existsSync(sourceDir)) {
        // Remove destination if it exists
        if (fs.existsSync(destDir)) {
          await fs.remove(destDir);
        }
        
        // Copy the fixed package
        await fs.copy(sourceDir, destDir);
        console.log('   ✅ Package copied to final location');
        
        // Update the executable name
        const exePath = path.join(destDir, 'NWBuddyScraperFixed.exe');
        const newExePath = path.join(destDir, 'NW Buddy Scraper.exe');
        
        if (fs.existsSync(exePath)) {
          await fs.move(exePath, newExePath);
          console.log('   ✅ Executable renamed');
        }
        
        // Clean up the temporary package
        await fs.remove(sourceDir);
        console.log('   ✅ Temporary package cleaned up');
      } else {
        throw new Error('Source package not found');
      }
    } catch (error) {
      console.error('   ❌ Failed to copy package:', error.message);
      throw error;
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up temporary files...');
    
    try {
      const tempPackagePath = path.join(this.projectRoot, 'package-temp.json');
      if (fs.existsSync(tempPackagePath)) {
        await fs.remove(tempPackagePath);
        console.log('   ✅ Temporary package.json removed');
      }
    } catch (error) {
      console.log('   ⚠️  Could not remove temporary files');
    }
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new FixedPackageCreator();
  creator.createFixedPackage().then(() => {
    console.log('\n🎉 Fixed package creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created temporary package.json');
    console.log('✅ Packaged with temporary config');
    console.log('✅ Copied to final location');
    console.log('✅ Cleaned up temporary files');
    console.log('\n🚀 Your Electron app should now work properly!');
    console.log('📁 Location: out/NWBuddyScraper-win32-x64/');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Fixed package creation failed!');
    process.exit(1);
  });
}

module.exports = FixedPackageCreator; 