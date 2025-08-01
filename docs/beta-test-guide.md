# NW Buddy Scraper - Beta Test Guide

## 🚀 Welcome to the Beta Test!

Thank you for participating in the beta test of the NW Buddy Scraper standalone application. This guide will help you test all the features and report any issues you encounter.

## 📋 What's New in This Version

### 🎮 NW Buddy Integration
- **Embedded NW Buddy Web App**: Full NW Buddy application embedded directly in the scraper
- **Seamless Navigation**: Switch between scraper and NW Buddy without leaving the app
- **Direct Access**: Quick access to gearsets, crafting, tracking, and market prices

### 📅 Schedule Maker
- **Event Management**: Create and manage event schedules
- **Discord Bot Integration**: Automatic data import from Discord bot
- **Multi-Region Support**: Support for different server regions and timezones
- **Custom Events**: Add your own events with custom timers

### 📊 Daily/Weekly Tracker
- **Multi-Character Support**: Track activities across multiple characters
- **Automatic Reset Timers**: Never miss daily/weekly resets
- **Custom Event Timers**: Set custom timers for any activity
- **Progress Tracking**: Visual indicators for completed activities

### 🗺️ Interactive Maps
- **NWDB Integration**: Access game data and information
- **Aeternum Map**: Interactive world map for exploration
- **Copy-Friendly Interface**: Easy text copying from map overlays

### ⚙️ Enhanced Settings
- **Multiple Themes**: Choose from 6 different UI themes
- **Timezone Settings**: Configure reset times for your timezone
- **Notification System**: Customizable notifications and sounds
- **Data Management**: Auto-save and backup options

## 🛠️ Installation & Setup

### Quick Start
1. **Download**: Extract the standalone package to your desired location
2. **Launch**: Run `NW Buddy Scraper.exe` (portable) or `launch.bat` (full version)
3. **First Run**: The app will initialize and load all components

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 500MB free space
- **Network**: Internet connection required for web features

## 🧪 Testing Checklist

### ✅ Core Functionality Tests

#### 1. Application Launch
- [ ] Application starts without errors
- [ ] Main window loads properly
- [ ] All tabs are accessible
- [ ] No console errors on startup

#### 2. NW Buddy Integration
- [ ] NWB tab loads correctly
- [ ] Embedded NW Buddy web app displays
- [ ] Can navigate to different NW Buddy sections
- [ ] Integration panel shows/hides properly
- [ ] Quick action buttons work

#### 3. Schedule Maker
- [ ] Schedule tab loads
- [ ] Can add custom events
- [ ] Time slots display correctly
- [ ] Discord bot status shows
- [ ] Import/export functions work

#### 4. Daily/Weekly Tracker
- [ ] Tracker tab loads
- [ ] Can add characters
- [ ] Can add events to characters
- [ ] Reset timers display correctly
- [ ] Auto-refresh works

#### 5. Interactive Maps
- [ ] NWD tab loads NWDB
- [ ] Map tab loads Aeternum Map
- [ ] Maps are interactive
- [ ] Copy functionality works

#### 6. Settings Panel
- [ ] Settings tab loads
- [ ] Theme switching works
- [ ] Timezone settings save
- [ ] All settings categories accessible

### ✅ Feature-Specific Tests

#### NW Buddy Scraper (Original Tab)
- [ ] URL input accepts valid NW Buddy URLs
- [ ] Market price integration works
- [ ] Server selection functions
- [ ] Results display properly
- [ ] Save functionality works

#### Theme System
- [ ] Purple theme displays correctly
- [ ] Green theme displays correctly
- [ ] Blue theme displays correctly
- [ ] Orange theme displays correctly
- [ ] Red theme displays correctly
- [ ] Pink theme displays correctly

#### Notification System
- [ ] Notifications can be enabled/disabled
- [ ] Different sound options work
- [ ] Notification duration settings apply
- [ ] Notifications appear when expected

#### Data Management
- [ ] Auto-save works
- [ ] Manual save/load functions
- [ ] Backup system works
- [ ] Data persists between sessions

### ✅ Performance Tests

#### Memory Usage
- [ ] Application starts with reasonable memory usage
- [ ] Memory usage doesn't grow excessively over time
- [ ] No memory leaks during normal use

