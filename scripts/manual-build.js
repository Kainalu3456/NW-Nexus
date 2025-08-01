#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔧 Building NW Buddy Scraper (Manual Mode)...");

async function manualBuild() {
  try {
    console.log("📦 Creating portable package...");
    
    // First, install dependencies if needed
    console.log("📦 Installing dependencies...");
    const npmInstall = spawn("npm", ["install"], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      shell: true
    });

    npmInstall.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Dependencies installed");
        createPortablePackage();
      } else {
        console.log("❌ Failed to install dependencies");
      }
    });

  } catch (error) {
    console.error("❌ Manual build failed:", error);
  }
}

function createPortablePackage() {
  console.log("📦 Creating portable package...");
  
  const distDir = path.join(__dirname, "..", "dist");
  const portableDir = path.join(distDir, "NW Buddy Scraper");
  
  // Create dist directory
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Create portable directory
  if (!fs.existsSync(portableDir)) {
    fs.mkdirSync(portableDir, { recursive: true });
  }
  
  // Copy necessary files
  const filesToCopy = [
    "electron",
    "src", 
    "config",
    "node_modules",
    "assets",
    "package.json"
  ];
  
  filesToCopy.forEach(file => {
    const source = path.join(__dirname, "..", file);
    const dest = path.join(portableDir, file);
    
    if (fs.existsSync(source)) {
      if (fs.lstatSync(source).isDirectory()) {
        copyDirectory(source, dest);
      } else {
        fs.copyFileSync(source, dest);
      }
      console.log(`📋 Copied: ${file}`);
    }
  });
  
  // Create launcher script
  const launcherContent = `@echo off
cd /d "%~dp0"
node electron/main.js
pause`;
  
  fs.writeFileSync(path.join(portableDir, "launch.bat"), launcherContent);
  
  // Create README
  const readmeContent = `# NW Buddy Scraper - Portable Version

## How to Run:
1. Double-click "launch.bat" to start the application
2. Or run: node electron/main.js

## Features:
- Web scraper for NW Buddy sites
- Integrated NW Buddy executable
- Schedule maker and tracker
- Theme customization

## Requirements:
- Node.js installed on the system
- Internet connection for scraping

## Files:
- launch.bat - Windows launcher
- electron/ - Main application files
- assets/nwbuddy/ - NW Buddy executable
- config/ - Configuration files
`;
  
  fs.writeFileSync(path.join(portableDir, "README.txt"), readmeContent);
  
  console.log("✅ Portable package created successfully!");
  console.log(`📁 Location: ${portableDir}`);
  console.log("🚀 Run 'launch.bat' to start the application");
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

manualBuild(); 