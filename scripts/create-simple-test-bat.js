const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class SimpleTestBatCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createSimpleTestBat() {
    console.log('🔧 Creating simple test batch file...');
    console.log('='.repeat(50));
    
    try {
      // Create the simple test batch file
      await this.createSimpleTestBatchFile();
      
      console.log('\n✅ Simple test batch file created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create simple test batch file:', error.message);
      throw error;
    }
  }

  async createSimpleTestBatchFile() {
    console.log('📝 Creating simple test batch file...');
    
    const batchContent = `@echo off
title Simple Test
color 0A

echo.
echo ============================================================
echo SIMPLE TEST BATCH FILE
echo ============================================================
echo.
echo This is a simple test to see if batch files work at all.
echo.
echo Current time: %TIME%
echo Current date: %DATE%
echo.
echo ============================================================
echo STEP 1: Basic echo test
echo ============================================================
echo.
echo This is a test message.
echo.
echo ============================================================
echo STEP 2: Directory test
echo ============================================================
echo.
echo Current directory: %CD%
echo.
echo Directory contents:
dir /b
echo.
echo ============================================================
echo STEP 3: Environment test
echo ============================================================
echo.
echo PATH: %PATH%
echo.
echo ============================================================
echo STEP 4: Pause test
echo ============================================================
echo.
echo About to pause for 5 seconds...
timeout /t 5 /nobreak
echo.
echo Pause completed!
echo.
echo ============================================================
echo STEP 5: Final pause
echo ============================================================
echo.
echo Press any key to exit...
pause >nul
echo.
echo Goodbye!
`;
    
    const batchPath = path.join(this.distBetaPath, 'SIMPLE-TEST.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Simple test batch file created:', batchPath);
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new SimpleTestBatCreator();
  creator.createSimpleTestBat().then(() => {
    console.log('\n🎉 Simple test batch file creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created simple test batch file');
    console.log('\n🚀 Your simple test batch file is ready!');
    console.log('📁 Launcher: dist-beta/SIMPLE-TEST.bat');
    console.log('\n💡 For Testing:');
    console.log('   1. Double-click SIMPLE-TEST.bat');
    console.log('   2. It should show basic information and stay open');
    console.log('   3. If this works, we know batch files are working');
    console.log('\n🎯 This will help us identify if batch files work at all!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Simple test batch file creation failed!');
    process.exit(1);
  });
}

module.exports = SimpleTestBatCreator;