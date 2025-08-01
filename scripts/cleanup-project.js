const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ProjectCleaner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backupPath = path.join(this.projectRoot, 'backup');
    this.docsPath = path.join(this.projectRoot, 'docs');
  }

  async cleanupProject() {
    console.log('🧹 Cleaning up project folder...');
    console.log('='.repeat(50));
    
    try {
      // Create backup of important files
      await this.createBackup();
      
      // Remove unnecessary files and directories
      await this.removeUnnecessaryFiles();
      
      // Organize documentation
      await this.organizeDocumentation();
      
      // Clean up build artifacts
      await this.cleanupBuildArtifacts();
      
      // Create final project structure
      await this.createProjectStructure();
      
      console.log('\n✅ Project cleanup completed successfully!');
      
    } catch (error) {
      console.error('❌ Failed to cleanup project:', error.message);
      throw error;
    }
  }

  async createBackup() {
    console.log('📦 Creating backup of important files...');
    
    await fs.ensureDir(this.backupPath);
    
    // Backup important files
    const filesToBackup = [
      'package.json',
      'package-lock.json',
      'README.md',
      'electron/main.js',
      'electron/renderer/index.html',
      'electron/renderer/renderer.js',
      'electron/renderer/styles.css',
      'src/crawler.js',
      'src/nwbuddy-crawler.js',
      'config/nwbuddy-config.js',
      'config/artifacts-config.js'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(this.projectRoot, file);
      const backupPath = path.join(this.backupPath, file);
      
      if (fs.existsSync(sourcePath)) {
        await fs.ensureDir(path.dirname(backupPath));
        await fs.copy(sourcePath, backupPath);
        console.log(`   ✅ Backed up: ${file}`);
      }
    }
    
    console.log('   ✅ Backup created in: backup/');
  }

  async removeUnnecessaryFiles() {
    console.log('🗑️  Removing unnecessary files...');
    
    // Files to remove
    const filesToRemove = [
      'test-discord-bot.js',
      'test-discord-integration.js',
      'test-discord-integration.json',
      'test-nwb-tab.js',
      'test-nwbuddy-fix.js',
      'nwdb-debug-screenshot.png',
      'nodemon.json',
      'electron-builder-simple.json',
      'electron-webapp-build.zip',
      'fixed-discord-bot.js',
      'discord-bot-integration-example.json',
      'discord-bot-package.json'
    ];
    
    for (const file of filesToRemove) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        await fs.remove(filePath);
        console.log(`   ✅ Removed: ${file}`);
      }
    }
    
    // Directories to remove
    const dirsToRemove = [
      'out',
      'out-fixed',
      'dist',
      'standalone',
      'NW-Buddy-Scraper-Standalone',
      'NW-Buddy-Scraper-Standalone-Folder',
      'NW-Buddy-Scraper-Simple',
      'NW-Buddy-Scraper-Simple-Folder'
    ];
    
    for (const dir of dirsToRemove) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await fs.remove(dirPath);
        console.log(`   ✅ Removed directory: ${dir}`);
      }
    }
  }

  async organizeDocumentation() {
    console.log('📚 Organizing documentation...');
    
    await fs.ensureDir(this.docsPath);
    
    // Move documentation files
    const docsToMove = [
      'DISCORD_BOT_INTEGRATION.md',
      'ELECTRON_README.md',
      'PROJECT_STRUCTURE.md'
    ];
    
    for (const doc of docsToMove) {
      const sourcePath = path.join(this.projectRoot, doc);
      const destPath = path.join(this.docsPath, doc);
      
      if (fs.existsSync(sourcePath)) {
        await fs.move(sourcePath, destPath);
        console.log(`   ✅ Moved: ${doc} → docs/`);
      }
    }
    
    // Create a main documentation index
    const docsIndex = `# NW Buddy Scraper - Documentation

## 📁 Project Structure

This project contains the following documentation:

- **DISCORD_BOT_INTEGRATION.md** - Discord bot integration guide
- **ELECTRON_README.md** - Electron application setup and usage
- **PROJECT_STRUCTURE.md** - Project structure overview

## 🚀 Quick Start

1. Install dependencies: \`npm install\`
2. Start development: \`npm start\`
3. Build standalone: \`npm run create-single-bat\`
4. Create package: \`npm run create-simple-package\`

## 📦 Distribution

The project includes scripts to create standalone distributions:

- \`npm run create-single-bat\` - Creates single batch file launcher
- \`npm run create-simple-package\` - Creates distribution package
- \`npm run create-final-package\` - Creates full distribution package

## 🔧 Development

- \`npm start\` - Start Electron application
- \`npm run package\` - Package with Electron Forge
- \`npm run make\` - Create installers with Electron Forge
`;
    
    const indexPath = path.join(this.docsPath, 'README.md');
    await fs.writeFile(indexPath, docsIndex);
    console.log('   ✅ Created documentation index');
  }

  async cleanupBuildArtifacts() {
    console.log('🧹 Cleaning up build artifacts...');
    
    // Remove old zip files
    const zipFiles = [
      'NW-Buddy-Scraper-Standalone.zip',
      'NW-Buddy-Scraper-Simple.zip'
    ];
    
    for (const zip of zipFiles) {
      const zipPath = path.join(this.projectRoot, zip);
      if (fs.existsSync(zipPath)) {
        await fs.remove(zipPath);
        console.log(`   ✅ Removed: ${zip}`);
      }
    }
    
    // Clean up old output files (keep recent ones)
    const outputPath = path.join(this.projectRoot, 'output');
    if (fs.existsSync(outputPath)) {
      const files = await fs.readdir(outputPath);
      const oldFiles = files.filter(file => {
        // Keep files from the last 7 days
        const filePath = path.join(outputPath, file);
        const stats = fs.statSync(filePath);
        const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        return daysOld > 7;
      });
      
      for (const file of oldFiles) {
        const filePath = path.join(outputPath, file);
        await fs.remove(filePath);
        console.log(`   ✅ Removed old file: ${file}`);
      }
    }
  }

  async createProjectStructure() {
    console.log('📁 Creating clean project structure...');
    
    // Create a project structure overview
    const structure = `# NW Buddy Scraper - Project Structure

## 📁 Root Directory

\`\`\`
nw-buddy-scraper/
├── assets/                    # Application assets
│   └── nwbuddy/              # NWBuddy executable and configs
├── backup/                   # Backup of important files
├── config/                   # Configuration files
│   ├── artifacts-config.js
│   ├── crafting-recipes.txt
│   └── nwbuddy-config.js
├── dist-beta/                # Beta distribution files
│   ├── START-NW-BUDDY-SCRAPER.bat
│   ├── launch-app.bat
│   ├── README.txt
│   └── win-unpacked/
├── docs/                     # Documentation
│   ├── README.md
│   ├── DISCORD_BOT_INTEGRATION.md
│   ├── ELECTRON_README.md
│   └── PROJECT_STRUCTURE.md
├── electron/                 # Electron application
│   ├── main.js
│   └── renderer/
│       ├── index.html
│       ├── renderer.js
│       └── styles.css
├── output/                   # Generated output files
│   ├── nwbuddy/
│   ├── nwdb-perks/
│   └── nwmp/
├── scripts/                  # Build and utility scripts
│   ├── build.js
│   ├── create-single-bat.js
│   ├── create-simple-package.js
│   ├── create-final-package.js
│   ├── cleanup-project.js
│   └── ...
├── src/                      # Source code
│   ├── crawler.js
│   ├── nwbuddy-crawler.js
│   ├── nwdb-perk-craftmod-scraper.js
│   ├── nwdb-perks-scraper.js
│   └── nwmp-market-scraper.js
├── package.json              # Project configuration
├── package-lock.json         # Dependency lock file
└── README.md                 # Main project README
\`\`\`

## 🚀 Quick Commands

- \`npm start\` - Start the application
- \`npm run create-single-bat\` - Create single batch file launcher
- \`npm run create-simple-package\` - Create distribution package
- \`npm run cleanup\` - Clean up project files

## 📦 Distribution

The \`dist-beta/\` folder contains the ready-to-distribute files:
- \`START-NW-BUDDY-SCRAPER.bat\` - Main launcher
- \`launch-app.bat\` - Application launcher
- \`win-unpacked/\` - Electron application files
- \`README.txt\` - User instructions
`;
    
    const structurePath = path.join(this.docsPath, 'PROJECT_STRUCTURE.md');
    await fs.writeFile(structurePath, structure);
    console.log('   ✅ Created project structure documentation');
  }
}

// Run the cleaner if this script is executed directly
if (require.main === module) {
  const cleaner = new ProjectCleaner();
  cleaner.cleanupProject().then(() => {
    console.log('\n🎉 Project cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Created backup of important files');
    console.log('✅ Removed unnecessary files and directories');
    console.log('✅ Organized documentation in docs/ folder');
    console.log('✅ Cleaned up build artifacts');
    console.log('✅ Created clean project structure');
    console.log('\n📁 Project is now clean and organized!');
    console.log('📦 Backup available in: backup/');
    console.log('📚 Documentation in: docs/');
    console.log('🚀 Ready for development and distribution!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Project cleanup failed!');
    process.exit(1);
  });
}

module.exports = ProjectCleaner; 