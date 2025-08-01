const { app, BrowserWindow, ipcMain, dialog, shell, BrowserView } = require("electron");
const path = require("path");
const NWBuddyCrawler = require("../src/nwbuddy-crawler");
const NWMPMarketScraper = require("../src/nwmp-market-scraper");
const fs = require("fs-extra");
const { spawn } = require("child_process");

// Handle Squirrel.Windows events
if (require('electron-squirrel-startup')) app.quit();

let mainWindow;
let nwbuddyView = null;
let nwbuddyWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      // Add session configuration to avoid quota errors
      session: require('electron').session.fromPartition('persist:main'),
    },
    icon: path.join(__dirname, "assets", "icon.png"), // Add icon later
    title: "NW Nexus",
    show: false, // Don't show until ready
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Show window when ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle window resize to keep BrowserView properly sized
  mainWindow.on("resize", () => {
    if (nwbuddyView && mainWindow.getBrowserViews().includes(nwbuddyView)) {
      const windowBounds = mainWindow.getBounds();
      const tabBarHeight = 50;
      const margin = 50; // 50px margin on each side
      const maxWidth = 800; // Maximum width of 800px
      const maxHeight = 600; // Maximum height of 600px
      
      // Calculate the actual width and height
      const availableWidth = windowBounds.width - (margin * 2);
      const availableHeight = windowBounds.height - tabBarHeight - 20; // 20px bottom margin
      
      const width = Math.min(availableWidth, maxWidth);
      const height = Math.min(availableHeight, maxHeight);
      
      // Center the view horizontally using absolute coordinates
      const x = margin + (availableWidth - width) / 2;
      
      nwbuddyView.setBounds({
        x: x,
        y: tabBarHeight + 20, // 20px top margin
        width: width,
        height: height
      });
    }
  });

  // Disable scrolling in the main window when BrowserView is active
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      // Disable scrolling when BrowserView is active
      document.addEventListener('scroll', function(e) {
        if (window.nwbuddyViewActive) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, { passive: false });
    `);
  });

  // DevTools can be opened manually with Ctrl+Shift+I or Cmd+Opt+I
  // Uncomment the line below if you want DevTools to auto-open in development
  // if (process.argv.includes("--dev")) {
  //   mainWindow.webContents.openDevTools();
  // }
}

// Function to create NW Buddy BrowserView
async function createNWBuddyView() {
  console.log('Creating NW Buddy BrowserView...');
  
  if (nwbuddyView) {
    console.log('Removing existing NW Buddy view...');
    mainWindow.removeBrowserView(nwbuddyView);
    nwbuddyView = null;
  }

  // Create a new BrowserView for NW Buddy
  console.log('Creating new BrowserView...');
  nwbuddyView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // Add session configuration to avoid quota errors
      session: require('electron').session.fromPartition('persist:nwbuddy'),
    }
  });

  // Disable scrolling in the BrowserView
  nwbuddyView.webContents.on('dom-ready', () => {
    nwbuddyView.webContents.executeJavaScript(`
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    `);
  });

  // Add event listeners for debugging
  nwbuddyView.webContents.on('did-start-loading', () => {
    console.log('NW Buddy: Started loading...');
  });

  nwbuddyView.webContents.on('did-finish-load', () => {
    console.log('NW Buddy: Finished loading successfully');
  });

  nwbuddyView.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('NW Buddy: Failed to load:', errorCode, errorDescription, validatedURL);
  });

  nwbuddyView.webContents.on('dom-ready', () => {
    console.log('NW Buddy: DOM is ready');
  });

  // Load the NW Buddy web application directly
  console.log('Loading URL: https://www.nw-buddy.de/');
  
  // Handle quota database errors for the BrowserView session
  const session = nwbuddyView.webContents.session;
  session.on('will-download', (event, item, webContents) => {
    console.log('NW Buddy download started:', item.getFilename());
  });
  
  // Set up error handling for the session
  session.on('preconnect', (event, url, allowCredentials) => {
    console.log('NW Buddy preconnect to:', url);
  });
  
  // Load the URL with error handling
  try {
    await nwbuddyView.webContents.loadURL('https://www.nw-buddy.de/');
  } catch (error) {
    console.error('Failed to load NW Buddy URL:', error);
  }

  return nwbuddyView;
}

// Function to create a dedicated NW Buddy window
function createNWBuddyWindow() {
  console.log('Creating dedicated NW Buddy window...');
  
  if (nwbuddyWindow) {
    console.log('Closing existing NW Buddy window...');
    nwbuddyWindow.close();
    nwbuddyWindow = null;
  }

  // Create a new window for NW Buddy
  nwbuddyWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'NW Buddy Web App',
    icon: path.join(__dirname, "assets", "icon.png"),
    alwaysOnTop: true, // Keep window on top
    resizable: true,
    minimizable: true,
    maximizable: false, // Prevent maximizing to keep size manageable
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      // Add session configuration to avoid quota errors
      session: require('electron').session.fromPartition('persist:nwbuddy-window'),
    },
    show: false, // Don't show until ready
  });

  // Load the NW Buddy web application
  console.log('Loading NW Buddy in dedicated window...');
  nwbuddyWindow.loadURL('https://www.nw-buddy.de/');

  // Show window when ready
  nwbuddyWindow.once('ready-to-show', () => {
    console.log('NW Buddy window ready to show');
    nwbuddyWindow.show();
    nwbuddyWindow.focus();
  });

  // Handle window closed
  nwbuddyWindow.on('closed', () => {
    console.log('NW Buddy window closed');
    nwbuddyWindow = null;
  });

  // Add event listeners for debugging
  nwbuddyWindow.webContents.on('did-start-loading', () => {
    console.log('NW Buddy Window: Started loading...');
  });

  nwbuddyWindow.webContents.on('did-finish-load', () => {
    console.log('NW Buddy Window: Finished loading successfully');
  });

  nwbuddyWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('NW Buddy Window: Failed to load:', errorCode, errorDescription, validatedURL);
  });

  nwbuddyWindow.webContents.on('dom-ready', () => {
    console.log('NW Buddy Window: DOM is ready');
  });

  return nwbuddyWindow;
}

// Function to show/hide NW Buddy view
function toggleNWBuddyView(show) {
  console.log(`toggleNWBuddyView called with show=${show}`);
  
  if (!mainWindow) {
    console.log('No main window available');
    return;
  }

  if (show && nwbuddyView) {
    console.log('Showing NW Buddy view...');
    
    // Get the main window bounds
    const bounds = mainWindow.getBounds();
    console.log('Window bounds:', bounds);
    
    // Calculate content area (accounting for window decorations)
    const contentBounds = mainWindow.getContentBounds();
    console.log('Content bounds:', contentBounds);
    
    // Calculate the tab bar height (approximately 50px)
    const tabBarHeight = 50;
    
    // Position the BrowserView in a box with margins (similar to UI sections)
    const windowBounds = mainWindow.getBounds();
    
    // Calculate margins and box size - make it much smaller
    const margin = 120; // 120px margin on each side
    const maxWidth = 600; // Much smaller maximum width
    const maxHeight = 500; // Much smaller maximum height
    
    // Calculate the content area (below the tab bar and UI elements)
    const contentAreaY = tabBarHeight + 100; // 100px below tabs to avoid covering UI
    const contentAreaHeight = windowBounds.height - contentAreaY - 20; // 20px bottom margin
    
    // Calculate the actual box size
    const availableWidth = windowBounds.width - (margin * 2);
    const availableHeight = contentAreaHeight;
    
    const width = Math.min(availableWidth, maxWidth);
    const height = Math.min(availableHeight, maxHeight);
    
    // Center the box horizontally
    const x = margin + (availableWidth - width) / 2;
    
    // Set the BrowserView to be in a centered box
    nwbuddyView.setBounds({
      x: x,
      y: contentAreaY,
      width: width,
      height: height
    });
    
    // Disable auto-resize to keep it fixed
    nwbuddyView.setAutoResize({ width: false, height: false });
    
    // Set background color to match the UI
    nwbuddyView.setBackgroundColor('#1a1a1a');
    
    // Set the BrowserView to be fixed in position (not affected by scrolling)
    nwbuddyView.setAutoResize({
      width: false,
      height: false
    });

    // Store the fixed position for reference
    nwbuddyView.fixedPosition = {
      x: x,
      y: contentAreaY,
      width: width,
      height: height
    };
    
    console.log('Adding BrowserView to main window...');
    mainWindow.addBrowserView(nwbuddyView);
    nwbuddyView.webContents.focus();
    
    // Don't hide the main content - let it show behind the BrowserView
    mainWindow.webContents.executeJavaScript(`
      window.nwbuddyViewActive = true;
      // Add a subtle background indicator
      const body = document.body;
      if (body) {
        body.style.background = 'linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%)';
      }
    `);
    
    console.log('NW Buddy view should now be visible');
  } else if (nwbuddyView) {
    console.log('Hiding NW Buddy view...');
    mainWindow.removeBrowserView(nwbuddyView);
    
    // Reset background when hiding
    mainWindow.webContents.executeJavaScript(`
      window.nwbuddyViewActive = false;
      // Reset background
      const body = document.body;
      if (body) {
        body.style.background = '';
      }
    `);
  } else {
    console.log('No NW Buddy view available to show/hide');
  }
}

// Suppress quota database errors
process.on('uncaughtException', (error) => {
  if (error.message && error.message.includes('quota_database')) {
    console.warn('Suppressed quota database error:', error.message);
    return;
  }
  console.error('Uncaught exception:', error);
});

// Configure app paths and handle database errors
app.on('ready', () => {
  // Set up proper user data path to avoid quota database errors
  const userDataPath = app.getPath('userData');
  console.log('User data path:', userDataPath);
  
  // Ensure the user data directory exists
  try {
    fs.ensureDirSync(userDataPath);
  } catch (error) {
    console.warn('Could not ensure user data directory:', error.message);
  }
  
  // Set up proper session configuration to avoid quota errors
  const session = require('electron').session.defaultSession;
  
  // Configure session to use proper storage paths
  session.setPreloads([]);
  
  // Handle session errors
  session.on('will-download', (event, item, webContents) => {
    console.log('Download started:', item.getFilename());
  });
  
  session.on('preconnect', (event, url, allowCredentials) => {
    console.log('Preconnect to:', url);
  });
  
  // Create the main window
  createWindow();
  
  console.log("NW Buddy Scraper is ready");
  setupDiscordBotIntegration(); // Call setup when app is ready
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for crawler functionality
ipcMain.handle("crawl-url", async (event, url, includeMarketPrices = false, serverId = 'valhalla') => {
  let crawler = null;
  try {
    console.log("Starting crawl for:", url);
    if (includeMarketPrices) {
      console.log(`Market prices enabled for server: ${serverId}`);
    }

    // Create a temporary config with the provided URL
    const tempConfig = {
      urls: [url],
      crawlerOptions: {
        headless: true,
        waitForTimeout: 10000,
        timeout: 60000,
      },
      rateLimit: {
        delayBetweenRequests: 0,
      },
      errorHandling: {
        continueOnError: false,
      },
      output: {
        saveDirectory: "output/nwbuddy",
      },
    };

    crawler = new NWBuddyCrawler(tempConfig);
    await crawler.initialize();
    const result = await crawler.crawlNWBuddyPage(url, includeMarketPrices, serverId);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Crawl error:", error);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    if (crawler) {
      try {
        await crawler.close();
      } catch (closeError) {
        console.error("Error closing crawler:", closeError);
      }
    }
  }
});

// IPC handler for fetching market prices only
ipcMain.handle("fetch-market-prices", async (event, serverId = 'valhalla') => {
  let marketScraper = null;
  try {
    console.log(`Fetching market prices for server: ${serverId}`);
    
    marketScraper = new NWMPMarketScraper();
    await marketScraper.initialize();
    
    const results = await marketScraper.fetchMarketPrices(serverId);
    
    return {
      success: true,
      data: results,
    };
  } catch (error) {
    console.error("Market price fetch error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// IPC handler for getting available servers
ipcMain.handle("get-servers", async (event) => {
  let marketScraper = null;
  try {
    marketScraper = new NWMPMarketScraper();
    await marketScraper.initialize();
    
    const servers = await marketScraper.getServers();
    
    return {
      success: true,
      data: servers,
    };
  } catch (error) {
    console.error("Server fetch error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

ipcMain.handle("show-save-dialog", async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `nwbuddy-results-${
      new Date().toISOString().split("T")[0]
    }.json`,
    filters: [
      { name: "JSON Files", extensions: ["json"] },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled) {
    await fs.writeJson(result.filePath, data, { spaces: 2 });
    return { success: true, path: result.filePath };
  }

  return { success: false };
});

const MARKET_PRICES_PATH = path.join(__dirname, "..", "output", "market-prices.json");

ipcMain.handle("save-market-prices", async (event, prices) => {
  try {
    await fs.ensureDir(path.dirname(MARKET_PRICES_PATH));
    await fs.writeJson(MARKET_PRICES_PATH, prices, { spaces: 2 });
    return { success: true };
  } catch (error) {
    console.error("Failed to save market prices:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("load-market-prices", async (event) => {
  try {
    if (await fs.pathExists(MARKET_PRICES_PATH)) {
      const prices = await fs.readJson(MARKET_PRICES_PATH);
      return { success: true, prices };
    } else {
      return { success: false, error: "No saved prices found." };
    }
  } catch (error) {
    console.error("Failed to load market prices:", error);
    return { success: false, error: error.message };
  }
});

// IPC handler for calculating crafting costs
ipcMain.handle("calculate-crafting-costs", async (event, gearData, prices) => {
  try {
    const marketScraper = new NWMPMarketScraper();
    const costs = await marketScraper.calculateCraftingCosts(gearData, prices);
    return { success: true, data: costs };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add Discord bot integration
const discordBotPath = 'C:\\nw-buddy-discord-bot';
const discordDataFile = path.join(discordBotPath, 'schedule-data.json');

// Watch for Discord bot data changes
function setupDiscordBotIntegration() {
  // Check if Discord bot directory exists
  if (fs.existsSync(discordBotPath)) {
    console.log('Discord bot directory found, setting up file watcher...');
    
    // Watch for changes in the Discord bot data file
    if (fs.existsSync(discordDataFile)) {
      fs.watchFile(discordDataFile, { interval: 5000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          console.log('Discord bot data file updated, reading new data...');
          readDiscordBotData();
        }
      });
    } else {
      console.log('Discord bot data file not found, will watch for creation...');
      // Watch the directory for file creation
      fs.watch(discordBotPath, (eventType, filename) => {
        if (filename === 'schedule-data.json') {
          console.log('Discord bot data file created, reading data...');
          setTimeout(readDiscordBotData, 1000); // Small delay to ensure file is written
        }
      });
    }
  } else {
    console.log('Discord bot directory not found at:', discordBotPath);
  }
}

function readDiscordBotData() {
  try {
    console.log('Attempting to read Discord bot data from:', discordDataFile);
    
    if (fs.existsSync(discordDataFile)) {
      console.log('Discord data file exists, reading...');
      const data = fs.readFileSync(discordDataFile, 'utf8');
      console.log('Raw file content:', data);
      
      const parsedData = JSON.parse(data);
      console.log('Parsed Discord bot data:', parsedData);
      
      // Send to renderer process
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('discord-bot-data', parsedData);
        console.log('Discord bot data sent to renderer process');
      } else {
        console.log('Main window not available or destroyed');
      }
    } else {
      console.log('Discord data file does not exist:', discordDataFile);
    }
  } catch (error) {
    console.error('Error reading Discord bot data:', error);
  }
}

// IPC handler to manually trigger Discord bot data reading
ipcMain.handle('read-discord-bot-data', () => {
  readDiscordBotData();
  return { success: true };
});

// IPC handler to get Discord bot status
ipcMain.handle('get-discord-bot-status', () => {
  const botExists = fs.existsSync(discordBotPath);
  const dataFileExists = fs.existsSync(discordDataFile);
  
  // Only log on first check or when status changes
  if (!this.lastDiscordBotStatus || 
      this.lastDiscordBotStatus.botExists !== botExists || 
      this.lastDiscordBotStatus.dataFileExists !== dataFileExists) {
    console.log('Discord bot status check:');
    console.log('- Bot directory exists:', botExists);
    console.log('- Data file exists:', dataFileExists);
    console.log('- Bot path:', discordBotPath);
    console.log('- Data file path:', discordDataFile);
    
    this.lastDiscordBotStatus = { botExists, dataFileExists };
  }
  
  return {
    botDirectoryExists: botExists,
    dataFileExists: dataFileExists,
    botPath: discordBotPath,
    dataFilePath: discordDataFile
  };
});

// Track NW Buddy process (already declared at top)

// NW Buddy Integration IPC handlers
ipcMain.handle("check-nwbuddy", async () => {
  try {
    const nwbuddyPath = path.join(__dirname, "..", "assets", "nwbuddy", "nwbuddy.exe");
    const versionPath = path.join(__dirname, "..", "assets", "nwbuddy", "version.json");
    
    if (await fs.pathExists(nwbuddyPath)) {
      let version = "Unknown";
      if (await fs.pathExists(versionPath)) {
        try {
          const versionInfo = await fs.readJson(versionPath);
          version = versionInfo.version;
        } catch (error) {
          console.error("Failed to read version info:", error);
        }
      }
      
      return {
        exists: true,
        path: nwbuddyPath,
        version: version
      };
    } else {
      return {
        exists: false,
        path: null,
        version: null
      };
    }
  } catch (error) {
    console.error("Error checking NW Buddy:", error);
    return {
      exists: false,
      path: null,
      version: null,
      error: error.message
    };
  }
});

ipcMain.handle("download-nwbuddy", async () => {
  try {
    const NWBuddyDownloader = require("../scripts/download-nwbuddy.js");
    const downloader = new NWBuddyDownloader();
    const result = await downloader.downloadNWBuddy();
    
    if (result.success) {
      return {
        success: true,
        path: result.filePath,
        version: result.version
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error("Error downloading NW Buddy:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle("launch-nwbuddy", async () => {
  console.log('launch-nwbuddy IPC handler called');
  
  try {
    // Create the BrowserView for NW Buddy web app
    console.log('Creating NW Buddy view...');
    await createNWBuddyView();
    
    // Show the BrowserView immediately after creation
    console.log('Showing NW Buddy view...');
    toggleNWBuddyView(true);
    
    console.log('NW Buddy web app loaded and displayed successfully');
    
    return {
      success: true,
      pid: nwbuddyView ? nwbuddyView.id : 'web-view',
      message: 'NW Buddy web app loaded successfully'
    };
  } catch (error) {
    console.error("Error loading NW Buddy web app:", error);
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle("set-auto-launch-nwbuddy", async (event, enabled) => {
  try {
    const settingsPath = path.join(__dirname, "..", "config", "app-settings.json");
    let settings = {};
    
    if (await fs.pathExists(settingsPath)) {
      settings = await fs.readJson(settingsPath);
    }
    
    settings.autoLaunchNWBuddy = enabled;
    
    await fs.ensureDir(path.dirname(settingsPath));
    await fs.writeJson(settingsPath, settings, { spaces: 2 });
    
    return { success: true };
  } catch (error) {
    console.error("Error setting auto-launch:", error);
    return { success: false, error: error.message };
  }
});

// Handle opening specific NW Buddy sections
ipcMain.handle("open-nwbuddy-section", async (event, section) => {
  try {
    // Check if NW Buddy view is available
    if (!nwbuddyView) {
      return { success: false, error: "NW Buddy is not loaded. Please launch it first." };
    }

    // Define section-specific URLs or commands
    const sectionUrls = {
      gearsets: "https://www.nw-buddy.de/gearsets",
      crafting: "https://www.nw-buddy.de/crafting", 
      tracking: "https://www.nw-buddy.de/tracking",
      prices: "https://www.nw-buddy.de/market"
    };

    const url = sectionUrls[section];
    if (!url) {
      return { success: false, error: `Unknown section: ${section}` };
    }

    // Load the section URL in the BrowserView
    await nwbuddyView.webContents.loadURL(url);
    
    console.log(`Opened NW Buddy ${section} section: ${url}`);
    
    return { success: true, url: url };
  } catch (error) {
    console.error(`Error opening NW Buddy section ${section}:`, error);
    return { success: false, error: error.message };
  }
});

// Add IPC handler to check if NW Buddy process is running
ipcMain.handle("check-nwbuddy-process", async () => {
  try {
    if (!nwbuddyView) {
      return { running: false, pid: null };
    }

    // Check if the BrowserView is still valid and attached to the window
    const isRunning = nwbuddyView && mainWindow.getBrowserViews().includes(nwbuddyView);
    
    return { 
      running: isRunning, 
      pid: nwbuddyView ? nwbuddyView.id : null 
    };
  } catch (error) {
    console.error("Error checking NW Buddy process:", error);
    return { running: false, pid: null, error: error.message };
  }
});

// IPC handlers for embedded NW Buddy view
ipcMain.handle("show-nwbuddy-view", async () => {
  try {
    if (!nwbuddyView) {
      await createNWBuddyView();
    }
    
    toggleNWBuddyView(true);
    return { success: true };
  } catch (error) {
    console.error("Error showing NW Buddy view:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("hide-nwbuddy-view", async () => {
  try {
    toggleNWBuddyView(false);
    return { success: true };
  } catch (error) {
    console.error("Error hiding NW Buddy view:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("is-nwbuddy-view-visible", async () => {
  try {
    return { visible: nwbuddyView !== null && mainWindow.getBrowserViews().includes(nwbuddyView) };
  } catch (error) {
    console.error("Error checking NW Buddy view visibility:", error);
    return { visible: false, error: error.message };
  }
});

// Handle tab switching to show/hide NW Buddy view
ipcMain.handle("switch-to-nwb-tab", async () => {
  try {
    if (nwbuddyView) {
      toggleNWBuddyView(true);
    }
    return { success: true };
  } catch (error) {
    console.error("Error switching to NWB tab:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("switch-from-nwb-tab", async () => {
  try {
    if (nwbuddyView) {
      toggleNWBuddyView(false);
    }
    return { success: true };
  } catch (error) {
    console.error("Error switching from NWB tab:", error);
    return { success: false, error: error.message };
  }
});



// Handle app cleanup
app.on("before-quit", () => {
  if (nwbuddyView) {
    try {
      mainWindow.removeBrowserView(nwbuddyView);
      nwbuddyView = null;
      console.log('Cleaned up NW Buddy view on app quit');
    } catch (error) {
      console.log('Error cleaning up NW Buddy view:', error);
    }
  }
});
