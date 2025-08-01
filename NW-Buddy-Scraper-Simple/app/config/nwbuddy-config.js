// Configuration for NW Buddy site crawling
const nwbuddyConfig = {
  // Common settings for nwbuddy sites
  crawlerOptions: {
    headless: true,
    timeout: 30000,
    waitForTimeout: 5000, // Longer wait for JavaScript-heavy sites
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    // Add specific selectors that indicate page is loaded
    waitForSelector: null, // e.g., '.item-list' or '#main-content'
  },

  // NW Buddy site URLs (add your specific URLs here)
  urls: [
    // Real build URL with Gorgon items
    "https://www.nw-buddy.de/gearsets/share/ipns/k51qzi5uqu5div37yqkk0n45fh3ubku2n9ec3gfbp2abryeev1siqydvshxbzt",
    // Add more specific URLs as needed
  ],

  // Site-specific selectors for extracting items
  selectors: {
    // Common selectors for item extraction
    itemContainer: ".item-container, .product-list, .item-list",
    itemTitle: ".item-title, .product-name, .title",
    itemDescription: ".item-description, .product-description, .description",
    itemPrice: ".price, .item-price, .cost",
    itemImage: ".item-image img, .product-image img",
    itemLink: ".item-link, .product-link",

    // Pagination selectors
    nextPage: ".next-page, .pagination-next",
    pageNumbers: ".page-number, .pagination-item",
  },

  // Output settings
  output: {
    format: "json", // 'json' or 'csv'
    includeFullDOM: true,
    includeMetadata: true,
    saveDirectory: "output/nwbuddy",
  },

  // Rate limiting settings
  rateLimit: {
    delayBetweenRequests: 1000, // 1 second between requests
    maxConcurrentPages: 1, // Number of pages to crawl simultaneously
  },

  // Error handling
  errorHandling: {
    maxRetries: 3,
    retryDelay: 2000,
    continueOnError: true,
  },
};

module.exports = nwbuddyConfig;
