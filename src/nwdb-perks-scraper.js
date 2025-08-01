const puppeteer = require("puppeteer");
const fs = require("fs-extra");
const path = require("path");

class NWDBPerksScraper {
  constructor(options = {}) {
    this.options = {
      headless: options.headless !== false, // Default to headless
      timeout: options.timeout || 30000,
      waitForTimeout: options.waitForTimeout || 2000,
      userAgent:
        options.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      ...options,
    };
    this.browser = null;
    this.page = null;
    this.allPerks = [];
  }

  async initialize() {
    try {
      console.log("🔧 Initializing NWDB Perks Scraper...");

      const launchOptions = {
        headless: this.options.headless,
        args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
        ignoreHTTPSErrors: true,
      };

      this.browser = await puppeteer.launch(launchOptions);
      console.log("✅ Browser initialized successfully");

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(this.options.userAgent);
      await this.page.setViewport({ width: 1920, height: 1080 });

      console.log("✅ Page setup completed");
    } catch (error) {
      console.error("❌ Failed to initialize browser:", error);
      throw error;
    }
  }

  async scrapePerksPage(pageNumber = 1) {
    try {
      const url = `https://nwdb.info/db/perks/page/${pageNumber}`;
      console.log(`📄 Scraping page ${pageNumber}: ${url}`);

      // Navigate to the page
      await this.page.goto(url, {
        waitUntil: "networkidle0",
        timeout: this.options.timeout,
      });

      // Wait for the perk links to load
      await this.page.waitForSelector('a[href*="/db/perk/"]', { timeout: this.options.timeout });

      // Additional wait for JavaScript to finish rendering
      await new Promise((resolve) =>
        setTimeout(resolve, this.options.waitForTimeout)
      );

      // Extract perks from the current page
      const pagePerks = await this.page.evaluate((pageNumberArg) => {
        const perks = [];
        const perkLinks = document.querySelectorAll('a[href*="/db/perk/"]');
        perkLinks.forEach((link) => {
          const href = link.href;
          const perkName = link.textContent.trim();
          // Skip if no perk name or if it's just whitespace
          if (!perkName || perkName.length === 0) return;
          // Find the parent row to get additional information
          let row = link.closest('tr');
          if (!row) {
            // If no direct row, try to find the row containing this link
            const table = link.closest('table');
            if (table) {
              const allRows = table.querySelectorAll('tr');
              for (const tr of allRows) {
                if (tr.contains(link)) {
                  row = tr;
                  break;
                }
              }
            }
          }
          let description = "";
          let tier = "";
          let craftModName = "";
          let craftModUrl = "";
          if (row) {
            const cells = row.querySelectorAll('td');
            // Try to extract description (usually in the second column)
            if (cells.length > 1) {
              description = cells[1]?.textContent?.trim() || "";
            }
            // Try to extract tier (usually in the third column)
            if (cells.length > 2) {
              tier = cells[2]?.textContent?.trim() || "";
            }
            // Try to extract craft mod (usually in the fourth column)
            if (cells.length > 3) {
              const craftModLink = cells[3]?.querySelector('a');
              if (craftModLink) {
                craftModName = craftModLink.textContent.trim();
                craftModUrl = craftModLink.href;
              } else {
                craftModName = cells[3]?.textContent?.trim() || "";
              }
            }
          }
          // Extract perk ID from href
          const perkIdMatch = href.match(/\/db\/perk\/([^\/]+)/);
          const perkId = perkIdMatch ? perkIdMatch[1] : null;
          perks.push({
            name: perkName,
            description: description,
            tier: tier,
            craftMod: {
              name: craftModName,
              url: craftModUrl
            },
            perkUrl: href,
            perkId: perkId,
            pageNumber: pageNumberArg
          });
        });
        return perks;
      }, pageNumber);

      console.log(`📦 Found ${pagePerks.length} perks on page ${pageNumber}`);
      return pagePerks;
    } catch (error) {
      console.error(`❌ Error scraping page ${pageNumber}:`, error);
      return [];
    }
  }

  async getTotalPages() {
    try {
      console.log("🔍 Determining total number of pages...");
      
      // Look for pagination elements
      const totalPages = await this.page.evaluate(() => {
        // Try to find the last page number in pagination
        const paginationLinks = document.querySelectorAll("a[href*='/db/perks/page/']");
        let maxPage = 1;

        paginationLinks.forEach(link => {
          const href = link.href;
          const match = href.match(/\/page\/(\d+)/);
          if (match) {
            const pageNum = parseInt(match[1]);
            if (pageNum > maxPage) {
              maxPage = pageNum;
            }
          }
        });

        // Also check for "Last" button or similar
        const lastButton = Array.from(document.querySelectorAll("a")).find(a => 
          a.textContent.includes("Last") || a.textContent.includes(">>")
        );

        if (lastButton) {
          const href = lastButton.href;
          const match = href.match(/\/page\/(\d+)/);
          if (match) {
            const pageNum = parseInt(match[1]);
            if (pageNum > maxPage) {
              maxPage = pageNum;
            }
          }
        }

        return maxPage;
      });

      console.log(`📊 Total pages found: ${totalPages}`);
      return totalPages;
    } catch (error) {
      console.error("❌ Error getting total pages:", error);
      return 1; // Default to 1 page if we can't determine
    }
  }

