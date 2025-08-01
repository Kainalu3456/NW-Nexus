const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");
const artifactsConfig = require("../config/artifacts-config");

class WebCrawler {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      timeout: options.timeout || 30000,
      waitForSelector: options.waitForSelector || null,
      waitForTimeout: options.waitForTimeout || 2000,
      userAgent:
        options.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      ...options,
    };
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      console.log("Initializing browser...");

      // Use the working configuration from GitHub thread
      const launchOptions = {
        headless: this.options.headless,
        args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        ignoreHTTPSErrors: true,
      };

      this.browser = await puppeteer.launch(launchOptions);

      console.log("Browser initialized successfully");

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.options.userAgent);
      await this.page.setViewport({ width: 1920, height: 1080 });

      console.log("Page setup completed");
    } catch (error) {
      console.error("Failed to initialize browser:", error);
      throw error;
    }
  }

  async extractNWBuddyData(page) {
    try {
      // Extract items with their associated perks
      const extractedData = await page.evaluate((artifactsConfig) => {
        // Find all item cards first
        const itemCards = document.querySelectorAll("nwb-item-card");

        const items = [];
        const allPerks = new Set();
        let artifactCount = 0;

        itemCards.forEach((card) => {
          // Extract item name from within the item header
          const itemNameElement = card.querySelector(
            "nwb-item-header-content a span.ng-star-inserted"
          );

          if (itemNameElement && itemNameElement.textContent.trim()) {
            const itemName = itemNameElement.textContent.trim();
            const itemPerks = [];
            const perkDetails = [];

            // Check if this is an artifact
            const isArtifact = artifactsConfig.artifacts.includes(itemName);

            // Extract perk names from within the perk sections for this specific item
            const perkElements = card.querySelectorAll(
              "nwb-item-detail-perks b.ng-star-inserted"
            );

            perkElements.forEach((perkElement, index) => {
              const perkText = perkElement.textContent.trim();
              if (perkText && perkText.length > 0) {
                // Remove the colon at the end if present
                const cleanPerkName = perkText.replace(/:\s*$/, "");

                // Filter out numeric stats (like +42, -10, etc.) and only keep actual perk names
                if (
                  cleanPerkName &&
                  !cleanPerkName.match(/^[+\-]?\d+(\.\d+)?$/)
                ) {
                  itemPerks.push(cleanPerkName);
                  allPerks.add(cleanPerkName);

                  // Check if this is a gem slot
                  const isGemSlot = artifactsConfig.gemSlots.includes(cleanPerkName);
                  
                  // Get craft mod URL if available
                  const craftModUrl = artifactsConfig.perkCraftMods[cleanPerkName] || null;
                  
                  // Check if this is the last perk (for artifacts)
                  const isLastPerk = index === perkElements.length - 1;

                  perkDetails.push({
                    name: cleanPerkName,
                    isGemSlot: isGemSlot,
                    craftModUrl: craftModUrl,
                    isLastPerk: isLastPerk
                  });
                }
              }
            });

            // Count artifacts
            if (isArtifact) {
              artifactCount++;
            }

            // Extract gear type label (e.g., Artifact, Named, etc.)
            let gearType = null;
            const gearTypeSpan = card.querySelector('span[class*="text-rarity-"][class*="text-sm"]');
            if (gearTypeSpan && gearTypeSpan.textContent.trim()) {
              gearType = gearTypeSpan.textContent.trim();
            }

            // After building perkDetails, set isLastPerk for artifacts and named
            const isNamed = gearType && gearType.toLowerCase() === 'named';
            if ((isArtifact || isNamed) && perkDetails.length > 0) {
              perkDetails.forEach((pd, idx) => pd.isLastPerk = (idx === perkDetails.length - 1));
            }

            // Add the item with its perks
            items.push({
              name: itemName,
              perks: itemPerks,
              perkDetails: perkDetails,
              isArtifact: isArtifact,
              lastPerk: (isArtifact || isNamed) && perkDetails.length > 0 ? perkDetails[perkDetails.length - 1] : null,
              gearType: gearType
            });
          }
        });

        return {
          items: items,
          totalItems: items.length,
          totalPerks: allPerks.size,
          artifactCount: artifactCount,
          // Keep legacy format for backward compatibility
          itemNames: items.map((item) => item.name),
          perkNames: Array.from(allPerks),
        };
      }, artifactsConfig);

      console.log(
        `📦 Found ${extractedData.totalItems} items with ${extractedData.totalPerks} unique perks${extractedData.artifactCount > 0 ? ` (${extractedData.artifactCount} artifacts)` : ''}`
      );

      return extractedData;
    } catch (error) {
      console.error("❌ Error extracting NW Buddy data:", error);
      return {
        items: [],
        totalItems: 0,
        totalPerks: 0,
        itemNames: [],
        perkNames: [],
      };
    }
  }

  async crawlPage(url, extractNWBuddyData = false) {
    if (!this.page) {
      throw new Error("Crawler not initialized. Call initialize() first.");
    }

    try {
      console.log(`Crawling: ${url}`);

      // Navigate to the page
      await this.page.goto(url, {
        waitUntil: "networkidle0",
        timeout: this.options.timeout,
      });

      // Wait for specific selector if provided
      if (this.options.waitForSelector) {
        console.log(`Waiting for selector: ${this.options.waitForSelector}`);
        await this.page.waitForSelector(this.options.waitForSelector, {
          timeout: this.options.timeout,
        });
      }

      // Additional wait for JavaScript to finish rendering
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.waitForTimeout)
      );

      // Get the full DOM content
      const content = await this.page.content();

      // Get page title
      const title = await this.page.title();

      // Get page URL (in case of redirects)
      const finalUrl = this.page.url();

      // Extract NW Buddy specific data if requested
      let nwBuddyData = null;
      if (extractNWBuddyData) {
        console.log("Extracting NW Buddy data...");
        nwBuddyData = await this.extractNWBuddyData(this.page);
        console.log(
          `Found ${nwBuddyData.totalItems} items with ${nwBuddyData.totalPerks} unique perks`
        );
      }

      console.log(`Successfully crawled: ${title}`);

      const result = {
        url: finalUrl,
        originalUrl: url,
        title,
        content,
        timestamp: new Date().toISOString(),
        contentLength: content.length,
      };

      // Add extracted data if available
      if (nwBuddyData) {
        result.nwBuddyData = nwBuddyData;
      }

      return result;
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
      throw error;
    }
  }

  async crawlMultiplePages(urls, extractNWBuddyData = false) {
    const results = [];

    for (const url of urls) {
      try {
        const result = await this.crawlPage(url, extractNWBuddyData);
        results.push(result);

        // Small delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to crawl ${url}:`, error);
        results.push({
          url,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  async saveToFile(data, filename) {
    try {
      const outputDir = path.join(__dirname, "..", "output");
      await fs.ensureDir(outputDir);

      const filepath = path.join(outputDir, filename);
      await fs.writeJson(filepath, data, { spaces: 2 });

      console.log(`Data saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("Browser closed");
    }
  }
}

// Example usage function
async function main() {
  const crawler = new WebCrawler({
    headless: true,
    waitForTimeout: 3000,
  });

  try {
    await crawler.initialize();

    // Example URLs - replace with actual nwbuddy URLs
    const urls = [
      "https://example.com",
      // Add your nwbuddy URLs here
    ];

    console.log("Starting crawl...");
    const results = await crawler.crawlMultiplePages(urls);

    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await crawler.saveToFile(results, `crawl-results-${timestamp}.json`);

    console.log(`Crawl completed. Processed ${results.length} pages.`);
  } catch (error) {
    console.error("Crawl failed:", error);
  } finally {
    await crawler.close();
  }
}

// Export the class for use in other files
module.exports = WebCrawler;

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
