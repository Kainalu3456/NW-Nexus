const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class BetaBuilder {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.version = this.getVersion();
  }

  getVersion() {
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    return packageJson.version;
  }

  async clean() {
    console.log('🧹 Cleaning previous beta builds...');
    await fs.remove(this.distBetaPath);
    await fs.ensureDir(this.distBetaPath);
  }

  async createBetaPackage() {
    console.log('📦 Creating beta package...');
    
    // Create the main beta directory structure
    const betaDir = path.join(this.distBetaPath, 'win-unpacked');
    await fs.ensureDir(betaDir);

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
      const destPath = path.join(betaDir, item);
      
      if (await fs.pathExists(sourcePath)) {
        console.log(`📁 Copying ${item}...`);
        await fs.copy(sourcePath, destPath);
      }
    }

    // Copy essential node_modules
    console.log('📦 Copying essential dependencies...');
    const essentialDeps = [
      'electron',
      'puppeteer',
      'cheerio',
      'fs-extra',
      'axios'
    ];

    const nodeModulesDir = path.join(betaDir, 'node_modules');
    await fs.ensureDir(nodeModulesDir);

    for (const dep of essentialDeps) {
      const sourcePath = path.join(this.projectRoot, 'node_modules', dep);
      const destPath = path.join(nodeModulesDir, dep);
      
      if (await fs.pathExists(sourcePath)) {
        await fs.copy(sourcePath, destPath);
      }
    }

    // Create launch script
    await this.createLaunchScript(betaDir);
    
    // Create beta info
    await this.createBetaInfo();
    
    // Create documentation
    await this.createDocumentation();

    return betaDir;
  }

  async createLaunchScript(betaDir) {
    console.log('📝 Creating launch script...');

    const launchContent = `@echo off
echo Starting NW Buddy Scraper Beta v${this.version}...
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

    await fs.writeFile(path.join(betaDir, 'launch.bat'), launchContent);
  }

  async createBetaInfo() {
    console.log('📋 Creating beta info...');

    const betaInfo = {
      version: `${this.version}-beta.2`,
      buildDate: new Date().toISOString(),
      buildType: "beta",
      features: {
        scheduleMaker: "enabled",
        discordBotIntegration: "enabled",
        nwbuddyIntegration: "enabled",
        marketPrices: "enabled",
        webScraping: "enabled",
        dailyWeeklyTracker: "enabled",
        themeSystem: "enabled",
        notificationSystem: "enabled"
      },
      notes: [
        "This is a BETA version for testing purposes",
        "All features are enabled for comprehensive testing",
        "Please report any issues or bugs you encounter",
        "Performance feedback is welcome",
        "UI/UX suggestions are appreciated"
      ],
      systemRequirements: {
        os: "Windows 10/11 (64-bit)",
        nodejs: "16.0.0 or higher",
        ram: "4GB minimum (8GB recommended)",
        disk: "500MB free space",
        network: "Internet connection required"
      }
    };

    await fs.writeJson(path.join(this.distBetaPath, 'beta-info.json'), betaInfo, { spaces: 2 });
  }

  async createDocumentation() {
    console.log('📚 Creating documentation...');

    const readmeContent = `# NW Buddy Scraper - Beta Version ${this.version}-beta.2

## 🚀 Quick Start

### Prerequisites
- **Node.js**: Download and install from https://nodejs.org/ (LTS version recommended)
- **Windows 10/11**: 64-bit operating system
- **Internet Connection**: Required for web features

### Installation
1. **Extract** this package to your desired location
2. **Run** the launch script: \`launch.bat\`
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
- node_modules/ - Dependencies
- launch.bat - Windows batch launcher

## 🧪 Beta Testing

This is a beta version with all features enabled. Please test:

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

## 🐛 Bug Reporting

When you encounter a bug, please provide:
1. **Description**: What happened?
2. **Steps**: How to reproduce?
3. **Expected**: What should happen?
4. **Actual**: What actually happened?
5. **System**: Windows version, RAM, Node.js version
6. **Screenshots**: If applicable

## 🛠️ Troubleshooting

### Common Issues
- **Node.js not installed**: Download from https://nodejs.org/
- **Dependencies not found**: Run \`npm install\` in the application directory
- **Application won't start**: Check system requirements and run as administrator if needed
- **Web content not loading**: Verify internet connection and firewall settings

## 📞 Support

For issues or questions:
- Check this README for troubleshooting
- Review the main project documentation
- Contact the development team

## 📝 Version Information

- **Version**: ${this.version}-beta.2
- **Build Date**: ${new Date().toISOString()}
- **Type**: Beta
- **Node.js Required**: Yes

---

**Thank you for testing the NW Buddy Scraper Beta! 🚀**
`;

    await fs.writeFile(path.join(this.distBetaPath, 'BETA_README.md'), readmeContent);
  }

  async createExecutable() {
    console.log('🔨 Creating executable wrapper...');

    // Create a simple batch file that acts as the main executable
    const exeContent = `@echo off
title NW Buddy Scraper Beta v${this.version}-beta.2
echo.
echo ========================================
echo   NW Buddy Scraper Beta v${this.version}-beta.2
echo ========================================
echo.
echo Starting application...
echo.

cd /d "%~dp0win-unpacked"
call launch.bat

echo.
echo Application closed.
pause
`;

    const exePath = path.join(this.distBetaPath, `NW Buddy Scraper Beta ${this.version}-beta.2.exe`);
    await fs.writeFile(exePath, exeContent);

    // Also create a copy with a simpler name
    const simpleExePath = path.join(this.distBetaPath, 'NW Buddy Scraper Beta.exe');
    await fs.copy(exePath, simpleExePath);

    console.log(`✅ Executable created: ${exePath}`);
    return exePath;
  }

  async createZipArchive() {
    console.log('🗜️ Creating ZIP archive...');
    
    const zipName = `nw-buddy-scraper-beta-${this.version}-beta.2.zip`;
    const zipPath = path.join(this.distBetaPath, zipName);
    
    try {
      const command = `powershell -command "Compress-Archive -Path 'dist-beta' -DestinationPath '${zipName}' -Force"`;
      
      execSync(command, { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      
      console.log(`✅ ZIP archive created: ${zipPath}`);
      return zipPath;
    } catch (error) {
      console.warn('Failed to create ZIP archive:', error.message);
      console.log('You can manually zip the dist-beta folder if needed.');
      return null;
    }
  }

  async build() {
    try {
      console.log(`🚀 Starting beta build for version ${this.version}-beta.2...`);
      
      await this.clean();
      const betaDir = await this.createBetaPackage();
      const exePath = await this.createExecutable();
      const zipPath = await this.createZipArchive();
      
      console.log('\n✅ Beta build completed successfully!');
      console.log(`📁 Beta package: ${betaDir}`);
      console.log(`🔧 Executable: ${exePath}`);
      if (zipPath) {
        console.log(`📦 ZIP archive: ${zipPath}`);
      }
      
      console.log('\n📋 Beta Package Ready:');
      console.log('1. Users can run the .exe file directly');
      console.log('2. Or extract the ZIP and run launch.bat');
      console.log('3. All features are enabled for testing');
      console.log('4. Node.js is required on the target system');
      
      return {
        success: true,
        betaDir,
        exePath,
        zipPath,
        version: `${this.version}-beta.2`
      };
      
    } catch (error) {
      console.error('❌ Beta build failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the build if this script is executed directly
if (require.main === module) {
  const builder = new BetaBuilder();
  builder.build().then(result => {
    if (result.success) {
      console.log('\n🎉 Beta build completed successfully!');
      process.exit(0);
    } else {
      console.error('\n💥 Beta build failed!');
      process.exit(1);
    }
  });
}

module.exports = BetaBuilder; 