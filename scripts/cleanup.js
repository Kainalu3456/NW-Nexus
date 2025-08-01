const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class ProjectCleaner {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.backupDir = path.join(this.projectRoot, 'backup');
  }

  async cleanup() {
    console.log('🧹 Starting project cleanup...');
    console.log('='.repeat(50));
    
    try {
      // Create backup directory
      await this.createBackup();
      
      // Clean up files
      await this.cleanupFiles();
      
      // Clean up directories
      await this.cleanupDirectories();
      
      // Organize documentation
      await this.organizeDocumentation();
      
      // Clean up test files
      await this.cleanupTestFiles();
      
      // Clean up build artifacts
      await this.cleanupBuildArtifacts();
      
      console.log('\n✅ Project cleanup completed successfully!');
      console.log('📁 Backup created at:', this.backupDir);
      
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      throw error;
    }
  }

  async createBackup() {
    console.log('📦 Creating backup...');
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    
    // Copy important files to backup
    const filesToBackup = [
      'package.json',
      'package-lock.json',
      'README.md',
      'dist-beta',
      'out'
    ];
    
    for (const file of filesToBackup) {
      const sourcePath = path.join(this.projectRoot, file);
      const destPath = path.join(backupPath, file);
      
      if (fs.existsSync(sourcePath)) {
        await fs.copy(sourcePath, destPath);
      }
    }
    
    console.log(`✅ Backup created: ${backupPath}`);
  }

  async cleanupFiles() {
    console.log('🗑️  Cleaning up unnecessary files...');
    
    const filesToRemove = [
      'nw-buddy-scraper-beta-1.0.0-beta.2.zip',
      'electron-builder-simple.json',
      'electron-webapp-build.zip',
      'test-nwb-tab.js',
      'test-nwbuddy-fix.js',
      'test-discord-integration.js',
      'test-discord-bot.js',
      'test-discord-integration.json',
      'discord-bot-package.json',
      'fixed-discord-bot.js',
      'discord-bot-integration-example.json',
      'nwdb-debug-screenshot.png',
      'simple-beta-test-report.json'
    ];
    
    for (const file of filesToRemove) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        await fs.remove(filePath);
        console.log(`   🗑️  Removed: ${file}`);
      }
    }
  }

  async cleanupDirectories() {
    console.log('📁 Cleaning up unnecessary directories...');
    
    const dirsToRemove = [
      'standalone',
      'dist'
    ];
    
    for (const dir of dirsToRemove) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await fs.remove(dirPath);
        console.log(`   🗑️  Removed directory: ${dir}`);
      }
    }
  }

  async organizeDocumentation() {
    console.log('📚 Organizing documentation...');
    
    const docsDir = path.join(this.projectRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    
    const docsToMove = [
      { from: 'ELECTRON_FORGE_SETUP.md', to: 'docs/electron-forge-setup.md' },
      { from: 'BETA_UPDATE_SUMMARY.md', to: 'docs/beta-update-summary.md' },
      { from: 'BETA_LAUNCH_SUMMARY.md', to: 'docs/beta-launch-summary.md' },
      { from: 'BETA_README.md', to: 'docs/beta-readme.md' },
      { from: 'BETA_TEST_GUIDE.md', to: 'docs/beta-test-guide.md' },
      { from: 'ELECTRON_README.md', to: 'docs/electron-readme.md' },
      { from: 'DISCORD_BOT_INTEGRATION.md', to: 'docs/discord-bot-integration.md' }
    ];
    
    for (const doc of docsToMove) {
      const sourcePath = path.join(this.projectRoot, doc.from);
      const destPath = path.join(this.projectRoot, doc.to);
      
      if (fs.existsSync(sourcePath)) {
        await fs.move(sourcePath, destPath);
        console.log(`   📄 Moved: ${doc.from} → ${doc.to}`);
      }
    }
  }

  async cleanupTestFiles() {
    console.log('🧪 Cleaning up test files...');
    
    // Remove test files from root
    const testFiles = fs.readdirSync(this.projectRoot)
      .filter(file => file.startsWith('test-') && file.endsWith('.js'));
    
    for (const file of testFiles) {
      const filePath = path.join(this.projectRoot, file);
      await fs.remove(filePath);
      console.log(`   🗑️  Removed test file: ${file}`);
    }
  }

  async cleanupBuildArtifacts() {
    console.log('🔨 Cleaning up build artifacts...');
    
    // Clean up old build files in output directory
    const outputDir = path.join(this.projectRoot, 'output');
    if (fs.existsSync(outputDir)) {
      const oldFiles = fs.readdirSync(outputDir)
        .filter(file => file.includes('crawl-results-') || file.includes('test-results-'));
      
      for (const file of oldFiles) {
        const filePath = path.join(outputDir, file);
        await fs.remove(filePath);
        console.log(`   🗑️  Removed old output: ${file}`);
      }
    }
  }
}

// Run the cleaner if this script is executed directly
if (require.main === module) {
  const cleaner = new ProjectCleaner();
  cleaner.cleanup().then(() => {
    console.log('\n🎉 Project cleanup completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Removed unnecessary files and directories');
    console.log('✅ Organized documentation into docs/ folder');
    console.log('✅ Created backup of important files');
    console.log('✅ Cleaned up test files and build artifacts');
    console.log('\n🚀 Your project is now clean and organized!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Cleanup failed!');
    process.exit(1);
  });
}

module.exports = ProjectCleaner; 