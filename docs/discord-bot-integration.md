# Discord Bot Integration Guide

## Overview
Your webapp now has automatic Discord bot integration! When your Discord bot saves schedule data to a specific file, the webapp will automatically detect it and populate the Schedule Maker.

## How It Works

### 1. File-Based Integration
- The webapp watches for a file called `schedule-data.json` in your Discord bot directory
- When the file is created or updated, the webapp automatically reads it
- Data is then populated into the Schedule Maker interface

### 2. Discord Bot Directory
The webapp looks for your Discord bot at:
```
C:\Program Files (x86)\nw-buddy-discord-bot\schedule-data.json
```

## Discord Bot Setup

### Step 1: Create the Data File
Your Discord bot needs to save schedule data to:
```
C:\Program Files (x86)\nw-buddy-discord-bot\schedule-data.json
```

### Step 2: Data Format
The file should contain JSON in this format:

```json
{
  "timestamp": "2025-01-07T12:00:00.000Z",
  "region": "east",
  "rawText": "Your Discord message text here...",
  "events": [
    {
      "id": "unique_event_id",
      "time": "20:00",
      "type": "race",
      "location": "Mourningdale",
      "faction": "syndicate",
      "company": "TwoTrailerParkGirls",
      "region": "east"
    }
  ]
}
```

### Step 3: Event Types
Supported event types:
- `race` - Territory races
- `war` - Territory wars
- `invasion` - Invasions
- `mutation` - Mutations
- `custom` - Custom events

### Step 4: Region Values
Use these region values:
- `east` - EAST region
- `west` - WEST region
- `central` - CENTRAL region
- `south` - SOUTH region
- `europe` - EUROPE region
- `asia` - ASIA region
- `oceania` - OCEANIA region

### Step 5: Faction Values
Use these faction values:
- `syndicate` - For Syndicate
- `covenant` - For Covenant  
- `marauders` - For Marauders

## Webapp Features

### Automatic Detection
- **🟢 Connected** - Discord bot found and data file exists
- **🟡 Waiting** - Discord bot found, waiting for data file
- **🔴 Not Found** - Discord bot directory not found

### Auto-Import
When Discord bot data is received:
1. Raw text is populated in the textarea
2. Parsed events are automatically imported
3. Notification shows how many events were imported
4. Schedule is updated immediately

### Manual Refresh
- Click the 🔄 button to manually refresh Discord bot data
- Useful if you want to check for new data without waiting

## Discord Bot Code Example

Here's a simple example of how your Discord bot could save the data:

```javascript
const fs = require('fs');
const path = require('path');

function saveScheduleData(rawText, events, region = 'east') {
  const data = {
    timestamp: new Date().toISOString(),
    region: region,
    rawText: rawText,
    events: events
  };
  
  const filePath = path.join('C:\\Program Files (x86)\\nw-buddy-discord-bot', 'schedule-data.json');
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('Schedule data saved to:', filePath);
}

// Example usage:
const rawText = "➖➖➖𝐑𝐀𝐂𝐄𝐒➖➖➖\n> **`8 PM:`** Mourningdale <:Syndicate:1309459851033841755> TwoTrailerParkGirls";
const events = [
  {
    id: Date.now().toString(),
    time: "20:00",
    type: "race",
    location: "Mourningdale",
    faction: "syndicate",
    company: "TwoTrailerParkGirls",
    region: "east"
  }
];

saveScheduleData(rawText, events, 'east');
```

## Troubleshooting

### Discord Bot Not Found
- Check that the Discord bot is installed at the correct path
- Ensure the webapp has permission to access the directory

### Data Not Importing
- Verify the JSON format is correct
- Check that the file is being written to the correct location
- Look for errors in the webapp console (F12)

### File Permissions
- Make sure the Discord bot has write permission to its directory
- The webapp needs read permission to the Discord bot directory

## Advanced Features

### Multiple Regions
You can save data for different regions by changing the `region` field in the JSON. The webapp will import events for the currently selected region.

### Real-time Updates
The webapp watches for file changes, so updates are detected immediately when your Discord bot saves new data.

### Backup and Export
- Use the "Export Schedule" button to save your schedule
- Schedules are automatically saved to localStorage
- You can import/export schedules between different installations 