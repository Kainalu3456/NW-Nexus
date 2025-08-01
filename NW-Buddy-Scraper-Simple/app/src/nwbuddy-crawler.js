const WebCrawler = require("./crawler");
const nwbuddyConfig = require("../config/nwbuddy-config");
const NWMPMarketScraper = require("./nwmp-market-scraper");
const fs = require('fs');
const path = require('path');

class NWBuddyCrawler extends WebCrawler {
  constructor(config = nwbuddyConfig) {
    super(config.crawlerOptions);
    this.config = config;
    this.marketScraper = null;
  }

  async crawlNWBuddyPage(url, includeMarketPrices = false, serverId = 'valhalla') {
    try {
      console.log(`🔍 Crawling NW Buddy page: ${url}`);

      // Use the parent class method to get the page with NW Buddy data extraction
      const pageData = await this.crawlPage(url, true);

      // Load crafting recipes
      const recipesPath = path.resolve(__dirname, '../config/crafting-recipes.txt');
      const recipes = parseCraftingRecipes(recipesPath);
      console.log('Loaded recipes for:', Object.keys(recipes).length, 'items');

      // Enrich items with crafting materials if a recipe exists
      if (pageData.nwBuddyData && Array.isArray(pageData.nwBuddyData.items)) {
        pageData.nwBuddyData.items.forEach(item => {
          const normName = normalizeName(item.name);
          let found = recipes[normName];
          if (!found) {
            found = fuzzyRecipeMatch(normName, recipes);
          }
          if (found) {
            item.craftingMaterials = found;
            console.log('DEBUG: Attached craftingMaterials to', item.name, found);
          } else if (normName.includes("gorgon")) {
            console.warn('No recipe found for:', item.name, 'normalized:', normName);
          }
        });
      }

      // Fetch market prices if requested
      if (includeMarketPrices) {
        try {
          console.log(`💰 Fetching market prices for server: ${serverId}`);
          
          if (!this.marketScraper) {
            this.marketScraper = new NWMPMarketScraper();
            await this.marketScraper.initialize();
          }
          
          const marketPrices = await this.marketScraper.fetchMarketPrices(serverId);
          pageData.marketPrices = marketPrices;
          
          // Calculate crafting costs for each item
          const craftingCosts = await this.marketScraper.calculateCraftingCosts(pageData, marketPrices.prices);
          pageData.craftingCosts = craftingCosts;
          
          console.log(`✅ Market prices fetched and crafting costs calculated`);
        } catch (error) {
          console.error('❌ Failed to fetch market prices:', error.message);
          pageData.marketPrices = { error: error.message };
        }
      }

      const artifactCount = pageData.nwBuddyData?.artifactCount || 0;
      console.log(
        `📦 Found ${pageData.nwBuddyData?.itemNames.length || 0} items and ${
          pageData.nwBuddyData?.perkNames.length || 0
        } perks${artifactCount > 0 ? ` (${artifactCount} artifacts)` : ''}`
      );

      // Debug: print all normalized item names
      const allNormItemNames = pageData.nwBuddyData.items.map(item => normalizeName(item.name));
      console.log('DEBUG: All normalized item names:', allNormItemNames);
      // Debug: print all normalized recipe keys
      console.log('DEBUG: All normalized recipe keys:', Object.keys(recipes));

      // Diagnostic: print char codes for each item and recipe key
      function charCodes(str) {
        return str.split('').map(c => c.charCodeAt(0));
      }
      allNormItemNames.forEach(itemName => {
        console.log('ITEM:', itemName, '| length:', itemName.length, '| codes:', charCodes(itemName));
      });
      Object.keys(recipes).forEach(recipeKey => {
        console.log('RECIPE:', recipeKey, '| length:', recipeKey.length, '| codes:', charCodes(recipeKey));
      });

      return pageData;
    } catch (error) {
      console.error(`❌ Error crawling NW Buddy page ${url}:`, error);
      throw error;
    }
  }

