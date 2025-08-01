#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🚀 Starting NW Buddy Scraper in development mode...");

// Start Electron with development flags
const electron = spawn("node", [path.join(__dirname, "..", "node_modules", "electron", "cli.js"), ".", "--dev"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
  shell: true,
});

electron.on("close", (code) => {
  console.log(`\n🔚 Electron exited with code ${code}`);
});

electron.on("error", (error) => {
  console.error("❌ Failed to start Electron:", error);
  process.exit(1);
});
