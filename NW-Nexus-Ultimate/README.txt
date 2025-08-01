# NW Nexus - Ultimate Single Launcher

## 🚀 Quick Start

### For All Users:
1. **Double-click** `NW-NEXUS.bat`
2. The app will automatically set up and launch
3. **That's it!** - No folders, no setup, just run and go!

## 📋 Requirements

- **Windows 10 or later**
- **Internet connection** (for first-time dependency download)
- **Node.js** (will be checked and prompted if missing)

## 📁 File Structure

```
NW-Nexus/
├── NW-NEXUS.bat         ← Double-click this to start
├── win-unpacked/        ← Application files
└── README.txt           ← This file
```

## ✨ Features

- **Single file launcher** - Just one .bat file!
- **No permanent folders** - Uses temporary directory
- **Auto-cleanup** - Removes temporary files after use
- **No installation** - Runs directly from the folder
- **First-time user friendly** - Checks prerequisites automatically

## 🔧 Troubleshooting

### "Node.js is not installed"
- Download and install Node.js from https://nodejs.org/
- Choose the LTS version
- Restart your computer after installation

### "npm is not recognized"
- Reinstall Node.js
- Make sure to check "Add to PATH" during installation
- Restart your computer

### "win-unpacked directory not found"
- Make sure `NW-NEXUS.bat` is in the same folder as `win-unpacked`
- Don't move the .bat file to a different location

### "Failed to install dependencies"
- Check your internet connection
- Make sure you have enough disk space
- Try running the launcher again

### "Application doesn't start"
- Try running as administrator
- Check Windows Defender isn't blocking the app
- Make sure all files are present

## 📞 Support

If you continue to have issues:

1. **Check the error messages** in the command window
2. **Make sure Node.js is installed** and in your PATH
3. **Check your internet connection** for dependency download
4. **Try running as administrator**
5. **Make sure the .bat file is in the correct folder**

## 🎮 About

**NW Nexus - Ultimate Single Launcher**
- Version: 1.0.0-ultimate
- Single file launcher
- No permanent installation
- Temporary setup and cleanup
- Zero footprint after use

## 🔄 Updates

To update the application:
1. Download the new version
2. Extract to a new folder
3. Run the new `NW-NEXUS.bat`
4. The app will automatically set up the new version

## 💡 How It Works

1. **Checks prerequisites** (Node.js, npm)
2. **Creates temporary directory** in %TEMP%
3. **Copies application files** to temp directory
4. **Installs dependencies** in temp directory
5. **Launches application** from temp directory
6. **Cleans up** temp directory after exit

This means no permanent folders are created on your system!
