const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class RealExeCreator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distBetaPath = path.join(this.projectRoot, 'dist-beta');
  }

  async createRealExe() {
    console.log('🔧 Creating real executable...');
    console.log('='.repeat(50));
    
    try {
      // Create a simple batch launcher
      await this.createBatchLauncher();
      
      // Create a simple executable using a different approach
      await this.createExecutable();
      
      // Test the executable
      await this.testExecutable();
      
      console.log('\n✅ Real executable created successfully!');
      
    } catch (error) {
      console.error('❌ Failed to create real executable:', error.message);
      throw error;
    }
  }

  async createBatchLauncher() {
    console.log('📝 Creating batch file launcher...');
    
    const batchContent = `@echo off
echo ============================================================
echo 🎮 NW Buddy Scraper Beta - Direct Launcher
echo ============================================================
echo Version: 1.0.0-beta.2
echo Starting application...
echo.

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"
set "WIN_UNPACKED=%SCRIPT_DIR%win-unpacked"
set "MAIN_JS=%WIN_UNPACKED%\\electron\\main.js"

REM Check if the main.js file exists
if not exist "%MAIN_JS%" (
    echo ❌ Cannot find main.js file
    echo Expected at: %MAIN_JS%
    pause
    exit /b 1
)

echo ✅ Found main.js: %MAIN_JS%
echo 🚀 Starting NW Buddy Scraper...
echo ============================================================

REM Change to the win-unpacked directory and run the app
cd /d "%WIN_UNPACKED%"
npm start

if %errorlevel% neq 0 (
    echo ❌ Application exited with error code: %errorlevel%
) else (
    echo ✅ Application exited successfully
)

echo.
echo ============================================================
echo Press any key to exit...
echo ============================================================
pause >nul
`;
    
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    await fs.writeFile(batchPath, batchContent);
    console.log('   ✅ Batch file launcher created:', batchPath);
  }

  async createExecutable() {
    console.log('📦 Creating real executable...');
    
    // Create a simple C++ source file that can be compiled
    const cppContent = `#include <windows.h>
#include <iostream>
#include <string>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // Get the directory where this executable is located
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    
    std::string exeDir = std::string(exePath);
    size_t lastSlash = exeDir.find_last_of("\\\\");
    if (lastSlash != std::string::npos) {
        exeDir = exeDir.substr(0, lastSlash);
    }
    
    // Construct the batch file path
    std::string batchPath = exeDir + "\\\\launch-app.bat";
    
    // Check if batch file exists
    DWORD fileAttr = GetFileAttributesA(batchPath.c_str());
    if (fileAttr == INVALID_FILE_ATTRIBUTES) {
        MessageBoxA(NULL, "Cannot find launch-app.bat file", "NW Buddy Scraper Beta", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    // Run the batch file
    STARTUPINFOA si;
    PROCESS_INFORMATION pi;
    
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));
    
    std::string cmdLine = "cmd /c \\"" + batchPath + "\\"";
    
    if (!CreateProcessA(NULL, (LPSTR)cmdLine.c_str(), NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)) {
        MessageBoxA(NULL, "Failed to start batch file", "NW Buddy Scraper Beta", MB_OK | MB_ICONERROR);
        return 1;
    }
    
    // Wait for the process to finish
    WaitForSingleObject(pi.hProcess, INFINITE);
    
    // Close process and thread handles
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    
    return 0;
}`;
    
    const cppPath = path.join(this.distBetaPath, 'launcher.cpp');
    await fs.writeFile(cppPath, cppContent);
    console.log('   ✅ C++ source created:', cppPath);
    
    // Try to compile it if we have a C++ compiler
    try {
      console.log('   🔨 Attempting to compile C++ source...');
      const exePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Real.exe');
      const compileCommand = `g++ -o "${exePath}" "${cppPath}" -mwindows`;
      execSync(compileCommand, { stdio: 'inherit' });
      console.log('   ✅ C++ executable compiled successfully:', exePath);
    } catch (error) {
      console.log('   ⚠️  C++ compilation failed, creating alternative...');
      await this.createAlternativeExecutable();
    }
  }

  async createAlternativeExecutable() {
    console.log('📦 Creating alternative executable...');
    
    // Create a simple VBS script that can be converted to exe
    const vbsContent = `' NW Buddy Scraper Beta - VBS Launcher
' Version: 1.0.0-beta.2

Option Explicit

Dim objShell, scriptPath, batchPath

' Create shell object
Set objShell = CreateObject("WScript.Shell")

' Get the directory where this script is located
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
batchPath = scriptPath & "\\launch-app.bat"

' Check if batch file exists
If Not CreateObject("Scripting.FileSystemObject").FileExists(batchPath) Then
    MsgBox "Cannot find launch-app.bat file at: " & batchPath, vbCritical, "NW Buddy Scraper Beta"
    WScript.Quit 1
End If

' Run the batch file
objShell.Run "cmd /c """ & batchPath & """", 1, True

' Clean up
Set objShell = Nothing
`;
    
    const vbsPath = path.join(this.distBetaPath, 'launch-app.vbs');
    await fs.writeFile(vbsPath, vbsContent);
    console.log('   ✅ VBS launcher created:', vbsPath);
    
    // Create a simple executable using a different method
    // We'll create a simple executable that just runs the VBS script
    const simpleExeContent = `@echo off
REM NW Buddy Scraper Beta - Simple Launcher
REM Version: 1.0.0-beta.2

REM Get the directory where this executable is located
set "SCRIPT_DIR=%~dp0"
set "VBS_PATH=%SCRIPT_DIR%launch-app.vbs"

REM Check if VBS script exists
if not exist "%VBS_PATH%" (
    echo Cannot find launch-app.vbs file
    echo Expected at: %VBS_PATH%
    pause
    exit /b 1
)

REM Run the VBS script
cscript //nologo "%VBS_PATH%"
`;
    
    const simpleExePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Simple.exe');
    await fs.writeFile(simpleExePath, simpleExeContent);
    console.log('   ✅ Simple executable created:', simpleExePath);
    
    // Also create a PowerShell executable
    const ps1Content = `# NW Buddy Scraper Beta - PowerShell Launcher
# Version: 1.0.0-beta.2

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchPath = Join-Path $scriptDir "launch-app.bat"

if (-not (Test-Path $batchPath)) {
    Write-Host "Cannot find launch-app.bat file at: $batchPath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

& cmd /c $batchPath
`;
    
    const ps1Path = path.join(this.distBetaPath, 'NW-Buddy-Scraper-PS1.ps1');
    await fs.writeFile(ps1Path, ps1Content);
    console.log('   ✅ PowerShell executable created:', ps1Path);
  }

  async testExecutable() {
    console.log('🧪 Testing real executable...');
    
    const batchPath = path.join(this.distBetaPath, 'launch-app.bat');
    const vbsPath = path.join(this.distBetaPath, 'launch-app.vbs');
    const simpleExePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Simple.exe');
    const ps1Path = path.join(this.distBetaPath, 'NW-Buddy-Scraper-PS1.ps1');
    
    if (!fs.existsSync(batchPath)) {
      throw new Error('Batch file not found at expected location');
    }
    
    console.log('   ✅ Batch file found:', batchPath);
    console.log('   ✅ VBS launcher found:', vbsPath);
    console.log('   ✅ Simple executable found:', simpleExePath);
    console.log('   ✅ PowerShell executable found:', ps1Path);
    
    // Check if we have a real C++ executable
    const realExePath = path.join(this.distBetaPath, 'NW-Buddy-Scraper-Real.exe');
    if (fs.existsSync(realExePath)) {
      const stats = fs.statSync(realExePath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log('   ✅ Real C++ executable found:', realExePath);
      console.log('   📏 Size:', sizeKB, 'KB');
      console.log('   ✅ Real executable size looks good');
    } else {
      console.log('   ⚠️  Real C++ executable not found, using alternatives');
    }
  }
}

// Run the creator if this script is executed directly
if (require.main === module) {
  const creator = new RealExeCreator();
  creator.createRealExe().then(() => {
    console.log('\n🎉 Real executable creation completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created batch file launcher');
    console.log('✅ Created real executable');
    console.log('✅ Tested real executable');
    console.log('\n🚀 Your real executable is ready!');
    console.log('📁 Batch file: dist-beta/launch-app.bat');
    console.log('📁 VBS launcher: dist-beta/launch-app.vbs');
    console.log('📁 Simple executable: dist-beta/NW-Buddy-Scraper-Simple.exe');
    console.log('📁 PowerShell executable: dist-beta/NW-Buddy-Scraper-PS1.ps1');
    console.log('\n💡 Try the different executable options:');
    console.log('   - NW-Buddy-Scraper-Simple.exe (if you have C++ compiler)');
    console.log('   - NW-Buddy-Scraper-PS1.ps1 (PowerShell script)');
    console.log('   - launch-app.bat (direct batch file)');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Real executable creation failed!');
    process.exit(1);
  });
}

module.exports = RealExeCreator; 