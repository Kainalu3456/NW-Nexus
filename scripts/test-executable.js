const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ExecutableTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
    this.executablePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Beta.exe');
  }

  async testExecutable() {
    console.log('🧪 Testing NW Buddy Scraper Beta Executable...');
    console.log('='.repeat(50));
    
    const tests = [
      { name: 'Executable File Exists', test: () => this.testFileExists() },
      { name: 'Executable File Size', test: () => this.testFileSize() },
      { name: 'Required Files Present', test: () => this.testRequiredFiles() },
      { name: 'Executable Permissions', test: () => this.testExecutablePermissions() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        console.log(`\n🔍 Testing: ${test.name}`);
        await test.test();
        console.log(`✅ PASSED: ${test.name}`);
        passed++;
      } catch (error) {
        console.log(`❌ FAILED: ${test.name}`);
        console.log(`   Error: ${error.message}`);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 All tests passed! The executable is ready for distribution.');
      console.log('\n📋 Next steps:');
      console.log('1. Test the executable on a clean system without Node.js');
      console.log('2. Verify auto-installation of Node.js works');
      console.log('3. Confirm the application launches successfully');
      console.log('4. Distribute to beta testers');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the issues above.');
    }

    return { passed, failed, success: failed === 0 };
  }

  testFileExists() {
    if (!fs.existsSync(this.executablePath)) {
      throw new Error(`Executable not found at: ${this.executablePath}`);
    }
  }

  testFileSize() {
    const stats = fs.statSync(this.executablePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    
    if (stats.size < 10 * 1024 * 1024) { // Less than 10MB
      throw new Error(`Executable seems too small: ${sizeMB}MB (expected >10MB)`);
    }
    
    console.log(`   📏 File size: ${sizeMB}MB`);
  }

  testRequiredFiles() {
    const requiredFiles = [
      'win-unpacked',
      'win-unpacked/package.json',
      'win-unpacked/electron',
      'win-unpacked/src',
      'win-unpacked/config',
      'win-unpacked/assets',
      'README.txt',
      'beta-info.json'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.distBetaPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    console.log(`   📁 All ${requiredFiles.length} required files present`);
  }

  testExecutablePermissions() {
    try {
      // Try to read the executable file
      fs.accessSync(this.executablePath, fs.constants.R_OK);
      console.log('   🔐 Executable is readable');
    } catch (error) {
      throw new Error(`Executable is not readable: ${error.message}`);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const tester = new ExecutableTester();
  tester.testExecutable().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = ExecutableTester; 