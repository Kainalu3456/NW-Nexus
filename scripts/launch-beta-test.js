#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🚀 NW Buddy Scraper - Beta Test Launcher');
console.log('==========================================\n');

async function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed: ${error.message}\n`);
    return false;
  }
}

async function main() {
  console.log('This script will:');
  console.log('1. Build the standalone application');
  console.log('2. Run comprehensive beta tests');
  console.log('3. Generate a test report');
  console.log('4. Create the final beta package\n');

  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    console.error('❌ Error: package.json not found. Please run this script from the project root.');
    process.exit(1);
  }

  // Step 1: Build standalone application
  const buildSuccess = await runCommand('npm run build-standalone', 'Building standalone application');
  if (!buildSuccess) {
    console.error('❌ Build failed. Cannot proceed with beta testing.');
    process.exit(1);
  }

  // Step 2: Run beta tests
  const testSuccess = await runCommand('npm run beta-test', 'Running beta tests');
  if (!testSuccess) {
    console.warn('⚠️ Some tests failed. Review the test report for details.');
  }

  // Step 3: Check results
  const testReportPath = path.join(__dirname, '..', 'beta-test-report.json');
  if (await fs.pathExists(testReportPath)) {
    try {
      const report = await fs.readJson(testReportPath);
      console.log('📊 Beta Test Results:');
      console.log(`   Total Tests: ${report.summary.total}`);
      console.log(`   ✅ Passed: ${report.summary.success}`);
      console.log(`   ❌ Failed: ${report.summary.error}`);
      console.log(`   ⚠️ Warnings: ${report.summary.warning}`);
      console.log(`   ⏱️ Duration: ${Math.round(report.duration / 1000)}s\n`);

      if (report.summary.error === 0) {
        console.log('🎉 All tests passed! The standalone application is ready for beta testing.');
      } else {
        console.log('⚠️ Some tests failed. Please review the test report before proceeding.');
      }
    } catch (error) {
      console.error('❌ Could not read test report:', error.message);
    }
  }

  // Step 4: Show next steps
  console.log('\n📋 Next Steps:');
  console.log('1. Check the standalone/ directory for the built application');
  console.log('2. Review BETA_TEST_GUIDE.md for testing instructions');
  console.log('3. Run the application and test all features');
  console.log('4. Report any issues found during testing');
  console.log('5. Provide feedback on the user experience\n');

  // Check if standalone package was created
  const standalonePath = path.join(__dirname, '..', 'standalone');
  if (await fs.pathExists(standalonePath)) {
    const contents = await fs.readdir(standalonePath);
    if (contents.length > 0) {
      console.log('📦 Standalone packages created:');
      contents.forEach(item => {
        console.log(`   - ${item}`);
      });
    }
  }

  console.log('\n🎯 Beta test setup complete!');
  console.log('Happy testing! 🚀');
}

// Run the launcher
main().catch(error => {
  console.error('❌ Launcher failed:', error);
  process.exit(1);
}); 