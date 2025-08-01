# NW Buddy Scraper - Electron App

A desktop application for extracting items and perks from NW Buddy gear set links.

## Features

- 🎮 **Simple Interface**: Clean, modern UI for easy interaction
- 🔍 **Web Scraping**: Extracts item names and perk information from NW Buddy gear sets
- 💾 **Export Results**: Save extracted data as JSON files
- 🖥️ **Cross-Platform**: Works on Windows, macOS, and Linux
- ⚡ **Fast**: Uses headless browser for quick data extraction

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone <your-repo-url>
   cd nw-buddy-scraper
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

### Running in Development Mode

```bash
npm run electron-dev
```

This will open the app with developer tools enabled.

### Running in Production Mode

```bash
npm run electron
```

### How to Use the App

1. **Launch the app** using one of the commands above
2. **Enter a NW Buddy URL** in the input field (e.g., `https://www.nw-buddy.de/gearsets/share/...`)
3. **Click "Extract Data"** to start the scraping process
4. **Wait for results** - the app will show a loading spinner while processing
5. **View results** - items and perks will be displayed in organized lists
6. **Save results** - click the "Save Results" button to export as JSON

### Sample URL

You can test the app with this sample URL:

```
https://www.nw-buddy.de/gearsets/share/ipns/k51qzi5uqu5div37yqkk0n45fh3ubku2n9ec3gfbp2abryeev1siqydvshxbzt
```

## Building for Distribution

### Prerequisites

- Node.js 16+
- npm or yarn

### Build Commands

**Build for current platform:**

```bash
npm run build
```

**Build for Windows:**

```bash
npm run build-win
```

**Build for macOS:**

```bash
npm run build-mac
```

**Build for both platforms:**

```bash
npm run build-all
```

### Build Outputs

Built applications will be saved in the `dist/` folder:

- **Windows**: `.exe` installer and unpacked folder
- **macOS**: `.dmg` installer and `.app` bundle
- **Linux**: `.AppImage` and other formats

## Project Structure

```
nw-buddy-scraper/
├── electron/                 # Electron app files
│   ├── main.js              # Main process (app lifecycle)
│   ├── renderer/            # Renderer process (UI)
│   │   ├── index.html       # Main HTML file
│   │   ├── styles.css       # App styling
│   │   └── renderer.js      # UI logic and IPC
│   └── assets/              # App assets (icons, etc.)
├── src/                     # Original crawler code
│   ├── crawler.js           # Web crawler class
│   ├── nwbuddy-crawler.js   # NW Buddy specific crawler
│   └── test-crawler.js      # Test script
├── scripts/                 # Build and development scripts
│   ├── dev.js              # Development runner
│   └── build.js            # Build script
├── config/                  # Configuration files
├── output/                  # Crawler output files
└── package.json            # Dependencies and scripts
```

## Configuration

### Browser Settings

The app runs the crawler in headless mode by default. You can modify crawler settings in `electron/main.js`:

```javascript
const crawler = new WebCrawler({
  headless: true, // Always headless in production
  waitForTimeout: 10000, // Wait time for page load
  timeout: 60000, // Overall timeout
});
```

### App Settings

App window settings can be modified in `electron/main.js`:

```javascript
const mainWindow = new BrowserWindow({
  width: 1200, // Window width
  height: 800, // Window height
  // ... other settings
});
```

## Adding App Icons

1. Create or obtain app icons in various formats:

   - PNG: 256x256 or 512x512 pixels
   - ICO: For Windows builds
   - ICNS: For macOS builds

2. Place them in the `electron/assets/` folder:

   - `icon.png`
   - `icon.ico`
   - `icon.icns`

3. The build process will automatically use these icons.

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Run `npm install` to ensure all dependencies are installed.

2. **Build fails**: Make sure you have the required build tools:

   - Windows: Windows Build Tools or Visual Studio
   - macOS: Xcode Command Line Tools

3. **App won't start**: Check the console for error messages and ensure all files are in the correct locations.

4. **Scraping fails**: Verify the URL is correct and the website is accessible.

### Debug Mode

Run the app with developer tools:

```bash
npm run electron-dev
```

This will open the DevTools where you can see console logs and debug issues.

## Development

### Making Changes

1. **UI Changes**: Edit files in `electron/renderer/`
2. **App Logic**: Edit `electron/main.js`
3. **Crawler Changes**: Edit files in `src/`

### Testing

Test the original crawler functionality:

```bash
npm test
```

Test the Electron app:

```bash
npm run electron-dev
```

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the console logs in debug mode
3. Create an issue in the project repository

---

**Built with**: Electron, Puppeteer, Node.js
