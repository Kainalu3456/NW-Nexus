#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { createWriteStream } = require('fs');
const { exec } = require('child_process');

const pipelineAsync = promisify(pipeline);

class NWBuddyLauncher {
  constructor() {
    this.version = '1.0.0-beta.2';
    this.appName = 'NW Buddy Scraper Beta';
    this.nodeVersion = '18.17.0'; // LTS version
    this.nodeInstallerUrl = `https://nodejs.org/dist/v${this.nodeVersion}/node-v${this.nodeVersion}-x64.msi`;
  }

  showBanner() {
    console.clear();
    console.log('='.repeat(60));
    console.log(`  ${this.appName} v${this.version}`);
    console.log('='.repeat(60));
    console.log();
  }

  getAppDirectory() {
    // Get the directory where this executable is located
    const exeDir = path.dirname(process.execPath);
    const appDir = path.join(exeDir, 'win-unpacked');
    
    console.log('📁 Looking for application files...');
    console.log('📍 Executable directory:', exeDir);
    console.log('📍 App directory:', appDir);
    console.log();

    return appDir;
  }

  checkAppDirectory(appDir) {
    if (!fs.existsSync(appDir)) {
      console.error('❌ Application directory not found:', appDir);
      console.error();
      console.error('🔧 Troubleshooting:');
      console.error('1. Make sure the win-unpacked folder is in the same directory as this executable');
      console.error('2. Check that all files were extracted properly');
      console.error('3. Try running this executable from the dist-beta folder');
      console.error();
      console.error('📁 Expected structure:');
      console.error('dist-beta/');
      console.error('├── NW-Buddy-Scraper-Beta.exe  ← This file');
      console.error('└── win-unpacked/              ← Application files');
      console.error('    ├── electron/');
      console.error('    ├── src/');
      console.error('    ├── config/');
      console.error('    ├── assets/');
      console.error('    └── package.json');
      console.error();
      this.waitForUser();
      process.exit(1);
    }

    console.log('✅ Application directory found');
    return true;
  }

  async downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      console.log(`📥 Downloading: ${url}`);
      console.log(`📁 Saving to: ${filepath}`);
      
