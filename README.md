# NW Nexus

A comprehensive New World data scraping and analysis tool designed to extract and analyze data from various New World sources.

## Features

- **JavaScript Support**: Uses Puppeteer to handle JavaScript-rendered content
- **Full DOM Extraction**: Captures complete page content after JavaScript loads
- **Configurable**: Easily customizable for different sites and requirements
- **Error Handling**: Robust error handling with retry logic
- **Rate Limiting**: Respectful crawling with configurable delays
- **Multiple Output Formats**: Save results as JSON or CSV
- **Headless & Visual Modes**: Run in headless mode for production or visual mode for debugging

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Quick Start

### 1. Test the Crawler

Run the test script to ensure everything is working:

```bash
npm test
```

This will crawl a few test URLs and save results to the `output/` directory.

### 2. Basic Usage

```javascript
const WebCrawler = require("./src/crawler");

async function crawlSite() {
  const crawler = new WebCrawler({
    headless: true,
    waitForTimeout: 3000,
  });

  await crawler.initialize();

  const result = await crawler.crawlPage("https://example.com");
  console.log(result);

  await crawler.close();
}
```

### 3. Crawl Multiple Pages

```javascript
const urls = ["https://site1.com", "https://site2.com"];

const results = await crawler.crawlMultiplePages(urls);
await crawler.saveToFile(results, "my-results.json");
```

## Configuration

### Basic Options

```javascript
const options = {
  headless: true, // Run in headless mode
  timeout: 30000, // Page load timeout (ms)
  waitForTimeout: 2000, // Wait after page load (ms)
  waitForSelector: null, // Wait for specific element
  userAgent: "custom-agent", // Custom user agent
};
```

### NW Buddy Configuration

Edit `config/nwbuddy-config.js` to customize settings for nwbuddy sites:

- **URLs**: Add your target nwbuddy URLs
- **Selectors**: Define CSS selectors for item extraction
- **Rate Limiting**: Configure delays between requests
- **Output Settings**: Choose format and save location

## Scripts

- `npm start` - Run the main crawler
- `npm test` - Run test crawler with example URLs
- `npm run dev` - Run with nodemon for development

## Output

Results are saved in the `output/` directory as JSON files containing:

```json
{
  "url": "https://example.com",
  "originalUrl": "https://example.com",
  "title": "Page Title",
  "content": "Full HTML content...",
  "timestamp": "2023-12-01T12:00:00.000Z",
  "contentLength": 50000
}
```

## Advanced Usage

### Custom Selectors

Wait for specific elements to load:

```javascript
const crawler = new WebCrawler({
  waitForSelector: ".item-list",
  waitForTimeout: 5000,
});
```

### Error Handling

```javascript
try {
  const result = await crawler.crawlPage(url);
} catch (error) {
  console.error("Crawl failed:", error);
}
```

### Visual Debugging

Set `headless: false` to see the browser in action:

```javascript
const crawler = new WebCrawler({
  headless: false, // Browser will be visible
});
```

## Dependencies

- **puppeteer**: Browser automation
- **cheerio**: HTML parsing (optional)
- **fs-extra**: File system utilities
- **axios**: HTTP requests (optional)

## Notes

- Be respectful when crawling - use appropriate delays
- Check robots.txt before crawling
- Consider rate limiting and terms of service
- Test with small batches first

## Troubleshooting

### Common Issues

1. **Browser fails to launch**: Try adding more Puppeteer launch args
2. **Page doesn't load**: Increase timeout values
3. **Missing content**: Increase waitForTimeout or add specific selectors
4. **Memory issues**: Close browser between large batches

### Debug Mode

Run with visual mode to see what's happening:

```bash
# In src/test-crawler.js, set headless: false
npm test
```

## License

MIT
