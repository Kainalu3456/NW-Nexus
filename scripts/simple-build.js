#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔧 Building NW Buddy Scraper (Simple Mode)...");

// Simple build without code signing
async function simpleBuild() {
  try {
    console.log("📦 Building portable executable...");
    
    // Use electron-builder with portable target (no code signing)
    const electronBuilder = spawn("npx", [
      "electron-builder",
      "--win", "portable",
      "--x64",
      "--config", "electron-builder-simple.json",
      "--publish", "never"
    ], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      shell: true,
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false"
      }
    });

    electronBuilder.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ Simple build completed successfully!`);
        console.log(`📁 Check the 'dist' folder for your portable executable.`);
        
        // Show NW Buddy info if available
        const nwbuddyPath = path.join(__dirname, "..", "assets", "nwbuddy", "nwbuddy.exe");
        if (fs.existsSync(nwbuddyPath)) {
          console.log(`🎮 NW Buddy executable available at: assets/nwbuddy/nwbuddy.exe`);
        }
      } else {
        console.log(`\n❌ Simple build failed with code ${code}`);
      }
    });

    electronBuilder.on("error", (error) => {
      console.error("❌ Failed to start simple build:", error);
    });
    
  } catch (error) {
    console.error("❌ Simple build process failed:", error);
  }
}

simpleBuild(); 