  async scrapeAllPerks() {
    try {
      console.log("🚀 Starting comprehensive perks scraping...");

      // Start with page 1 to get total pages
      const firstPagePerks = await this.scrapePerksPage(1);
      this.allPerks.push(...firstPagePerks);

      // Get total number of pages
      const totalPages = await this.getTotalPages();

      // Scrape remaining pages
      for (let page = 2; page <= totalPages; page++) {
        try {
          const pagePerks = await this.scrapePerksPage(page);
          this.allPerks.push(...pagePerks);

          // Small delay between requests to be respectful
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Failed to scrape page ${page}:`, error);
          // Continue with next page
        }
      }

      console.log(`✅ Scraping completed! Total perks found: ${this.allPerks.length}`);
      return this.allPerks;
    } catch (error) {
      console.error("❌ Error during comprehensive scraping:", error);
      throw error;
    }
  }

  async savePerksToFile(perks, filename = null) {
    try {
      const outputDir = path.join(__dirname, "..", "output");
      await fs.ensureDir(outputDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const defaultFilename = `nwdb-perks-${timestamp}.json`;
      const finalFilename = filename || defaultFilename;

      const filepath = path.join(outputDir, finalFilename);
      
      // Create a comprehensive data structure
      const perksData = {
        metadata: {
          source: "https://nwdb.info/db/perks",
          scrapedAt: new Date().toISOString(),
          totalPerks: perks.length,
          version: "1.0.0"
        },
        perks: perks,
        // Create perk name to URL mapping for easy lookup
        perkUrlMapping: {},
        // Create craft mod mapping
        craftModMapping: {}
      };

      // Build mappings
      perks.forEach(perk => {
        if (perk.perkUrl) {
          perksData.perkUrlMapping[perk.name] = perk.perkUrl;
        }
        if (perk.craftMod && perk.craftMod.url) {
          perksData.craftModMapping[perk.name] = {
            name: perk.craftMod.name,
            url: perk.craftMod.url
          };
        }
      });

      await fs.writeJson(filepath, perksData, { spaces: 2 });
      console.log(`💾 Perks data saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("❌ Error saving perks file:", error);
      throw error;
    }
  }

  generateSummary(perks) {
    const summary = {
      totalPerks: perks.length,
      uniquePerks: new Set(perks.map(p => p.name)).size,
      perksWithCraftMods: perks.filter(p => p.craftMod && p.craftMod.name).length,
      perksWithUrls: perks.filter(p => p.perkUrl).length,
      tierBreakdown: {},
      timestamp: new Date().toISOString(),
    };

    // Count tiers
    perks.forEach(perk => {
      if (perk.tier) {
        summary.tierBreakdown[perk.tier] = (summary.tierBreakdown[perk.tier] || 0) + 1;
      }
    });

    console.log("\n📊 NWDB Perks Scraping Summary:");
    console.log("=================================");
    console.log(`Total perks scraped: ${summary.totalPerks}`);
    console.log(`Unique perks: ${summary.uniquePerks}`);
    console.log(`Perks with craft mods: ${summary.perksWithCraftMods}`);
    console.log(`Perks with URLs: ${summary.perksWithUrls}`);
    console.log("\nTier Breakdown:");
    Object.entries(summary.tierBreakdown)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([tier, count]) => {
        console.log(`  ${tier}: ${count} perks`);
      });
    console.log(`\nCompleted at: ${summary.timestamp}`);

    return summary;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log("🔚 Browser closed");
    }
  }
}

// Main function to run the scraper
async function main() {
  const scraper = new NWDBPerksScraper({
    headless: true,
    waitForTimeout: 3000,
  });

  try {
    console.log("🎯 NWDB Perks Scraper Starting...");
    console.log("=================================");

    await scraper.initialize();

    // Scrape all perks
    const perks = await scraper.scrapeAllPerks();

    // Generate summary
    const summary = scraper.generateSummary(perks);

    // Save results
    await scraper.savePerksToFile(perks);

    console.log("\n✅ NWDB perks scraping completed successfully!");
  } catch (error) {
    console.error("\n❌ NWDB perks scraping failed:", error);
  } finally {
    await scraper.close();
  }
}

// Export the class for use in other files
module.exports = NWDBPerksScraper;

// Run main function if this file is executed directly
if (require.main === module) {
  main();
} 