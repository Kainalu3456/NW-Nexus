const WebCrawler = require("./crawler");

async function testCrawler() {
  console.log("🚀 Testing Web Crawler");
  console.log("====================");

  const crawler = new WebCrawler({
    headless: false, // Set to true for production
    waitForTimeout: 10000,
    timeout: 60000,
  });

  try {
    await crawler.initialize();

    // Test URLs - replace with actual nwbuddy URLs
    const testUrls = [
      "https://www.nw-buddy.de/gearsets/share/ipns/k51qzi5uqu5div37yqkk0n45fh3ubku2n9ec3gfbp2abryeev1siqydvshxbzt",
    ];

    console.log(`\n📄 Testing with ${testUrls.length} URLs:`);
    testUrls.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    console.log("\n⏳ Starting crawl...");
    const results = await crawler.crawlMultiplePages(testUrls, true); // Enable NW Buddy data extraction

    // Display results summary
    console.log("\n📊 Results Summary:");
    console.log("==================");
    results.forEach((result, index) => {
      if (result.error) {
        console.log(`${index + 1}. ❌ ${result.url} - Error: ${result.error}`);
      } else {
        console.log(`${index + 1}. ✅ ${result.title || "No title"}`);
        console.log(`   URL: ${result.url}`);
        console.log(
          `   Content Length: ${result.contentLength.toLocaleString()} characters`
        );
        console.log(`   Timestamp: ${result.timestamp}`);

        // Display extracted NW Buddy data if available
        if (result.nwBuddyData) {
          console.log(`   📦 Items found: ${result.nwBuddyData.totalItems}`);
          console.log(
            `   ⚡ Unique perks found: ${result.nwBuddyData.totalPerks}`
          );

          // Show items with their perks
          if (result.nwBuddyData.items && result.nwBuddyData.items.length > 0) {
            console.log(`\n   📦 Items with Perks:`);
            result.nwBuddyData.items.slice(0, 3).forEach((item, index) => {
              console.log(
                `   ${index + 1}. ${item.name} (${item.perks.length} perks)`
              );
              if (item.perks.length > 0) {
                const perksList = item.perks.slice(0, 3).join(", ");
                console.log(
                  `      ⚡ ${perksList}${item.perks.length > 3 ? "..." : ""}`
                );
              }
            });

            if (result.nwBuddyData.items.length > 3) {
              console.log(
                `   ... and ${result.nwBuddyData.items.length - 3} more items`
              );
            }
          }
        }
      }
      console.log("");
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filepath = await crawler.saveToFile(
      results,
      `test-results-${timestamp}.json`
    );

    console.log(`\n💾 Results saved to: ${filepath}`);
    console.log(`\n✅ Test completed successfully!`);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  } finally {
    await crawler.close();
  }
}

// Run the test
if (require.main === module) {
  testCrawler();
}
