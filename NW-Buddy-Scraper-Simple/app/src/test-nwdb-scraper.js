const puppeteer = require("puppeteer");

async function testNWDBScraping() {
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  try {
    console.log("🔧 Testing NWDB page structure...");
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the perks page
    await page.goto("https://nwdb.info/db/perks/page/1", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    console.log("📄 Page loaded, analyzing structure...");

    // Debug: Check what elements are available
    const pageInfo = await page.evaluate(() => {
      const info = {
        perkLinks: [],
        tables: [],
        totalLinks: 0,
        perkLinkCount: 0
      };

      // Count all links
      const allLinks = document.querySelectorAll('a');
      info.totalLinks = allLinks.length;

      // Find perk links
      const perkLinks = document.querySelectorAll('a[href*="/db/perk/"]');
      info.perkLinkCount = perkLinks.length;

      // Get first few perk links for debugging
      perkLinks.forEach((link, index) => {
        if (index < 5) {
          info.perkLinks.push({
            text: link.textContent.trim(),
            href: link.href,
            className: link.className
          });
        }
      });

      // Check for tables
      const tables = document.querySelectorAll('table');
      info.tables = tables.length;

      return info;
    });

    console.log("📊 Page Analysis Results:");
    console.log("==========================");
    console.log(`Total links on page: ${pageInfo.totalLinks}`);
    console.log(`Perk links found: ${pageInfo.perkLinkCount}`);
    console.log(`Tables found: ${pageInfo.tables}`);
    console.log("\nFirst 5 perk links:");
    pageInfo.perkLinks.forEach((link, index) => {
      console.log(`${index + 1}. "${link.text}" -> ${link.href}`);
    });

    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'nwdb-debug-screenshot.png',
      fullPage: true 
    });
    console.log("📸 Screenshot saved as 'nwdb-debug-screenshot.png'");

    // Wait a bit to see the page
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    await browser.close();
  }
}

testNWDBScraping(); 