  async crawlAllNWBuddyPages() {
    const results = [];

    console.log(
      `🚀 Starting NW Buddy crawl for ${this.config.urls.length} pages`
    );

    for (const url of this.config.urls) {
      try {
        const result = await this.crawlNWBuddyPage(url);
        results.push(result);

        // Rate limiting
        if (this.config.rateLimit.delayBetweenRequests > 0) {
          console.log(
            `⏱️  Waiting ${this.config.rateLimit.delayBetweenRequests}ms before next request...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.config.rateLimit.delayBetweenRequests)
          );
        }
      } catch (error) {
        console.error(`❌ Failed to crawl ${url}:`, error);

        if (this.config.errorHandling.continueOnError) {
          results.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  async saveResults(results, customFilename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = customFilename || `nwbuddy-results-${timestamp}.json`;

      // Create output directory if it doesn't exist
      const outputDir = this.config.output.saveDirectory || "output/nwbuddy";
      const fs = require("fs-extra");
      await fs.ensureDir(outputDir);

      const filepath = `${outputDir}/${filename}`;
      await fs.writeJson(filepath, results, { spaces: 2 });

      console.log(`💾 Results saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("❌ Error saving results:", error);
      throw error;
    }
  }

  generateSummary(results) {
    const summary = {
      totalPages: results.length,
      successfulPages: results.filter((r) => !r.error).length,
      failedPages: results.filter((r) => r.error).length,
      totalItems: results.reduce(
        (sum, r) => sum + (r.nwBuddyData?.itemNames.length || 0),
        0
      ),
      totalPerks: results.reduce(
        (sum, r) => sum + (r.nwBuddyData?.perkNames.length || 0),
        0
      ),
      totalArtifacts: results.reduce(
        (sum, r) => sum + (r.nwBuddyData?.artifactCount || 0),
        0
      ),
      timestamp: new Date().toISOString(),
    };

    console.log("\n📊 Crawl Summary:");
    console.log("================");
    console.log(`Total pages: ${summary.totalPages}`);
    console.log(`Successful: ${summary.successfulPages}`);
    console.log(`Failed: ${summary.failedPages}`);
    console.log(`Total items found: ${summary.totalItems}`);
    console.log(`Total perks found: ${summary.totalPerks}`);
    console.log(`Total artifacts found: ${summary.totalArtifacts}`);
    console.log(`Completed at: ${summary.timestamp}`);

    return summary;
  }
}

function normalizeName(name) {
  return name.trim().toLowerCase();
}

function parseCraftingRecipes(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const recipes = {};
  let currentItem = null;
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Recipe: ')) {
      currentItem = normalizeName(trimmed.replace('Recipe: ', ''));
      recipes[currentItem] = [];
    } else if (currentItem && trimmed && !trimmed.startsWith('Recipe:')) {
      recipes[currentItem].push(trimmed);
    }
  }
  return recipes;
}

function fuzzyRecipeMatch(normName, recipes) {
  if (recipes[normName]) return recipes[normName];

  // Synonym replacements
  const synonyms = [
    [/sabatons/g, 'boots'],
    [/darkplate/g, 'cuirass'],
    [/handcovers/g, 'gloves'],
    [/pants/g, 'leggings'],
    [/antlers/g, 'hat'],
    [/helm/g, 'hat'],
    [/void gauntlet/g, 'ice gauntlet'],
    [/greaves/g, 'leggings'],
    [/kite shield/g, 'round shield'], // fallback
    [/tower shield/g, 'round shield'], // fallback
    [/gorgonite/g, "gorgon's"],
    [/gorgon's/g, 'gorgonite'],
  ];

  let alt = normName;
  for (const [pattern, replacement] of synonyms) {
    alt = alt.replace(pattern, replacement);
    if (recipes[alt]) {
      console.log(`DEBUG: Synonym matched "${normName}" -> "${alt}"`);
      return recipes[alt];
    }
  }

  // Partial/slot-based matching for Gorgon/Gorgonite
  const slotWords = ['mask','shirt','handcovers','leggings','sandals','hat','helm','cuirass','gloves','pants','boots','antlers','breastplate','gauntlets','greaves','ring','earring','amulet','flail','void gauntlet','rapier','longsword','hatchet','tower shield','kite shield','round shield'];
  const gorgonLike = /(gorgon|gorgonite)/;
  if (gorgonLike.test(normName)) {
    for (const slot of slotWords) {
      if (normName.includes(slot)) {
        // Try to find any recipe with both gorgon/gorgonite and the slot (substring match)
        const matchKey = Object.keys(recipes).find(key => gorgonLike.test(key) && (key.includes(slot) || slot.includes(key)));
        if (matchKey) {
          console.log(`DEBUG: Slot-based fallback matched "${normName}" -> "${matchKey}"`);
          return recipes[matchKey];
        }
      }
    }
  }

  return null;
}

// Main function to run the NW Buddy crawler
async function main() {
  const crawler = new NWBuddyCrawler();

  try {
    console.log("🎯 NW Buddy Crawler Starting...");
    console.log("=================================");

    await crawler.initialize();

    // Check command line arguments for market prices
    const includeMarketPrices = process.argv.includes('--market-prices') || process.argv.includes('-m');
    const serverIndex = process.argv.indexOf('--server');
    const serverId = serverIndex !== -1 && process.argv[serverIndex + 1] ? process.argv[serverIndex + 1] : 'valhalla';

    if (includeMarketPrices) {
      console.log(`💰 Market prices enabled for server: ${serverId}`);
    }

    // Crawl all configured pages
    const results = [];
    for (const url of crawler.config.urls) {
      try {
        const result = await crawler.crawlNWBuddyPage(url, includeMarketPrices, serverId);
        results.push(result);

        // Rate limiting
        if (crawler.config.rateLimit.delayBetweenRequests > 0) {
          console.log(
            `⏱️  Waiting ${crawler.config.rateLimit.delayBetweenRequests}ms before next request...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, crawler.config.rateLimit.delayBetweenRequests)
          );
        }
      } catch (error) {
        console.error(`❌ Failed to crawl ${url}:`, error);

        if (crawler.config.errorHandling.continueOnError) {
          results.push({
            url,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        } else {
          throw error;
        }
      }
    }

    // Generate summary
    const summary = crawler.generateSummary(results);

    // Save results
    await crawler.saveResults(results);

    console.log("\n✅ NW Buddy crawl completed successfully!");
  } catch (error) {
    console.error("\n❌ NW Buddy crawl failed:", error);
  } finally {
    await crawler.close();
  }
}

// Export the class for use in other files
module.exports = NWBuddyCrawler;

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
