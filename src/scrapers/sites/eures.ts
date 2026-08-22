import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS as siteConfigs } from '../../config/site-configs.js';
import { getBrowser } from '../browser.js';

export class EURESScraper extends BaseScraper {
  private config = siteConfigs['eures'];

  constructor() {
    super('https://europa.eu');
    this.minDelay = this.config.minDelayMs;
    this.maxDelay = this.config.maxDelayMs;
  }

  async fetchListingUrls(maxPages: number): Promise<string[]> {
    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    const urls: string[] = [];

    try {
      const searchUrl = 'https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=ai&publicationPeriod=LAST_DAY&lang=en';

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(this.config.minDelayMs);

      const jobLinks = await page.$$eval('a[href*="/jv-se/jv-details/"]', (links: Element[]) =>
        links.map(a => (a as HTMLAnchorElement).href)
      );
      urls.push(...jobLinks.slice(0, 10));
    } catch (err) {
      console.error('Error fetching EURES listings:', err);
    }

    return urls;
  }

  async fetchJobDescription(url: string): Promise<string> {
    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    let description = '';

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(this.config.minDelayMs);

      const jobData = await page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() ||
                     document.querySelector('h2')?.textContent?.trim() || '';
        const company = document.querySelector('[class*="company"]')?.textContent?.trim() ||
                       document.querySelector('[class*="employer"]')?.textContent?.trim() || '';
        const location = document.querySelector('[class*="location"]')?.textContent?.trim() ||
                        document.querySelector('[class*="city"]')?.textContent?.trim() || '';
        return { title, company, location };
      });

      description = `Title: ${jobData.title}\nCompany: ${jobData.company}\nLocation: ${jobData.location}`;
    } catch (err) {
      console.error(`Error fetching job description from ${url}:`, err);
    }

    return description;
  }

  async extractCompanyName(url: string, html: string): Promise<string | null> {
    const match = html.match(/Company:\s*(.+)/);
    return match ? match[1] : null;
  }
}
