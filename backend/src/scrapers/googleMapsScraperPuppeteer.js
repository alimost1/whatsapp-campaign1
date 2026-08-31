import puppeteer from 'puppeteer';
import { delay, normalizePhone } from './phoneScraper.js';

const GOOGLE_MAPS_URL = 'https://www.google.com/maps/search/';

async function scrapeGoogleMaps(query, options = {}) {
  const { 
    maxResults = 20, 
    location = 'Marrakech, Morocco', 
    headless = true,
    scrollAttempts = 10 
  } = options;

  const searchQuery = `${query} ${location}`;
  const url = `${GOOGLE_MAPS_URL}${encodeURIComponent(searchQuery)}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless,
      executablePath: '/snap/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await browser.newPage();
    
    // Set realistic viewport and user agent
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set language
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    });

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for results to load
    await page.waitForSelector('[role="feed"]', { timeout: 30000 }).catch(() => {
      console.log('Feed selector not found, trying alternative...');
    });

    // Scroll to load more results
    for (let i = 0; i < scrollAttempts; i++) {
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) {
          feed.scrollTop = feed.scrollHeight;
        }
      });
      await delay(1500);
    }

    // Extract place links
    const placeLinks = await page.evaluate(() => {
      const links = [];
      const feed = document.querySelector('[role="feed"]');
      if (feed) {
        const elements = feed.querySelectorAll('a[href*="/maps/place/"]');
        elements.forEach(el => {
          const href = el.href;
          const name = el.querySelector('.fontHeadlineSmall')?.textContent?.trim() || 
                       el.querySelector('[role="heading"]')?.textContent?.trim() ||
                       el.getAttribute('aria-label') || '';
          if (href && name) {
            links.push({ href, name });
          }
        });
      }
      return links;
    });

    console.log(`Found ${placeLinks.length} places`);

    // Visit each place to get details
    const results = [];
    for (const place of placeLinks.slice(0, maxResults)) {
      try {
        const details = await getPlaceDetails(page, place.href, place.name);
        if (details) {
          results.push(details);
        }
        await delay(1000); // Rate limiting
      } catch (error) {
        console.error(`Error getting details for ${place.name}:`, error.message);
      }
    }

    return results;
  } catch (error) {
    console.error('Google Maps scraping error:', error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function getPlaceDetails(page, placeUrl, placeName) {
  try {
    // Open place in new tab
    const detailPage = await page.browser().newPage();
    await detailPage.setViewport({ width: 1366, height: 768 });
    await detailPage.goto(placeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for details to load
    await delay(2000);

    // Extract phone number
    const phone = await detailPage.evaluate(() => {
      // Multiple selectors for phone
      const selectors = [
        'button[data-item-id="phone"]',
        'button[data-tooltip*="phone" i]',
        'button[aria-label*="phone" i]',
        '.rogA2c .Io6YTe',
        'span[aria-label*="phone" i]',
        'div[role="button"][data-item-id="phone"]',
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim() || 
                       el.getAttribute('aria-label') || 
                       el.getAttribute('data-item-id') || '';
          if (text && text.match(/[\d\s\+\-\(\)]{8,}/)) {
            return text;
          }
        }
      }
      
      // Fallback: search for phone pattern in page
      const bodyText = document.body.textContent;
      const phoneMatch = bodyText.match(/(\+?212|0)[\s\.\-]?[5-9][\s\.\-]?\d{3}[\s\.\-]?\d{3}/);
      if (phoneMatch) return phoneMatch[0];
      
      return null;
    });

    // Extract address
    const address = await detailPage.evaluate(() => {
      const selectors = [
        'button[data-item-id="address"]',
        'button[data-tooltip*="address" i]',
        'button[aria-label*="address" i]',
        '.rogA2c .Io6YTe:not([data-item-id="phone"])',
        'div[role="button"][data-item-id="address"]',
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          const text = el.textContent?.trim() || 
                       el.getAttribute('aria-label') || '';
          if (text && text.length > 5) {
            return text;
          }
        }
      }
      return null;
    });

    // Extract website
    const website = await detailPage.evaluate(() => {
      const selectors = [
        'a[data-item-id="authority"]',
        'a[href^="http"]:not([href*="google"]):not([href*="maps"])',
        'button[data-tooltip*="website" i]',
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          return el.href || el.textContent?.trim() || '';
        }
      }
      return null;
    });

    // Extract rating
    const rating = await detailPage.evaluate(() => {
      const el = document.querySelector('[role="img"][aria-label*="star" i], .fontDisplayLarge, .F7nice');
      if (el) {
        const text = el.textContent?.trim() || el.getAttribute('aria-label') || '';
        const match = text.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : null;
      }
      return null;
    });

    // Extract reviews count
    const reviews = await detailPage.evaluate(() => {
      const el = document.querySelector('button[jsaction*="review"] span, .fontBodyMedium span');
      if (el) {
        const text = el.textContent?.trim() || '';
        const match = text.match(/(\d[\d\s]*)/);
        return match ? parseInt(match[1].replace(/\s/g, '')) : null;
      }
      return null;
    });

    // Extract category/type
    const category = await detailPage.evaluate(() => {
      const el = document.querySelector('.DkEaL, .fontBodyMedium span[aria-label], button[jsaction*="category"]');
      if (el) {
        return el.textContent?.trim() || '';
      }
      return null;
    });

    await detailPage.close();

    return {
      name: placeName,
      phone: normalizePhone(phone),
      address,
      website,
      rating,
      reviews,
      category,
      url: placeUrl,
      source: 'google_maps',
      scraped_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error extracting details for ${placeName}:`, error.message);
    return null;
  }
}

async function scrapeCategory(category, location, maxResults = 20, options = {}) {
  const queries = {
    'real_estate': ['agence immobilière', 'immobilier', 'agence immobiliere', 'promoteur immobilier'],
    'restaurants': ['restaurant', 'resto', 'brasserie'],
    'hotels': ['hôtel', 'hotel', 'riad', 'maison d\'hôtes'],
    'cafes': ['café', 'cafe', 'salon de thé'],
    'shops': ['magasin', 'boutique', 'commerce', 'centre commercial'],
    'services': ['service', 'artisan', 'entreprise'],
    'doctors': ['médecin', 'docteur', 'cabinet médical', 'clinique'],
    'lawyers': ['avocat', 'cabinet avocat', 'notaire'],
    'schools': ['école', 'ecole', 'université', 'lycée', 'collège'],
  };
  
  const searchTerms = queries[category] || [category];
  const allResults = [];
  
  for (const term of searchTerms) {
    console.log(`\n🔍 Searching: "${term}" in ${location}`);
    const results = await scrapeGoogleMaps(term, { ...options, location, maxResults });
    allResults.push(...results);
    
    if (allResults.length >= maxResults) break;
    await delay(3000); // Rate limiting between searches
  }
  
  // Deduplicate by phone number
  const seen = new Set();
  const unique = allResults.filter(place => {
    const key = place.phone || place.url;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return unique.slice(0, maxResults);
}

export { scrapeGoogleMaps, scrapeCategory, getPlaceDetails };