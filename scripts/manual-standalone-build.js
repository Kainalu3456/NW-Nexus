const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ManualStandaloneBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.standalonePath = path.join(this.projectRoot, 'standalone');
    this.version = this.getVersion();
  }

  getVersion() {
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    return packageJson.version;
  }

  async clean() {
    console.log('🧹 Cleaning previous builds...');
    await fs.remove(this.standalonePath);
    await fs.ensureDir(this.standalonePath);
  }

  async createStandalonePackage() {
    console.log('📦 Creating manual standalone package...');
    
    const standaloneDir = path.join(this.standalonePath, `nw-buddy-scraper-v${this.version}`);
    await fs.ensureDir(standaloneDir);

    // Copy all necessary files
    const filesToCopy = [
      'electron',
      'src',
      'config',
      'assets',
      'package.json',
      'package-lock.json'
    ];

    for (const item of filesToCopy) {
      const sourcePath = path.join(this.projectRoot, item);
      const destPath = path.join(standaloneDir, item);
      
      if (await fs.pathExists(sourcePath)) {
        console.log(`📁 Copying ${item}...`);
        await fs.copy(sourcePath, destPath);
      }
    }

    // Copy node_modules (essential dependencies only)
    console.log('📦 Copying essential dependencies...');
    const essentialDeps = [
      'electron',
      'puppeteer',
      'cheerio',
      'fs-extra',
      'axios'
    ];

    const nodeModulesDir = path.join(standaloneDir, 'node_modules');
    await fs.ensureDir(nodeModulesDir);

    for (const dep of essentialDeps) {
      const sourcePath = path.join(this.projectRoot, 'node_modules', dep);
      const destPath = path.join(nodeModulesDir, dep);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
      }
    }

    // Create launch scripts
    await this.createLaunchScripts(standaloneDir);
    
    // Create documentation
    await this.createDocumentation(standaloneDir);
    
    // Create version info
    await this.createVersionInfo(standaloneDir);

    return standaloneDir;
  }

  async createLaunchScripts(standaloneDir) {
    console.log('📝 Creating launch scripts...');

    // Windows batch file
    const batchContent = `@echo off
echo Starting NW Buddy Scraper v${this.version}...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --production
)

REM Start the application
echo Starting application...
npm start

echo.
echo Application closed.
pause
`;

    await fs.writeFile(path.join(standaloneDir, 'launch.bat'), batchContent);

    // PowerShell script
    const psContent = `# NW Buddy Scraper Launcher
Write-Host "Starting NW Buddy Scraper v${this.version}..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Yellow
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install --production
}

# Start the application
Write-Host "Starting application..." -ForegroundColor Green
npm start

Write-Host "Application closed." -ForegroundColor Green
Read-Host "Press Enter to exit"
`;

    await fs.writeFile(path.join(standaloneDir, 'launch.ps1'), psContent);
  }

  async createDocumentation(standaloneDir) {
    console.log('📚 Creating documentation...');

    const readmeContent = `# NW Buddy Scraper - Manual Standalone Version ${this.version}

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Download and install from https://nodejs.org/ (LTS version recommended)
- **Windows 10/11**: 64-bit operating system
- **Internet Connection**: Required for web features

### Installation
1. **Extract** this package to your desired location
2. **Run** one of the launch scripts:
   - launch.bat (Windows Command Prompt)
   - launch.ps1 (PowerShell)
3. **First Run**: The app will install dependencies and start

## 📦 What's Included

### Core Features
- 🎮 **NW Buddy Integration**: Embedded NW Buddy web application
- 📅 **Schedule Maker**: Event management with Discord integration
- 📊 **Daily/Weekly Tracker**: Multi-character activity tracking
- 🗺️ **Interactive Maps**: NWDB and Aeternum Map integration
- ⚙️ **Settings Panel**: Comprehensive customization options
- 🎨 **Theme System**: Multiple UI themes available
- 💰 **Market Price Integration**: Real-time market data
- 🔔 **Notification System**: Customizable alerts

### Files Structure
- electron/ - Electron application files
- src/ - Source code and crawlers
- config/ - Configuration files
- assets/ - Application assets
- node_modules/ - Dependencies (created on first run)
- launch.bat - Windows batch launcher
- launch.ps1 - PowerShell launcher

## 🛠️ Troubleshooting

### Common Issues

#### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Ensure Node.js is added to your system PATH
- Restart your command prompt after installation

#### "Dependencies not found"
- Run \`npm install\` in the application directory
- Check your internet connection
- Try running as administrator

#### "Application won't start"
- Check that all files are extracted correctly
- Verify Node.js installation
- Check system requirements
- Run as administrator if needed

#### "Web content not loading"
- Verify internet connection
- Check firewall settings
- Try refreshing the application

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB free space
- **Node.js**: Version 16 or higher
- **Network**: Internet connection required

## 📋 Beta Testing

This is a beta version. Please report any issues you encounter:

1. **Bug Description**: What happened?
2. **Steps to Reproduce**: How to recreate the issue?
3. **Expected Behavior**: What should happen?
4. **Actual Behavior**: What actually happened?
5. **System Information**: Windows version, RAM, etc.

## 🎯 Features to Test

### Core Functionality
- [ ] Application launches successfully
- [ ] All tabs are accessible
- [ ] NW Buddy web app loads
- [ ] Schedule maker works
- [ ] Daily/weekly tracker functions
- [ ] Maps load correctly
- [ ] Settings panel works

### Advanced Features
- [ ] Theme switching
- [ ] Market price integration
- [ ] Data saving/loading
- [ ] Notification system
- [ ] Discord bot integration

### Performance
- [ ] Startup time < 10 seconds
- [ ] Memory usage < 500MB
- [ ] UI responsiveness
- [ ] No freezing or hanging

## 📞 Support

For issues or questions:
- Check this README for troubleshooting
- Review the main project documentation
- Contact the development team

## 📝 Version Information

- **Version**: ${this.version}
- **Build Date**: ${new Date().toISOString()}
- **Type**: Manual Standalone
- **Node.js Required**: Yes

---

**Thank you for testing the NW Buddy Scraper! 🚀**
`;

    await fs.writeFile(path.join(standaloneDir, 'README.txt'), readmeContent);
  }

  async createVersionInfo(standaloneDir) {
    const versionInfo = {
      version: this.version,
      buildDate: new Date().toISOString(),
      buildType: 'manual-standalone',
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
      requirements: {
        nodejs: '16.0.0 or higher',
        os: 'Windows 10/11 (64-bit)',
        ram: '4GB minimum',
        disk: '500MB free space',
        network: 'Internet connection required'
      },
      launchScripts: [
        'launch.bat (Windows Command Prompt)',
        'launch.ps1 (PowerShell)'
      ]
    };

    await fs.writeJson(path.join(standaloneDir, 'version.json'), versionInfo, { spaces: 2 });
  }

  async createZipArchive(standaloneDir) {
    console.log('🗜️ Creating ZIP archive...');
    
    const zipName = `nw-buddy-scraper-manual-v${this.version}.zip`;
    const zipPath = path.join(this.standalonePath, zipName);
    
    try {
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
      console.log(`🚀 Starting manual standalone build for version ${this.version}...`);
      
      await this.clean();
      const standaloneDir = await this.createStandalonePackage();
      const zipPath = await this.createZipArchive(standaloneDir);
      
      console.log('\n✅ Manual standalone build completed successfully!');
      console.log(`📁 Standalone package: ${standaloneDir}`);
      if (zipPath) {
        console.log(`📦 ZIP archive: ${zipPath}`);
      }
      
      console.log('\n📋 Next Steps:');
      console.log('1. Test the standalone package');
      console.log('2. Ensure Node.js is installed on target system');
      console.log('3. Run launch.bat or launch.ps1');
      console.log('4. Report any issues found');
      
      return {
        success: true,
        standaloneDir,
        zipPath,
        version: this.version
      };
      
    } catch (error) {
      console.error('❌ Manual standalone build failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  const builder = new ManualStandaloneBuilder();
  builder.build().then(result => {
    if (result.success) {
      console.log('\n🎉 Manual build completed successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 Manual build failed!');
      process.exit(1);
    }
  });
}

module.exports = ManualStandaloneBuilder; 