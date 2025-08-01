const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const StandaloneBuilder = require('./standalone-build');

class BetaTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResults = [];
    this.appProcess = null;
    this.testStartTime = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    this.testResults.push({
      timestamp,
      type,
      message
    });
  }

  async runTest(testName, testFunction) {
    this.log(`Starting test: ${testName}`);
    const startTime = Date.now();
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      this.log(`Test passed: ${testName} (${duration}ms)`, 'success');
      return { success: true, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.log(`Test failed: ${testName} - ${error.message} (${duration}ms)`, 'error');
      return { success: false, error: error.message, duration };
    }
  }

  async testBuildProcess() {
    this.log('Testing standalone build process...');
    
    const builder = new StandaloneBuilder();
    const result = await builder.build();
    
    if (!result.success) {
      throw new Error(`Build failed: ${result.error}`);
    }
    
    // Verify the standalone package exists
    if (!await fs.pathExists(result.standaloneDir)) {
      throw new Error('Standalone package directory not found');
    }
    
    // Check for required files
    const requiredFiles = [
      'README.txt',
      'launch.bat',
      'version.json'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(result.standaloneDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    // Check for executable
    const exePath = path.join(result.standaloneDir, 'NW Buddy Scraper.exe');
    const appExePath = path.join(result.standaloneDir, 'app', 'NW Buddy Scraper.exe');
    
    if (!await fs.pathExists(exePath) && !await fs.pathExists(appExePath)) {
      throw new Error('No executable found in standalone package');
    }
    
    this.log(`Standalone package created successfully at: ${result.standaloneDir}`);
    return result.standaloneDir;
  }

  async testApplicationLaunch(standaloneDir) {
    this.log('Testing application launch...');
    
    // Find the executable
    let exePath = path.join(standaloneDir, 'NW Buddy Scraper.exe');
    if (!await fs.pathExists(exePath)) {
      exePath = path.join(standaloneDir, 'app', 'NW Buddy Scraper.exe');
    }
    
    if (!await fs.pathExists(exePath)) {
      throw new Error('Could not find executable to test');
    }
    
    // Launch the application
    this.log(`Launching application: ${exePath}`);
    this.appProcess = spawn(exePath, [], {
      detached: true,
      stdio: 'pipe'
    });
    
    // Wait a bit for the app to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if process is still running
    if (this.appProcess.killed) {
      throw new Error('Application process terminated unexpectedly');
    }
    
    this.log('Application launched successfully');
    return this.appProcess;
  }

  async testFileStructure(standaloneDir) {
    this.log('Testing file structure...');
    
    const expectedStructure = {
      files: ['README.txt', 'launch.bat', 'version.json'],
      dirs: ['app']
    };
    
    // Check files
    for (const file of expectedStructure.files) {
      const filePath = path.join(standaloneDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Missing file: ${file}`);
      }
    }
    
    // Check directories
    for (const dir of expectedStructure.dirs) {
      const dirPath = path.join(standaloneDir, dir);
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Missing directory: ${dir}`);
      }
    }
    
    // Check app directory contents
    const appDir = path.join(standaloneDir, 'app');
    const appContents = await fs.readdir(appDir);
    
    if (appContents.length === 0) {
      throw new Error('App directory is empty');
    }
    
    this.log(`File structure verified. App directory contains ${appContents.length} items`);
  }

  async testConfigurationFiles() {
    this.log('Testing configuration files...');
    
    const configFiles = [
      'config/nwbuddy-config.js',
      'config/artifacts-config.js',
      'config/crafting-recipes.txt'
    ];
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Configuration file missing: ${configFile}`);
      }
      
      // Try to require/read the file to ensure it's valid
      try {
        if (configFile.endsWith('.js')) {
          require(filePath);
        } else {
          await fs.readFile(filePath, 'utf8');
        }
      } catch (error) {
        throw new Error(`Invalid configuration file ${configFile}: ${error.message}`);
      }
    }
    
    this.log('All configuration files verified');
  }

  async testDependencies() {
    this.log('Testing dependencies...');
    
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    const requiredDeps = [
      'electron',
      'puppeteer',
      'cheerio',
      'fs-extra',
      'axios'
    ];
    
    for (const dep of requiredDeps) {
      if (!packageJson.dependencies[dep] && !packageJson.devDependencies[dep]) {
        throw new Error(`Required dependency missing: ${dep}`);
      }
    }
    
    // Check if node_modules exists
    const nodeModulesPath = path.join(this.projectRoot, 'node_modules');
    if (!await fs.pathExists(nodeModulesPath)) {
      throw new Error('node_modules directory not found');
    }
    
    this.log('Dependencies verified');
  }

  async testSourceFiles() {
    this.log('Testing source files...');
    
    const sourceFiles = [
      'src/crawler.js',
      'src/nwbuddy-crawler.js',
      'src/nwmp-market-scraper.js',
      'electron/main.js',
      'electron/renderer/index.html',
      'electron/renderer/renderer.js',
      'electron/renderer/styles.css'
    ];
    
    for (const sourceFile of sourceFiles) {
      const filePath = path.join(this.projectRoot, sourceFile);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Source file missing: ${sourceFile}`);
      }
    }
    
    this.log('Source files verified');
  }

  async testBuildScripts() {
    this.log('Testing build scripts...');
    
    const buildScripts = [
      'scripts/build.js',
      'scripts/standalone-build.js',
      'scripts/simple-build.js'
    ];
    
    for (const script of buildScripts) {
      const scriptPath = path.join(this.projectRoot, script);
      if (!await fs.pathExists(scriptPath)) {
        throw new Error(`Build script missing: ${script}`);
      }
      
      // Try to require the script to ensure it's valid
      try {
        require(scriptPath);
      } catch (error) {
        throw new Error(`Invalid build script ${script}: ${error.message}`);
      }
    }
    
    this.log('Build scripts verified');
  }

  async testElectronConfiguration() {
    this.log('Testing Electron configuration...');
    
    const packageJson = require(path.join(this.projectRoot, 'package.json'));
    
    // Check main entry point
    if (!packageJson.main) {
      throw new Error('Main entry point not specified in package.json');
    }
    
    // Check build configuration
    if (!packageJson.build) {
      throw new Error('Electron build configuration missing');
    }
    
    // Check required build fields
    const requiredBuildFields = ['appId', 'productName', 'directories', 'files'];
    for (const field of requiredBuildFields) {
      if (!packageJson.build[field]) {
        throw new Error(`Required build field missing: ${field}`);
      }
    }
    
    this.log('Electron configuration verified');
  }

  async cleanup() {
    this.log('Cleaning up...');
    
    if (this.appProcess && !this.appProcess.killed) {
      try {
        this.appProcess.kill();
        this.log('Application process terminated');
      } catch (error) {
        this.log(`Warning: Could not terminate app process: ${error.message}`, 'warning');
      }
    }
  }

  async generateTestReport() {
    const reportPath = path.join(this.projectRoot, 'beta-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.testStartTime ? Date.now() - this.testStartTime : 0,
      results: this.testResults,
      summary: {
        total: this.testResults.length,
        success: this.testResults.filter(r => r.type === 'success').length,
        error: this.testResults.filter(r => r.type === 'error').length,
        warning: this.testResults.filter(r => r.type === 'warning').length,
        info: this.testResults.filter(r => r.type === 'info').length
      }
    };
    
    await fs.writeJson(reportPath, report, { spaces: 2 });
    this.log(`Test report saved to: ${reportPath}`);
    
    return report;
  }

  async runAllTests() {
    this.testStartTime = Date.now();
    this.log('🚀 Starting comprehensive beta test suite...');
    
    let standaloneDir = null;
    
    try {
      // Run all tests
      await this.runTest('Dependencies Check', () => this.testDependencies());
      await this.runTest('Source Files Check', () => this.testSourceFiles());
      await this.runTest('Configuration Files Check', () => this.testConfigurationFiles());
      await this.runTest('Build Scripts Check', () => this.testBuildScripts());
      await this.runTest('Electron Configuration Check', () => this.testElectronConfiguration());
      
      standaloneDir = await this.runTest('Standalone Build Process', () => this.testBuildProcess());
      
      await this.runTest('File Structure Check', () => this.testFileStructure(standaloneDir));
      await this.runTest('Application Launch Test', () => this.testApplicationLaunch(standaloneDir));
      
      // Wait a bit more to let the app fully load
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
    } finally {
      await this.cleanup();
      const report = await this.generateTestReport();
      
      // Print summary
      console.log('\n📊 Beta Test Summary:');
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`✅ Passed: ${report.summary.success}`);
      console.log(`❌ Failed: ${report.summary.error}`);
      console.log(`⚠️ Warnings: ${report.summary.warning}`);
      console.log(`⏱️ Duration: ${Math.round(report.duration / 1000)}s`);
      
      if (report.summary.error === 0) {
        console.log('\n🎉 All tests passed! The standalone application is ready for beta testing.');
      } else {
        console.log('\n⚠️ Some tests failed. Please review the test report for details.');
      }
      
      return report;
    }
  }
}

// Run the beta test if this script is executed directly
if (require.main === module) {
  const tester = new BetaTester();
  tester.runAllTests().then(report => {
    process.exit(report.summary.error === 0 ? 0 : 1);
  });
}

module.exports = BetaTester; 