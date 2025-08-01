#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class NWBuddyDownloader {
  constructor() {
    this.githubApi = 'https://api.github.com/repos/giniedp/nw-buddy/releases/latest';
    this.downloadDir = path.join(__dirname, '..', 'assets', 'nwbuddy');
    this.ensureDownloadDir();
  }

  ensureDownloadDir() {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  async getLatestRelease() {
    return new Promise((resolve, reject) => {
      https.get(this.githubApi, {
        headers: {
          'User-Agent': 'NW-Buddy-Scraper/1.0.0'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const release = JSON.parse(data);
            resolve(release);
          } catch (error) {
            reject(new Error(`Failed to parse release data: ${error.message}`));
          }
        });
      }).on('error', reject);
    });
  }

  async downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.downloadDir, filename);
      const file = fs.createWriteStream(filePath);
      
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        followRedirect: true,
        maxRedirects: 5
      }, (res) => {
        // Handle redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          const location = res.headers.location;
          if (location) {
            console.log(`🔄 Following redirect to: ${location}`);
            file.close();
            fs.unlink(filePath, () => {}); // Clean up partial file
            this.downloadFile(location, filename).then(resolve).catch(reject);
            return;
          }
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status: ${res.statusCode}`));
          return;
        }

        const totalSize = parseInt(res.headers['content-length'], 10);
        let downloadedSize = 0;

        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0) {
            const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
            process.stdout.write(`\r📥 Downloading ${filename}: ${progress}%`);
          } else {
            process.stdout.write(`\r📥 Downloading ${filename}: ${(downloadedSize / 1024 / 1024).toFixed(1)} MB`);
          }
        });

        res.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`\n✅ Downloaded: ${filename}`);
          resolve(filePath);
        });

        file.on('error', (error) => {
          fs.unlink(filePath, () => {}); // Delete the file if download failed
          reject(error);
        });
      });
      
      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  async findWindowsAsset(release) {
    const assets = release.assets || [];
    const windowsAsset = assets.find(asset => 
      asset.name.includes('.exe') || 
      asset.name.includes('win') || 
      asset.name.includes('windows')
    );
    
    if (!windowsAsset) {
      throw new Error('No Windows executable found in latest release');
    }
    
    return windowsAsset;
  }

  async downloadWithFallback(url, filename) {
    try {
      return await this.downloadFile(url, filename);
    } catch (error) {
      console.log(`⚠️ Primary download failed: ${error.message}`);
      console.log('🔄 Trying alternative download method...');
      
      // Try using curl if available (Windows 10+ has curl)
      return await this.downloadWithCurl(url, filename);
    }
  }

  async downloadWithCurl(url, filename) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.downloadDir, filename);
      const { spawn } = require('child_process');
      
      const curl = spawn('curl', [
        '-L', // Follow redirects
        '-o', filePath,
        '--progress-bar',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        url
      ], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      curl.stdout.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      
      curl.stderr.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      
      curl.on('close', (code) => {
        if (code === 0) {
          console.log(`\n✅ Downloaded with curl: ${filename}`);
          resolve(filePath);
        } else {
          reject(new Error(`Curl download failed with code ${code}`));
        }
      });
      
      curl.on('error', (error) => {
        reject(new Error(`Curl not available: ${error.message}`));
      });
    });
  }

  async downloadNWBuddy() {
    try {
      console.log('🔍 Checking for latest NW Buddy release...');
      
      const release = await this.getLatestRelease();
      console.log(`📦 Found release: ${release.tag_name} - ${release.name}`);
      
      const windowsAsset = await this.findWindowsAsset(release);
      console.log(`💾 Found asset: ${windowsAsset.name} (${(windowsAsset.size / 1024 / 1024).toFixed(1)} MB)`);
      
      const filename = `nwbuddy-${release.tag_name}.exe`;
      const filePath = await this.downloadWithFallback(windowsAsset.browser_download_url, filename);
      
      // Create a symlink or copy for easy access
      const symlinkPath = path.join(this.downloadDir, 'nwbuddy.exe');
      try {
        if (fs.existsSync(symlinkPath)) {
          fs.unlinkSync(symlinkPath);
        }
        fs.symlinkSync(filename, symlinkPath);
        console.log('🔗 Created symlink: nwbuddy.exe');
      } catch (error) {
        // If symlink fails, just copy the file
        fs.copyFileSync(filePath, symlinkPath);
        console.log('📋 Copied file: nwbuddy.exe');
      }
      
      // Create a version info file
      const versionInfo = {
        version: release.tag_name,
        name: release.name,
        published_at: release.published_at,
        download_url: windowsAsset.browser_download_url,
        local_path: filePath,
        size: windowsAsset.size
      };
      
      fs.writeFileSync(
        path.join(this.downloadDir, 'version.json'),
        JSON.stringify(versionInfo, null, 2)
      );
      
      console.log('📝 Version info saved');
      
      return {
        success: true,
        filePath: symlinkPath,
        version: release.tag_name,
        size: windowsAsset.size
      };
      
    } catch (error) {
      console.error('❌ Failed to download NW Buddy:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkForUpdates() {
    try {
      const versionPath = path.join(this.downloadDir, 'version.json');
      if (!fs.existsSync(versionPath)) {
        console.log('🆕 No local version found, downloading...');
        return await this.downloadNWBuddy();
      }

      const localVersion = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      console.log(`📋 Local version: ${localVersion.version}`);

      const release = await this.getLatestRelease();
      console.log(`🌐 Latest version: ${release.tag_name}`);

      if (release.tag_name !== localVersion.version) {
        console.log('🔄 Update available, downloading...');
        return await this.downloadNWBuddy();
      } else {
        console.log('✅ Already up to date');
        return {
          success: true,
          filePath: path.join(this.downloadDir, 'nwbuddy.exe'),
          version: localVersion.version,
          upToDate: true
        };
      }
    } catch (error) {
      console.error('❌ Failed to check for updates:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';

  const downloader = new NWBuddyDownloader();

  switch (command) {
    case 'download':
    case 'force':
      console.log('📥 Force downloading NW Buddy...');
      await downloader.downloadNWBuddy();
      break;
      
    case 'check':
    case 'update':
    default:
      console.log('🔍 Checking for NW Buddy updates...');
      await downloader.checkForUpdates();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = NWBuddyDownloader; 