#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const NWBuddyDownloader = require("./download-nwbuddy.js");

console.log("🔧 Building NW Buddy Scraper for distribution...");

// Get build target from command line args
const args = process.argv.slice(2);
const target = args[0] || "all";
const skipDownload = args.includes("--skip-download");

let buildCommand = [];
switch (target) {
  case "windows":
  case "win":
    buildCommand = ["run", "build-portable-win"];
    break;
  case "mac":
  case "macos":
    buildCommand = ["run", "build-electron-mac"];
    break;
  case "all":
  default:
    buildCommand = ["run", "build-portable"];
    break;
}

console.log(`📦 Building for: ${target}`);

// Download NW Buddy if not skipped
async function downloadNWBuddy() {
  if (skipDownload) {
    console.log("⏭️ Skipping NW Buddy download (--skip-download flag)");
    return;
  }

  console.log("📥 Downloading latest NW Buddy executable...");
  const downloader = new NWBuddyDownloader();
  const result = await downloader.checkForUpdates();
  
  if (result.success) {
    if (result.upToDate) {
      console.log(`✅ NW Buddy is up to date (v${result.version})`);
    } else {
      console.log(`✅ NW Buddy updated to v${result.version}`);
    }
  } else {
    console.log(`⚠️ NW Buddy download failed: ${result.error}`);
    console.log("📦 Continuing with build without NW Buddy...");
  }
}

// Check if npm is available
async function checkNpmAvailability() {
  return new Promise((resolve) => {
    const { spawn } = require("child_process");
    const npmCheck = spawn("npm", ["--version"], {
      stdio: "pipe",
      shell: true
    });
    
    npmCheck.on("close", (code) => {
      resolve(code === 0);
    });
    
    npmCheck.on("error", () => {
      resolve(false);
    });
  });
}

// Main build process
async function build() {
  try {
    // Download NW Buddy first
    await downloadNWBuddy();
    
    console.log("🚀 Starting Electron build...");
    
    // Check if npm is available
    const npmAvailable = await checkNpmAvailability();
    if (!npmAvailable) {
      console.error("❌ npm is not available in PATH. Please ensure Node.js and npm are installed.");
      console.log("💡 Try running: npm --version to check if npm is accessible");
      process.exit(1);
    }
    
    // Start the build process
    const npm = spawn("npm", buildCommand, {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      shell: true, // Use shell to find npm in PATH
      env: { ...process.env } // Pass through environment variables
    });

    npm.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ Build completed successfully!`);
        console.log(`📁 Check the 'dist' folder for your built application.`);
        
        // Show NW Buddy info if available
        const nwbuddyPath = path.join(__dirname, "..", "assets", "nwbuddy", "nwbuddy.exe");
        if (require("fs").existsSync(nwbuddyPath)) {
          console.log(`🎮 NW Buddy executable available at: assets/nwbuddy/nwbuddy.exe`);
        }
        
        // Exit successfully
        process.exit(0);
      } else {
        console.log(`\n❌ Build failed with code ${code}`);
        process.exit(code);
      }
    });

    npm.on("error", (error) => {
      console.error("❌ Failed to start build:", error);
      console.log("💡 Make sure npm is installed and accessible in your PATH");
      process.exit(1);
    });
    
  } catch (error) {
    console.error("❌ Build process failed:", error);
    process.exit(1);
  }
}

build();
