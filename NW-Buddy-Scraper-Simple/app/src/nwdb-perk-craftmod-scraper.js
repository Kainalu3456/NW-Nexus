const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '..', 'output', 'nwdb-perks-2025-07-06T03-41-33-584Z.json');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

async function getCraftModItemName(page) {
  await page.waitForSelector('.stats-container', { timeout: 10000 });
  return await page.evaluate(() => {
    const debug = {};
    // Find the Craft Mod header span by class and text
    const craftModHeader = Array.from(document.querySelectorAll('span.container-sub-panel-header')).find(
      el => el.textContent.trim() === 'Craft Mod'
    );
    debug.craftModHeaderFound = !!craftModHeader;
    if (!craftModHeader) return { value: null, debug };
    // The next sibling should be the container-sub-panel
    let panel = craftModHeader.nextElementSibling;
    debug.panelFound = !!panel;
    debug.panelClass = panel ? panel.className : null;
    if (panel && panel.classList.contains('container-sub-panel')) {
      const itemLink = panel.querySelector('a[href^="/db/item/"]');
      debug.itemLinkFound = !!itemLink;
      debug.itemLinkHref = itemLink ? itemLink.getAttribute('href') : null;
      if (itemLink) {
        const itemSpan = itemLink.querySelector('span.table-item-name');
        debug.itemSpanFound = !!itemSpan;
        debug.itemSpanText = itemSpan ? itemSpan.textContent.trim() : null;
        if (itemSpan) {
          return { value: itemSpan.textContent.trim(), debug };
        }
      }
    }
    return { value: null, debug };
  });
}

async function main() {
  const perksData = await fs.readJson(INPUT_FILE);
  const perks = perksData.perks;
  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  // Process all perks
  let successCount = 0;
  let failCount = 0;
  for (let i = 0; i < perks.length; i++) {
    const perk = perks[i];
    if (!perk.perkUrl) continue;
    try {
      console.log(`\n[${i+1}/${perks.length}] ${perk.name}`);
      console.log(`  URL: ${perk.perkUrl}`);
      await page.goto(perk.perkUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(res => setTimeout(res, 1000)); // Wait 1s so user can see the page
      const craftModResult = await getCraftModItemName(page);
      const craftModItem = craftModResult.value;
      perk.craftModItem = craftModItem;
      console.log('  Debug:', JSON.stringify(craftModResult.debug, null, 2));
      if (craftModItem) {
        successCount++;
        console.log(`  ✓ Craft Mod Item: ${craftModItem}`);
      } else {
        failCount++;
        console.log('  ✗ Craft Mod Item: null');
      }
      console.log(`  Success: ${successCount} | Fail: ${failCount}`);
      await new Promise(res => setTimeout(res, 500));
    } catch (err) {
      failCount++;
      console.error(`  ✗ Failed for ${perk.perkUrl}:`, err.message);
      perk.craftModItem = null;
      console.log(`  Success: ${successCount} | Fail: ${failCount}`);
    }
  }

  await browser.close();

  // Save the enriched data
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join(OUTPUT_DIR, `nwdb-perks-craftmod-${timestamp}.json`);
  await fs.writeJson(outputFile, { ...perksData, perks }, { spaces: 2 });
  console.log(`\n✅ Done! Output written to ${outputFile}`);
}

if (require.main === module) {
  main();
} 