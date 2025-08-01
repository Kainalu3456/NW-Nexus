const NWMPMarketScraper = require('./nwmp-market-scraper');

async function testNWMPScraper() {
  console.log('🧪 Testing NWMP Market Scraper...\n');
  
  const scraper = new NWMPMarketScraper();
  
  try {
    // Test 1: Initialize scraper
    console.log('📋 Test 1: Initializing scraper...');
    await scraper.initialize();
    console.log('✅ Initialization successful\n');
    
    // Test 2: Get servers
    console.log('📋 Test 2: Fetching available servers...');
    const servers = await scraper.getServers();
    console.log(`✅ Found ${servers.length} servers`);
    console.log('Sample servers:', servers.slice(0, 5).map(s => `${s.name} (${s.id})`).join(', '));
    console.log('');
    
    // Test 3: Fetch market prices for a few items
    console.log('📋 Test 3: Fetching market prices...');
    const testItems = {
      'Prismatic Ingot': 'ingott53',
      'Prismatic Leather': 'leathert53',
      'Armor Matrix': 'matrix_armor',
      'Weapon Matrix': 'matrix_weapon'
    };
    
    const results = await scraper.fetchMarketPrices('valhalla', testItems);
    
    console.log('\n📊 Test Results:');
    console.log('================');
    console.log(`Server: ${results.server}`);
    console.log(`Total items: ${results.totalItems}`);
    console.log(`Successful: ${results.successfulItems}`);
    console.log(`Failed: ${results.failedItems}`);
    console.log(`Timestamp: ${results.timestamp}`);
    
    if (Object.keys(results.prices).length > 0) {
      console.log('\n💰 Sample Prices:');
      Object.entries(results.prices).forEach(([item, price]) => {
        console.log(`  ${item}: ${price.toFixed(2)} gold`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => {
        console.log(`  ${error.item}: ${error.error}`);
      });
    }
    
    // Test 4: Save results
    console.log('\n📋 Test 4: Saving results...');
    const savedPath = await scraper.saveResults(results);
    console.log(`✅ Results saved to: ${savedPath}`);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNWMPScraper();
}

module.exports = testNWMPScraper; 