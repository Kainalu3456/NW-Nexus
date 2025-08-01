const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SimpleBetaTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.testResults = [];
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

  async testManualStandalonePackage() {
    this.log('Testing manual standalone package...');
    
    const standalonePath = path.join(this.projectRoot, 'standalone');
    if (!await fs.pathExists(standalonePath)) {
      throw new Error('Standalone directory not found');
    }

    const contents = await fs.readdir(standalonePath);
    if (contents.length === 0) {
      throw new Error('Standalone directory is empty');
    }

    // Find the standalone package directory
    const packageDir = contents.find(item => item.startsWith('nw-buddy-scraper-v'));
    if (!packageDir) {
      throw new Error('Standalone package directory not found');
    }

    const packagePath = path.join(standalonePath, packageDir);
    
    // Check for required files
    const requiredFiles = [
      'README.txt',
      'launch.bat',
      'launch.ps1',
      'version.json',
      'package.json'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(packagePath, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    // Check for required directories
    const requiredDirs = [
      'electron',
      'src',
      'config',
      'assets'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(packagePath, dir);
      if (!await fs.pathExists(dirPath)) {
        throw new Error(`Required directory missing: ${dir}`);
      }
    }

    this.log(`Manual standalone package verified at: ${packagePath}`);
    return packagePath;
  }

  async testFileStructure(standaloneDir) {
    this.log('Testing file structure...');
    
    if (!standaloneDir || typeof standaloneDir !== 'string') {
      throw new Error('Invalid standalone directory path');
    }
    
    // Check electron files
    const electronFiles = [
      'electron/main.js',
      'electron/renderer/index.html',
      'electron/renderer/renderer.js',
      'electron/renderer/styles.css'
    ];

    for (const file of electronFiles) {
      const filePath = path.join(standaloneDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Electron file missing: ${file}`);
      }
    }

    // Check source files
    const sourceFiles = [
      'src/crawler.js',
      'src/nwbuddy-crawler.js',
      'src/nwmp-market-scraper.js'
    ];

    for (const file of sourceFiles) {
      const filePath = path.join(standaloneDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Source file missing: ${file}`);
      }
    }

    // Check config files
    const configFiles = [
      'config/nwbuddy-config.js',
      'config/artifacts-config.js',
      'config/crafting-recipes.txt'
    ];

    for (const file of configFiles) {
      const filePath = path.join(standaloneDir, file);
      if (!await fs.pathExists(filePath)) {
        throw new Error(`Config file missing: ${file}`);
      }
    }

    this.log('File structure verified successfully');
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

  async testLaunchScripts(standaloneDir) {
    this.log('Testing launch scripts...');
    
    if (!standaloneDir || typeof standaloneDir !== 'string') {
      throw new Error('Invalid standalone directory path');
    }
    
    // Test batch file
    const batchPath = path.join(standaloneDir, 'launch.bat');
    const batchContent = await fs.readFile(batchPath, 'utf8');
    
    if (!batchContent.includes('npm start')) {
      throw new Error('Batch file does not contain npm start command');
    }
    
    // Test PowerShell script
    const psPath = path.join(standaloneDir, 'launch.ps1');
    const psContent = await fs.readFile(psPath, 'utf8');
    
    if (!psContent.includes('npm start')) {
      throw new Error('PowerShell script does not contain npm start command');
    }
    
    this.log('Launch scripts verified');
  }

  async testDocumentation(standaloneDir) {
    this.log('Testing documentation...');
    
    if (!standaloneDir || typeof standaloneDir !== 'string') {
      throw new Error('Invalid standalone directory path');
    }
    
    const readmePath = path.join(standaloneDir, 'README.txt');
    const readmeContent = await fs.readFile(readmePath, 'utf8');
    
    if (!readmeContent.includes('NW Buddy Scraper')) {
      throw new Error('README does not contain expected content');
    }
    
    const versionPath = path.join(standaloneDir, 'version.json');
    const versionInfo = await fs.readJson(versionPath);
    
    if (!versionInfo.version || !versionInfo.buildType) {
      throw new Error('Version info is incomplete');
    }
    
    this.log('Documentation verified');
  }

  async testZipArchive() {
    this.log('Testing ZIP archive...');
    
    const standalonePath = path.join(this.projectRoot, 'standalone');
    const contents = await fs.readdir(standalonePath);
    
    const zipFile = contents.find(item => item.endsWith('.zip'));
    if (!zipFile) {
      throw new Error('ZIP archive not found');
    }
    
    const zipPath = path.join(standalonePath, zipFile);
    const stats = await fs.stat(zipPath);
    
    if (stats.size < 1000000) { // Less than 1MB
      throw new Error('ZIP archive seems too small');
    }
    
    this.log(`ZIP archive verified: ${zipFile} (${Math.round(stats.size / 1024 / 1024)}MB)`);
  }

  async generateTestReport() {
    const reportPath = path.join(this.projectRoot, 'simple-beta-test-report.json');
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
    this.log('🚀 Starting simple beta test suite...');
    
    let standaloneDir = null;
    
    try {
      // Run all tests
      await this.runTest('Dependencies Check', () => this.testDependencies());
      await this.runTest('Source Files Check', () => this.testSourceFiles());
      await this.runTest('Configuration Files Check', () => this.testConfigurationFiles());
      
      standaloneDir = await this.runTest('Manual Standalone Package Check', () => this.testManualStandalonePackage());
      
      await this.runTest('File Structure Check', () => this.testFileStructure(standaloneDir));
      await this.runTest('Launch Scripts Check', () => this.testLaunchScripts(standaloneDir));
      await this.runTest('Documentation Check', () => this.testDocumentation(standaloneDir));
      await this.runTest('ZIP Archive Check', () => this.testZipArchive());
      
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
    } finally {
      const report = await this.generateTestReport();
      
      // Print summary
      console.log('\n📊 Simple Beta Test Summary:');
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`✅ Passed: ${report.summary.success}`);
      console.log(`❌ Failed: ${report.summary.error}`);
      console.log(`⚠️ Warnings: ${report.summary.warning}`);
      console.log(`⏱️ Duration: ${Math.round(report.duration / 1000)}s`);
      
      if (report.summary.error === 0) {
        console.log('\n🎉 All tests passed! The manual standalone application is ready for beta testing.');
        console.log('\n📦 Beta Package Ready:');
        console.log('1. Check the standalone/ directory for the built application');
        console.log('2. The ZIP archive is ready for distribution');
        console.log('3. Users can extract and run launch.bat or launch.ps1');
        console.log('4. Node.js is required on the target system');
      } else {
        console.log('\n⚠️ Some tests failed. Please review the test report for details.');
      }
      
      return report;
    }
  }
}

// Run the beta test if this script is executed directly
if (require.main === module) {
  const tester = new SimpleBetaTester();
  tester.runAllTests().then(report => {
    process.exit(report.summary.error === 0 ? 0 : 1);
  });
}

module.exports = SimpleBetaTester; 