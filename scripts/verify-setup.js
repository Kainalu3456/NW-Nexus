#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

console.log("🔍 Verifying NW Buddy Scraper Electron App Setup...\n");

const requiredFiles = [
  "package.json",
  "electron/main.js",
  "electron/renderer/index.html",
  "electron/renderer/styles.css",
  "electron/renderer/renderer.js",
  "src/crawler.js",
  "scripts/dev.js",
  "scripts/build.js",
];

const requiredDirectories = [
  "electron",
  "electron/renderer",
  "electron/assets",
  "src",
  "scripts",
];

let allGood = true;

// Check directories
console.log("📁 Checking required directories...");
requiredDirectories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`  ✅ ${dir}`);
  } else {
    console.log(`  ❌ ${dir} - MISSING`);
    allGood = false;
  }
});

console.log("\n📄 Checking required files...");
requiredFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check package.json scripts
console.log("\n⚙️ Checking package.json scripts...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const requiredScripts = [
    "electron",
    "electron-dev",
    "build",
    "build-win",
    "build-mac",
    "build-all",
  ];

  requiredScripts.forEach((script) => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`  ❌ ${script} - MISSING`);
      allGood = false;
    }
  });
} catch (error) {
  console.log("  ❌ Error reading package.json:", error.message);
  allGood = false;
}

// Check dependencies
console.log("\n📦 Checking key dependencies...");
try {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const keyDeps = ["puppeteer", "fs-extra"];
  const keyDevDeps = ["electron", "electron-builder"];

  keyDeps.forEach((dep) => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - MISSING`);
      allGood = false;
    }
  });

  keyDevDeps.forEach((dep) => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`  ✅ ${dep}: ${packageJson.devDependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - MISSING`);
      allGood = false;
    }
  });
} catch (error) {
  console.log("  ❌ Error checking dependencies:", error.message);
  allGood = false;
}

console.log("\n" + "=".repeat(50));
if (allGood) {
  console.log("✅ ALL CHECKS PASSED!");
  console.log("\nYour NW Buddy Scraper Electron App is ready to use!");
  console.log("\nNext steps:");
  console.log('1. Run "npm run electron-dev" to test the app');
  console.log('2. Run "npm run build-all" to build for distribution');
  console.log("3. Check the ELECTRON_README.md for detailed instructions");
} else {
  console.log("❌ SOME CHECKS FAILED!");
  console.log("\nPlease fix the missing files/directories before proceeding.");
}

console.log("\n�� Happy scraping!");
