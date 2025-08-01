#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

console.log("🧪 Testing build process...");

// Test npm availability
async function testNpm() {
  return new Promise((resolve) => {
    const npm = spawn("npm", ["--version"], {
      stdio: "pipe",
      shell: true
    });
    
    npm.on("close", (code) => {
      if (code === 0) {
        console.log("✅ npm is available");
        resolve(true);
      } else {
        console.log("❌ npm is not available");
        resolve(false);
      }
    });
    
    npm.on("error", () => {
      console.log("❌ npm is not available");
      resolve(false);
    });
  });
}

// Test Node.js availability
async function testNode() {
  return new Promise((resolve) => {
    const node = spawn("node", ["--version"], {
      stdio: "pipe",
      shell: true
    });
    
    node.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Node.js is available");
        resolve(true);
      } else {
        console.log("❌ Node.js is not available");
        resolve(false);
      }
    });
    
    node.on("error", () => {
      console.log("❌ Node.js is not available");
      resolve(false);
    });
  });
}

// Test curl availability
async function testCurl() {
  return new Promise((resolve) => {
    const curl = spawn("curl", ["--version"], {
      stdio: "pipe",
      shell: true
    });
    
    curl.on("close", (code) => {
      if (code === 0) {
        console.log("✅ curl is available");
        resolve(true);
      } else {
        console.log("⚠️ curl is not available (will use Node.js download)");
        resolve(false);
      }
    });
    
    curl.on("error", () => {
      console.log("⚠️ curl is not available (will use Node.js download)");
      resolve(false);
    });
  });
}

// Main test function
async function runTests() {
  console.log("🔍 Checking system requirements...\n");
  
  const npmOk = await testNpm();
  const nodeOk = await testNode();
  const curlOk = await testCurl();
  
  console.log("\n📊 Test Results:");
  console.log(`- npm: ${npmOk ? '✅' : '❌'}`);
  console.log(`- Node.js: ${nodeOk ? '✅' : '❌'}`);
  console.log(`- curl: ${curlOk ? '✅' : '⚠️'}`);
  
  if (!npmOk || !nodeOk) {
    console.log("\n❌ Build requirements not met!");
    console.log("💡 Please install Node.js and npm:");
    console.log("   https://nodejs.org/");
    process.exit(1);
  }
  
  console.log("\n✅ All required tools are available!");
  console.log("🚀 You can now run: npm run build-with-nwbuddy");
}

runTests().catch(console.error); 