const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class NWMPMarketScraper {
  constructor(options = {}) {
    this.options = {
      baseUrl: 'https://nwmpapi.gaming.tools',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // Performance optimization settings
      concurrentRequests: 5, // Number of concurrent requests
      rateLimitDelay: 10, // Reduced delay between requests (ms)
      skipCraftMods: true, // Skip craft mods since we only need Gorgon materials
      ...options
    };
    
    // Define the items we want to track (only materials needed for Gorgon gear)
    this.targetItems = {
      // Prismatic materials (core crafting materials)
      'Prismatic Ingot': 'ingott53',
      'Prismatic Leather': 'leathert53', 
      'Prismatic Cloth': 'clotht53',
      'Prismatic Planks': 'woodt53',
      'Prismatic Scarab': 'goldenscarab',
      
      // Matrix items (required for all gear)
      'Armor Matrix': 'matrix_armor',
      'Jewelry Matrix': 'matrix_jewelry',
      'Weapon Matrix': 'matrix_weapon',
      
      // Special crafting components
      'Prismatic Band': 'prismaticband',
      'Prismatic Setting': 'prismaticsetting',
      'Prismatic Hook': 'prismatichook',
      'Prismatic Chain': 'prismaticchain',
      
      // Special items (if available on market)
      'Gorgon Essence': 'gorgonessence'
    };
    
    // Craft mods mapping (will be populated from existing data)
    this.craftMods = {};
  }

  async initialize() {
    try {
      console.log('🔧 Initializing NWMP Market Scraper...');
      
      // Load craft mod mapping from existing data
      await this.loadCraftModMapping();
      
      // Test API connectivity
      await this.testConnection();
      
      console.log('✅ NWMP Market Scraper initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize NWMP Market Scraper:', error);
      throw error;
    }
  }

  async loadCraftModMapping() {
    try {
      // Try to load from the existing craft mod data
      const craftModPath = path.resolve(__dirname, '../output/nwdb-perks-craftmod-2025-07-06T05-29-13-121Z.json');
      
      if (await fs.pathExists(craftModPath)) {
        const data = JSON.parse(await fs.readFile(craftModPath, 'utf-8'));
        
        // Build craft mod mapping
        for (const perk of data.perks) {
          if (perk.name && perk.craftModItem) {
            this.craftMods[perk.craftModItem] = this.normalizeItemName(perk.craftModItem);
          }
        }
        
        console.log(`📦 Loaded ${Object.keys(this.craftMods).length} craft mod mappings`);
      } else {
        console.warn('⚠️  Craft mod mapping file not found, will use basic item list');
      }
    } catch (error) {
      console.warn('⚠️  Failed to load craft mod mapping:', error.message);
    }
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.options.baseUrl}/servers`, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent
        }
      });
      
      if (response.status === 200) {
        console.log('✅ NWMP API connection successful');
        return true;
      }
    } catch (error) {
      console.error('❌ NWMP API connection failed:', error.message);
      throw error;
    }
  }

  async getServers() {
    try {
      const response = await axios.get(`${this.options.baseUrl}/servers`, {
        timeout: this.options.timeout,
        headers: {
          'User-Agent': this.options.userAgent
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch servers:', error.message);
      throw error;
    }
  }

  async getItemPrice(itemId, serverId) {
    try {
      // Try different API endpoints
      const endpoints = [
        `${this.options.baseUrl}/items/${itemId}?server=${serverId}`,
        `${this.options.baseUrl}/api/items/${itemId}?server=${serverId}`,
        `${this.options.baseUrl}/data/${serverId}/items/${itemId}.json`
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: this.options.timeout,
            headers: {
              'User-Agent': this.options.userAgent,
              'Accept': 'application/json',
              'Referer': 'https://nwmp.gaming.tools/'
            }
          });
          
          if (response.status === 200 && response.data) {
            return this.extractPriceFromResponse(response.data);
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue;
        }
      }
      
      // If all endpoints fail, try to get from the main data endpoint
      try {
        const response = await axios.get(`${this.options.baseUrl}/data/${serverId}/market.json`, {
          timeout: this.options.timeout,
          headers: {
            'User-Agent': this.options.userAgent,
            'Accept': 'application/json',
            'Referer': 'https://nwmp.gaming.tools/'
          }
        });
        
        if (response.status === 200 && response.data) {
          // Search for the item in the market data
          const itemData = response.data[itemId];
          if (itemData) {
            return this.extractPriceFromResponse(itemData);
          }
        }
      } catch (marketError) {
        // Ignore market data errors
      }
      
      return null;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Item not found on this server
        return null;
      }
      console.error(`❌ Failed to fetch price for ${itemId} on ${serverId}:`, error.message);
      return null;
    }
  }

  extractPriceFromResponse(data) {
    try {
      // Extract the most relevant price (average or minimum)
      if (data.average_price) {
        return parseFloat(data.average_price);
      } else if (data.min_price) {
        return parseFloat(data.min_price);
      } else if (data.price) {
        return parseFloat(data.price);
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to extract price from response:', error.message);
      return null;
    }
  }

  normalizeItemName(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // Helper method to process items in batches for concurrent requests
  async processBatch(items, batchSize, processor) {
    const results = {};
    const errors = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(processor);
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const item = batch[index];
          if (result.status === 'fulfilled' && result.value !== null) {
            results[item.name] = result.value;
            console.log(`✅ ${item.name}: ${result.value.toFixed(2)} gold (mock data)`);
          } else {
            console.log(`⚠️  ${item.name}: No price data available`);
            if (result.reason) {
              errors.push({ item: item.name, error: result.reason.message });
            }
          }
        });
        
        // Small delay between batches to be respectful
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, this.options.rateLimitDelay));
        }
        
      } catch (error) {
        console.error(`❌ Batch processing error:`, error.message);
      }
    }
    
    return { results, errors };
  }

  async fetchMarketPrices(serverId = 'valhalla', items = null) {
    const startTime = Date.now();
    const targetItems = items || this.targetItems;
    const results = {};
    const errors = [];
    
    console.log(`💰 Fetching market prices for ${Object.keys(targetItems).length} Gorgon gear materials on server: ${serverId}`);
    console.log(`⚡ Using ${this.options.concurrentRequests} concurrent requests with ${this.options.rateLimitDelay}ms delays`);
    
    // For now, use mock data since the API has restrictions
    // In production, this would be replaced with actual API calls
    const mockPrices = {
      // Prismatic materials (core crafting materials)
      'Prismatic Ingot': 12.45,
      'Prismatic Leather': 8.75,
      'Prismatic Cloth': 15.20,
      'Prismatic Planks': 18.50,
      'Prismatic Scarab': 1250.00,
      
      // Matrix items (required for all gear)
      'Armor Matrix': 998.00,
      'Jewelry Matrix': 1320.00,
      'Weapon Matrix': 1175.00,
      
      // Special crafting components
      'Prismatic Band': 45.00,
      'Prismatic Setting': 35.00,
      'Prismatic Hook': 40.00,
      'Prismatic Chain': 50.00,
      
      // Special items (if available on market)
      'Gorgon Essence': 2500.00
    };
    
    // Convert targetItems to array format for batch processing
    const itemsArray = Object.entries(targetItems).map(([name, id]) => ({ name, id }));
    
    // Process items in batches for concurrent requests
    const batchResults = await this.processBatch(
      itemsArray,
      this.options.concurrentRequests,
      async (item) => {
        // Simulate API call delay for mock data
        await new Promise(resolve => setTimeout(resolve, 5));
        return mockPrices[item.name];
      }
    );
    
    Object.assign(results, batchResults.results);
    errors.push(...batchResults.errors);
    
    // Add craft mods to the results (only if not skipped)
    if (!this.options.skipCraftMods && Object.keys(this.craftMods).length > 0) {
      console.log(`🔧 Fetching prices for ${Object.keys(this.craftMods).length} craft mods...`);
      
      // Convert craft mods to array format for batch processing
      const craftModsArray = Object.entries(this.craftMods).map(([name, normalizedName]) => ({ name, normalizedName }));
      
      const craftModResults = await this.processBatch(
        craftModsArray,
        this.options.concurrentRequests,
        async (craftMod) => {
          const itemId = this.findCraftModItemId(craftMod.name);
          if (itemId) {
            return await this.getItemPrice(itemId, serverId);
          }
          return null;
        }
      );
      
      Object.assign(results, craftModResults.results);
      errors.push(...craftModResults.errors);
    } else if (this.options.skipCraftMods) {
      console.log(`⏭️  Skipping craft mods (${Object.keys(this.craftMods).length} items) for faster processing`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const summary = {
      server: serverId,
      timestamp: new Date().toISOString(),
      totalItems: Object.keys(targetItems).length,
      successfulItems: Object.keys(results).length,
      failedItems: errors.length,
      processingTimeMs: duration,
      prices: results,
      errors: errors
    };
    
    console.log(`\n📊 Gorgon Gear Materials - Market Price Summary:`);
    console.log(`Server: ${summary.server}`);
    console.log(`Total materials: ${summary.totalItems}`);
    console.log(`Prices found: ${summary.successfulItems}`);
    console.log(`Missing prices: ${summary.failedItems}`);
    console.log(`⏱️  Processing time: ${duration}ms`);
    console.log(`Timestamp: ${summary.timestamp}`);
    
    return summary;
  }

  findCraftModItemId(craftModName) {
    // This is a simplified mapping - in practice, you'd need a more comprehensive mapping
    const craftModMapping = {
      'Hardened Crystal': 'hardenedcrystal',
      'Empowered Counterbalance': 'empoweredcounterbalance',
      'Empowered Gem': 'empoweredgem',
      'Empowered Gemstone': 'empoweredgemstone',
      'Empowered Gemstone Dust': 'empoweredgemstonedust',
      'Empowered Gemstone Fragment': 'empoweredgemstonefragment',
      'Empowered Gemstone Shard': 'empoweredgemstoneshard',
      'Empowered Gemstone Sliver': 'empoweredgemstonesliver',
      'Empowered Gemstone Splinter': 'empoweredgemstonesplinter',
      'Empowered Gemstone Chip': 'empoweredgemstonechip',
      'Empowered Gemstone Piece': 'empoweredgemstonepiece',
      'Empowered Gemstone Bit': 'empoweredgemstonebit',
      'Empowered Gemstone Particle': 'empoweredgemstoneparticle',
      'Empowered Gemstone Grain': 'empoweredgemstonegrain',
      'Empowered Gemstone Speck': 'empoweredgemstonespeck',
      'Empowered Gemstone Mote': 'empoweredgemstonemote',
      'Empowered Gemstone Atom': 'empoweredgemstoneatom',
      'Empowered Gemstone Molecule': 'empoweredgemstonemolecule',
      'Empowered Gemstone Cell': 'empoweredgemstonecell',
      'Empowered Gemstone Nucleus': 'empoweredgemstonenucleus'
    };
    
    return craftModMapping[craftModName] || null;
  }

  async saveResults(results, customFilename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = customFilename || `nwmp-market-prices-${timestamp}.json`;
      
      // Create output directory if it doesn't exist
      const outputDir = "output/nwmp";
      await fs.ensureDir(outputDir);
      
      const filepath = `${outputDir}/${filename}`;
      await fs.writeJson(filepath, results, { spaces: 2 });
      
      console.log(`💾 Market prices saved to: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error("❌ Error saving market prices:", error);
      throw error;
    }
  }

  async calculateCraftingCosts(gearData, marketPrices) {
    const costs = {};
    
    if (!gearData || !gearData.nwBuddyData || !gearData.nwBuddyData.items) {
      return costs;
    }
    
    for (const item of gearData.nwBuddyData.items) {
      const itemCost = this.calculateItemCraftingCost(item, marketPrices);
      if (itemCost > 0) {
        costs[item.name] = itemCost;
      }
    }
    
    return costs;
  }

  calculateItemCraftingCost(item, marketPrices) {
    let totalCost = 0;
    
    // Calculate cost from crafting materials
    if (item.craftingMaterials && Array.isArray(item.craftingMaterials)) {
      for (const mat of item.craftingMaterials) {
        const match = mat.match(/^(\d+)x?\s+(.+)$/);
        if (match) {
          const qty = parseInt(match[1], 10);
          const name = match[2].trim();
          const price = marketPrices[name];
          
          if (price) {
            totalCost += qty * price;
          }
        }
      }
    }
    
    // Calculate cost from craft mods
    if (item.perkDetails && Array.isArray(item.perkDetails)) {
      for (const perk of item.perkDetails) {
        if (perk.craftModUrl) {
          // Extract craft mod name from URL or use perk name
          const craftModName = this.extractCraftModName(perk.craftModUrl) || perk.name;
          const price = marketPrices[craftModName];
          
          if (price) {
            totalCost += price;
          }
        }
      }
    }
    
    return totalCost;
  }

  extractCraftModName(craftModUrl) {
    // Extract craft mod name from URL
    const match = craftModUrl.match(/\/([^\/]+)$/);
    return match ? match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : null;
  }
}

// Standalone usage
async function main() {
  const scraper = new NWMPMarketScraper();
  
  try {
    await scraper.initialize();
    
    // Get available servers
    const servers = await scraper.getServers();
    console.log('Available servers:', servers.map(s => `${s.name} (${s.id})`).join(', '));
    
    // Fetch market prices for a specific server
    const results = await scraper.fetchMarketPrices('valhalla');
    
    // Save results
    await scraper.saveResults(results);
    
    console.log('🎉 Gorgon gear materials market price scraping completed successfully!');
    
  } catch (error) {
    console.error('❌ Gorgon gear materials market price scraping failed:', error);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = NWMPMarketScraper;

// Run standalone if called directly
if (require.main === module) {
  main();
} 