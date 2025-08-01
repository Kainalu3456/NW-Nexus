# NW Buddy Scraper - Project Structure

## 📁 Root Directory

```
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
```

## 🚀 Quick Commands

- `npm start` - Start the application
- `npm run create-single-bat` - Create single batch file launcher
- `npm run create-simple-package` - Create distribution package
- `npm run cleanup` - Clean up project files

## 📦 Distribution

The `dist-beta/` folder contains the ready-to-distribute files:
- `START-NW-BUDDY-SCRAPER.bat` - Main launcher
- `launch-app.bat` - Application launcher
- `win-unpacked/` - Electron application files
- `README.txt` - User instructions