      const file = createWriteStream(filepath);
      const request = protocol.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r📥 Download progress: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(1)}MB / ${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('\n✅ Download completed!');
          resolve();
        });
      });
      
      request.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if download failed
        reject(err);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Delete the file if write failed
        reject(err);
      });
    });
  }

  async installNodeJS() {
    console.log('🔍 Node.js not found. Installing automatically...');
    console.log();
    
    const tempDir = path.join(process.cwd(), 'temp');
    const installerPath = path.join(tempDir, 'nodejs-installer.msi');
    
    try {
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Download Node.js installer
      console.log('📥 Downloading Node.js installer...');
      await this.downloadFile(this.nodeInstallerUrl, installerPath);
      
      // Install Node.js silently
      console.log('🔧 Installing Node.js...');
      console.log('⏳ This may take a few minutes. Please wait...');
      
      const installCommand = `msiexec /i "${installerPath}" /quiet /norestart`;
      
      return new Promise((resolve, reject) => {
        exec(installCommand, (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Failed to install Node.js:', error.message);
            reject(error);
            return;
          }
          
          console.log('✅ Node.js installed successfully!');
          
          // Clean up installer
          try {
            fs.unlinkSync(installerPath);
            fs.rmdirSync(tempDir);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
          
          // Wait a moment for installation to complete
          setTimeout(() => {
            resolve();
          }, 2000);
        });
      });
      
    } catch (error) {
      console.error('❌ Failed to download/install Node.js:', error.message);
      console.error();
      console.error('🔧 Manual installation required:');
      console.error('1. Download Node.js from https://nodejs.org/');
      console.error('2. Install it with default settings');
      console.error('3. Restart this application');
      console.error();
      this.waitForUser();
      process.exit(1);
    }
  }

  async checkNodeJS() {
    console.log('🔍 Checking Node.js installation...');
    
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log('✅ Node.js found:', nodeVersion);
      return true;
    } catch (error) {
      console.log('❌ Node.js not found');
      
      // Try to install Node.js automatically
      await this.installNodeJS();
      
      // Check again after installation
      try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        console.log('✅ Node.js installed and found:', nodeVersion);
        return true;
      } catch (secondError) {
        console.error('❌ Node.js installation failed or not in PATH');
        console.error();
        console.error('🔧 Manual installation required:');
        console.error('1. Download Node.js from https://nodejs.org/');
        console.error('2. Install it with default settings');
        console.error('3. Restart your computer');
        console.error('4. Try running this executable again');
        console.error();
        this.waitForUser();
        process.exit(1);
      }
    }
  }

  checkNPM() {
    console.log('🔍 Checking npm installation...');
    
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log('✅ npm found:', npmVersion);
      return true;
    } catch (error) {
      console.error('❌ npm is not available');
      console.error();
      console.error('🔧 Solution:');
      console.error('1. Reinstall Node.js from https://nodejs.org/');
      console.error('2. Make sure to include npm during installation');
      console.error();
      this.waitForUser();
      process.exit(1);
    }
  }

  async installDependencies(appDir) {
    const nodeModulesPath = path.join(appDir, 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('📦 Installing dependencies...');
      console.log('⏳ This may take a few minutes on first run...');
      
      try {
        // Change to app directory
        process.chdir(appDir);
        
        // Install dependencies
        execSync('npm install --production', { 
          stdio: 'inherit',
          timeout: 300000 // 5 minutes timeout
        });
        
        console.log('✅ Dependencies installed successfully');
        return true;
      } catch (error) {
        console.error('❌ Failed to install dependencies');
        console.error();
        console.error('🔧 Troubleshooting:');
        console.error('1. Check your internet connection');
        console.error('2. Try running as administrator');
        console.error('3. Check that you have write permissions to the folder');
        console.error('4. Try running: npm cache clean --force');
        console.error();
        this.waitForUser();
        process.exit(1);
      }
    } else {
      console.log('✅ Dependencies already installed');
      return true;
    }
  }

  startApplication(appDir) {
    console.log('🚀 Starting NW Buddy Scraper...');
    console.log();
    
    try {
      // Change to app directory
      process.chdir(appDir);
      
      // Start the application
      const app = spawn('npm', ['start'], { 
        stdio: 'inherit',
        shell: true,
        cwd: appDir
      });

      app.on('close', (code) => {
        console.log();
        console.log('👋 Application closed');
        if (code !== 0) {
          console.log('⚠️  Application exited with code:', code);
        }
        this.waitForUser();
        process.exit(code);
      });

      app.on('error', (error) => {
        console.error('❌ Failed to start application:', error.message);
        console.error();
        console.error('🔧 Troubleshooting:');
        console.error('1. Check that all files are present in win-unpacked folder');
        console.error('2. Try running npm start manually in the win-unpacked folder');
        console.error('3. Check the error messages above for specific issues');
        console.error();
        this.waitForUser();
        process.exit(1);
      });

    } catch (error) {
      console.error('❌ Failed to start application:', error.message);
      this.waitForUser();
      process.exit(1);
    }
  }

  waitForUser() {
    console.log();
    console.log('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  }

  async run() {
    try {
      this.showBanner();
      
      const appDir = this.getAppDirectory();
      this.checkAppDirectory(appDir);
      await this.checkNodeJS();
      this.checkNPM();
      await this.installDependencies(appDir);
      this.startApplication(appDir);
      
    } catch (error) {
      console.error('💥 Unexpected error:', error.message);
      console.error();
      console.error('🔧 Please report this error with:');
      console.error('1. The error message above');
      console.error('2. Your Windows version');
      console.error('3. Your Node.js version');
      console.error();
      this.waitForUser();
      process.exit(1);
    }
  }
}

// Run the launcher
const launcher = new NWBuddyLauncher();
launcher.run(); 