#### Responsiveness
- [ ] UI responds quickly to user input
- [ ] Tab switching is smooth
- [ ] No freezing or hanging during use

#### Network Performance
- [ ] Web content loads reasonably fast
- [ ] Market price fetching works
- [ ] No timeout errors during normal use

## 🐛 Bug Reporting

### How to Report Issues

When you encounter a bug, please provide the following information:

1. **Bug Description**: Clear description of what happened
2. **Steps to Reproduce**: Exact steps to recreate the issue
3. **Expected Behavior**: What should have happened
4. **Actual Behavior**: What actually happened
5. **System Information**:
   - Windows version
   - Available RAM
   - Available disk space
   - Internet connection type
6. **Screenshots**: If applicable, include screenshots
7. **Error Messages**: Copy any error messages exactly

### Common Issues to Watch For

#### Startup Issues
- Application fails to launch
- Missing dependencies
- Permission errors
- Antivirus blocking

#### UI Issues
- Elements not displaying correctly
- Layout problems on different screen sizes
- Theme not applying properly
- Tab switching problems

#### Functionality Issues
- Features not working as expected
- Data not saving/loading
- Network connectivity problems
- Performance degradation

#### Integration Issues
- NW Buddy web app not loading
- Discord bot integration problems
- Map loading issues
- Market price fetching failures

## 📊 Performance Benchmarks

### Expected Performance
- **Startup Time**: < 10 seconds
- **Tab Switching**: < 2 seconds
- **Web Content Loading**: < 5 seconds
- **Memory Usage**: < 500MB typical
- **CPU Usage**: < 10% typical

### Performance Monitoring
Monitor these metrics during testing:
- Application startup time
- Memory usage over time
- CPU usage during normal operation
- Network request response times
- UI responsiveness

## 🔧 Troubleshooting

### Common Solutions

#### Application Won't Start
1. Check antivirus settings
2. Run as administrator
3. Verify system requirements
4. Check for missing dependencies

#### Web Content Not Loading
1. Verify internet connection
2. Check firewall settings
3. Try refreshing the page
4. Check if the target site is accessible

#### Performance Issues
1. Close other applications
2. Restart the application
3. Check available system resources
4. Clear application cache

#### Data Not Saving
1. Check write permissions
2. Verify disk space
3. Try manual save
4. Check file paths

## 📝 Feedback Submission

### What We Want to Know

1. **Overall Experience**: How was your experience using the app?
2. **Feature Feedback**: Which features worked well? Which need improvement?
3. **Performance**: How did the app perform on your system?
4. **Usability**: Was the interface intuitive and easy to use?
5. **Missing Features**: What features would you like to see added?
6. **Bugs Found**: Any issues you encountered (use bug report format above)

### How to Submit Feedback

1. **Bug Reports**: Use the bug reporting format above
2. **General Feedback**: Email or use the feedback form
3. **Feature Requests**: Include detailed description and use case
4. **Performance Reports**: Include system specs and performance metrics

## 🎯 Testing Focus Areas

### Priority 1 (Critical)
- Application startup and basic functionality
- Core features (NW Buddy integration, scraper)
- Data saving and loading
- Basic UI functionality

### Priority 2 (Important)
- Advanced features (schedule maker, tracker)
- Theme system
- Settings and customization
- Performance under normal load

### Priority 3 (Nice to Have)
- Edge cases and error handling
- Performance under heavy load
- Accessibility features
- Advanced customization options

## 🏁 Beta Test Completion

### When You're Done Testing

1. **Complete the checklist**: Go through all test items
2. **Submit feedback**: Provide comprehensive feedback
3. **Report bugs**: Submit any issues found
4. **Performance data**: Share performance observations
5. **Final thoughts**: Overall impressions and recommendations

### Beta Test Success Criteria

The beta test is successful when:
- [ ] All critical features work correctly
- [ ] No major bugs prevent normal use
- [ ] Performance meets expectations
- [ ] User feedback is positive overall
- [ ] Application is ready for general release

## 📞 Support

If you need help during testing:
- Check this guide for troubleshooting steps
- Review the README.txt in the standalone package
- Contact the development team with specific questions

Thank you for participating in the beta test! Your feedback is invaluable for making this application the best it can be.

---

**Version**: 1.0.0  
**Build Date**: ${new Date().toISOString()}  
**Beta Test Period**: [Start Date] - [End Date] 