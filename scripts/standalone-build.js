const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class StandaloneBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.standalonePath = path.join(this.projectRoot, 'standalone');
    this.version = this.getVersion();
  }

  getVersion() {
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    return packageJson.version;
  }

  async clean() {
    console.log('🧹 Cleaning previous builds...');
    await fs.remove(this.distPath);
    await fs.remove(this.standalonePath);
    await fs.ensureDir(this.distPath);
    await fs.ensureDir(this.standalonePath);
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    try {
      execSync('npm install', { cwd: this.projectRoot, stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to install dependencies:', error);
      throw error;
    }
  }

  async buildElectronApp() {
    console.log('🔨 Building Electron application...');
    try {
      // Build for Windows
      execSync('npm run build-win', { cwd: this.projectRoot, stdio: 'inherit' });
      
      // Also build portable version
      execSync('npm run build-portable', { cwd: this.projectRoot, stdio: 'inherit' });
    } catch (error) {
      console.error('Failed to build Electron app:', error);
      throw error;
    }
  }

  async createStandalonePackage() {
    console.log('📦 Creating standalone package...');
    
    const standaloneDir = path.join(this.standalonePath, `nw-buddy-scraper-v${this.version}`);
    await fs.ensureDir(standaloneDir);

    // Copy the built Electron app
    const electronAppPath = path.join(this.distPath, 'win-unpacked');
    if (await fs.pathExists(electronAppPath)) {
      await fs.copy(electronAppPath, path.join(standaloneDir, 'app'));
    }

    // Copy portable version if available
    const portablePath = path.join(this.distPath, 'NW Buddy Scraper.exe');
    if (await fs.pathExists(portablePath)) {
      await fs.copy(portablePath, path.join(standaloneDir, 'NW Buddy Scraper.exe'));
    }

    // Create README for standalone
    await this.createStandaloneReadme(standaloneDir);

    // Create batch file for easy launching
    await this.createLaunchScript(standaloneDir);

    // Create version info
    await this.createVersionInfo(standaloneDir);

    return standaloneDir;
  }

  async createStandaloneReadme(standaloneDir) {
    const readmeContent = `# NW Buddy Scraper - Standalone Version ${this.version}

## What's New in Beta

This standalone version includes:
- 🎮 Embedded NW Buddy web application
- 📅 Schedule Maker with Discord bot integration
- 📊 Daily/Weekly tracker
- 🗺️ Interactive maps (NWDB, Aeternum Map)
- ⚙️ Comprehensive settings panel
- 🎨 Multiple theme options
- 💰 Market price integration
- 🔔 Notification system

## Quick Start

1. **Portable Version**: Run "NW Buddy Scraper.exe" directly
2. **Full Version**: Run "launch.bat" or navigate to the "app" folder and run the executable

## Features

### NW Buddy Integration
- Embedded NW Buddy web application
- Direct access to gearsets, crafting, tracking, and market prices
- Seamless integration with the scraper

### Schedule Maker
- Create and manage event schedules
- Discord bot integration for automatic data import
- Support for multiple regions and timezones

### Daily/Weekly Tracker
- Track daily and weekly activities across multiple characters
- Automatic reset timers
- Custom event timers

### Interactive Maps
- NWDB integration for game data
- Aeternum Map for world exploration
- Copy-friendly interface

### Settings & Customization
- Multiple UI themes
- Timezone and time format settings
- Notification preferences
- Data management options

## System Requirements

- Windows 10/11 (64-bit)
- 4GB RAM minimum
- 500MB free disk space
- Internet connection for web features

## Troubleshooting

If you encounter issues:
1. Ensure you have internet connectivity
2. Check that your antivirus isn't blocking the application
3. Run as administrator if needed
4. Check the logs in the app folder

## Support

For issues or feature requests, please refer to the main project documentation.

Version: ${this.version}
Build Date: ${new Date().toISOString()}
`;

    await fs.writeFile(path.join(standaloneDir, 'README.txt'), readmeContent);
  }

  async createLaunchScript(standaloneDir) {
    const batchContent = `@echo off
echo Starting NW Buddy Scraper v${this.version}...
echo.

REM Check if portable version exists
if exist "NW Buddy Scraper.exe" (
    echo Launching portable version...
    start "" "NW Buddy Scraper.exe"
) else (
    echo Launching full version...
    cd app
    start "" "NW Buddy Scraper.exe"
)

echo.
echo Application started!
pause
`;

    await fs.writeFile(path.join(standaloneDir, 'launch.bat'), batchContent);
  }

  async createVersionInfo(standaloneDir) {
    const versionInfo = {
      version: this.version,
      buildDate: new Date().toISOString(),
      features: [
        'NW Buddy Integration',
        'Schedule Maker',
        'Daily/Weekly Tracker',
        'Interactive Maps',
        'Settings Panel',
        'Theme System',
        'Market Price Integration',
        'Notification System'
      ],
      systemRequirements: {
        os: 'Windows 10/11 (64-bit)',
        ram: '4GB minimum',
        disk: '500MB free space',
        network: 'Internet connection required'
      }
    };

    await fs.writeJson(path.join(standaloneDir, 'version.json'), versionInfo, { spaces: 2 });
  }

  async createZipArchive(standaloneDir) {
    console.log('🗜️ Creating ZIP archive...');
    
    const zipName = `nw-buddy-scraper-standalone-v${this.version}.zip`;
    const zipPath = path.join(this.standalonePath, zipName);
    
    try {
      // Use PowerShell to create ZIP (available on Windows 10+)
      const sourceDir = path.basename(standaloneDir);
      const command = `powershell -command "Compress-Archive -Path '${sourceDir}' -DestinationPath '${zipName}' -Force"`;
      
      execSync(command, { 
        cwd: path.dirname(standaloneDir), 
        stdio: 'inherit' 
      });
      
      console.log(`✅ ZIP archive created: ${zipPath}`);
      return zipPath;
    } catch (error) {
      console.warn('Failed to create ZIP archive:', error.message);
      console.log('You can manually zip the standalone folder if needed.');
      return null;
    }
  }

  async build() {
    try {
      console.log(`🚀 Starting standalone build for version ${this.version}...`);
      
      await this.clean();
      await this.installDependencies();
      await this.buildElectronApp();
      
      const standaloneDir = await this.createStandalonePackage();
      const zipPath = await this.createZipArchive(standaloneDir);
      
      console.log('\n✅ Standalone build completed successfully!');
      console.log(`📁 Standalone package: ${standaloneDir}`);
      if (zipPath) {
        console.log(`📦 ZIP archive: ${zipPath}`);
      }
      
      return {
        success: true,
        standaloneDir,
        zipPath,
        version: this.version
      };
      
    } catch (error) {
      console.error('❌ Standalone build failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  const builder = new StandaloneBuilder();
  builder.build().then(result => {
    if (result.success) {
      console.log('\n🎉 Build completed successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 Build failed!');
      process.exit(1);
    }
  });
}

module.exports = StandaloneBuilder; 