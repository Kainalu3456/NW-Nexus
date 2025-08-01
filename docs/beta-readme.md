# NW Buddy Scraper - Beta Test

## 🚀 Quick Start

### For Developers
```bash
# Build standalone application and run tests
npm run launch-beta

# Or run steps individually:
npm run build-standalone  # Build the standalone app
npm run beta-test         # Run comprehensive tests
```

### For Beta Testers
1. **Download** the standalone package from the `standalone/` directory
2. **Extract** to your desired location
3. **Run** `NW Buddy Scraper.exe` or `launch.bat`
4. **Test** all features using the [BETA_TEST_GUIDE.md](./BETA_TEST_GUIDE.md)

## 📦 What's Included

### Standalone Application
- **Portable Version**: Single executable file
- **Full Version**: Complete application with all dependencies
- **Launch Script**: Easy startup batch file
- **Documentation**: Comprehensive README and guides

### New Features in Beta
- 🎮 **Embedded NW Buddy Web App**
- 📅 **Schedule Maker with Discord Integration**
- 📊 **Daily/Weekly Activity Tracker**
- 🗺️ **Interactive Maps (NWDB & Aeternum)**
- ⚙️ **Enhanced Settings Panel**
- 🎨 **Multiple UI Themes**
- 💰 **Market Price Integration**
- 🔔 **Notification System**

## 🧪 Testing Process

### Automated Tests
The beta test suite automatically checks:
- ✅ Build process integrity
- ✅ File structure validation
- ✅ Configuration file verification
- ✅ Dependencies completeness
- ✅ Application launch capability
- ✅ Basic functionality tests

### Manual Testing Required
After automated tests pass, manually test:
- 🎮 NW Buddy integration features
- 📅 Schedule maker functionality
- 📊 Daily/weekly tracker
- 🗺️ Interactive maps
- ⚙️ Settings and customization
- 🎨 Theme system
- 💰 Market price features

## 📋 Test Checklist

### Core Features
- [ ] Application launches without errors
- [ ] All tabs are accessible
- [ ] NW Buddy web app loads correctly
- [ ] Schedule maker works
- [ ] Daily/weekly tracker functions
- [ ] Maps load and are interactive
- [ ] Settings panel is functional

### Advanced Features
- [ ] Theme switching works
- [ ] Discord bot integration (if available)
- [ ] Market price fetching
- [ ] Data saving/loading
- [ ] Notification system
- [ ] Auto-save functionality

### Performance
- [ ] Startup time < 10 seconds
- [ ] Memory usage < 500MB
- [ ] UI responsiveness
- [ ] No freezing or hanging

## 🐛 Bug Reporting

### Required Information
1. **Description**: What happened?
2. **Steps**: How to reproduce?
3. **Expected**: What should happen?
4. **Actual**: What actually happened?
5. **System**: Windows version, RAM, etc.
6. **Screenshots**: If applicable

### Common Issues
- **App won't start**: Check antivirus, run as admin
- **Web content not loading**: Check internet connection
- **Performance issues**: Close other apps, restart
- **Data not saving**: Check permissions, disk space

## 📊 Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Startup Time | < 5s | < 10s |
| Memory Usage | < 300MB | < 500MB |
| Tab Switching | < 1s | < 2s |
| Web Loading | < 3s | < 5s |

## 🔧 Troubleshooting

### Application Issues
```bash
# Check if build was successful
npm run build-standalone

# Run tests to identify issues
npm run beta-test

# Check test report
cat beta-test-report.json
```

### Common Solutions
1. **Clean build**: Delete `dist/` and `standalone/` directories
2. **Reinstall dependencies**: `npm install`
3. **Check Node.js version**: Should be 16+ for Electron
4. **Verify system requirements**: Windows 10/11, 4GB RAM

## 📝 Feedback Submission

### What We Need
- **Overall experience** with the application
- **Feature feedback** (what works, what doesn't)
- **Performance observations** on your system
- **Bug reports** with detailed information
- **Feature requests** for future versions

### How to Submit
- Use the bug reporting format above
- Include system specifications
- Provide screenshots when helpful
- Be specific about reproduction steps

## 🎯 Success Criteria

The beta test is successful when:
- [ ] All critical features work correctly
- [ ] No major bugs prevent normal use
- [ ] Performance meets expectations
- [ ] User feedback is positive
- [ ] Application is ready for release

## 📞 Support

### Documentation
- [BETA_TEST_GUIDE.md](./BETA_TEST_GUIDE.md) - Comprehensive testing guide
- [README.md](./README.md) - Main project documentation
- [ELECTRON_README.md](./ELECTRON_README.md) - Electron-specific info

### Getting Help
- Check troubleshooting section above
- Review test reports for specific issues
- Contact development team with detailed questions

## 🏁 Beta Test Timeline

### Phase 1: Setup & Build (Day 1)
- [ ] Build standalone application
- [ ] Run automated tests
- [ ] Verify basic functionality

### Phase 2: Feature Testing (Days 2-5)
- [ ] Test all major features
- [ ] Verify integrations work
- [ ] Check performance metrics

### Phase 3: User Testing (Days 6-10)
- [ ] Real-world usage testing
- [ ] Edge case identification
- [ ] User experience feedback

### Phase 4: Final Review (Day 11)
- [ ] Bug fix verification
- [ ] Performance optimization
- [ ] Release preparation

## 🎉 Ready to Test?

1. **Run the launcher**: `npm run launch-beta`
2. **Check the output**: Verify all tests pass
3. **Find your package**: Look in `standalone/` directory
4. **Start testing**: Use the comprehensive guide
5. **Report findings**: Submit detailed feedback

**Happy testing! 🚀**

---

**Version**: 1.0.0  
**Build Date**: ${new Date().toISOString()}  
**Beta Test Version**: v1.0.0-beta 