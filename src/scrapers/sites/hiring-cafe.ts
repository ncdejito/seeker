import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS, isPathAllowed } from '../../config/site-configs.js';
import { getBrowser } from '../browser.js';

export class HiringCafeScraper extends BaseScraper {
  private config = SCRAPER_CONFIGS['hiring-cafe'];

  constructor() {
    super('https://hiring.cafe');
    if (this.config) {
      this.minDelay = this.config.minDelayMs;
      this.maxDelay = this.config.maxDelayMs;
    }
  }

  async fetchListingUrls(maxPages: number): Promise<string[]> {
    if (!this.config?.enabled) {
      console.warn(`Hiring Cafe scraper disabled: ${this.config?.notes}`);
      return [];
    }

    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    const urls: string[] = [];

    try {
      const searchState = {
        seniorityLevel: ["Mid Level", "Senior Level"],
        roleTypes: ["Individual Contributor"],
        dateFetchedPastNDays: 14,
        locations: [
          {"id":"ZhY1yZQBoEtHp_8UEq3V","types":["country"],"address_components":[{"long_name":"Germany","short_name":"DE","types":["country"]}],"formatted_address":"Germany","population":82927922,"workplace_types":[],"options":{"flexible_regions":["anywhere_in_continent","anywhere_in_world"]}}
        ],
        jobTitleQuery: '("ai" OR "ml") AND "engineer"',
        excludedCompanyKeywords: ["defense"]
      };
      
      const url = `https://hiring.cafe/?searchState=${encodeURIComponent(JSON.stringify(searchState))}`;
      
      // Check robots compliance
      if (!isPathAllowed('hiring-cafe', '/')) {
        console.warn('Hiring Cafe: path not allowed by robots.txt');
        return [];
      }

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(this.config.minDelayMs);

      const jobLinks = await page.$$eval('a[href*="/viewjob/"]', (links: Element[]) => {
        return links
          .filter(a => !a.textContent?.includes('View all'))
          .slice(0, 10)
          .map(a => (a as HTMLAnchorElement).href);
      });

      urls.push(...jobLinks);
    } catch (err) {
      console.error('Error fetching Hiring Cafe listings:', err);
    }

    return urls;
  }

  async fetchJobDescription(url: string): Promise<string> {
    if (!isPathAllowed('hiring-cafe', '/viewjob/')) {
      return '';
    }

    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    let description = '';

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(this.config?.minDelayMs || 2000);

      const jobData = await page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() || 
                    document.querySelector('h2')?.textContent?.trim() || '';
        const company = document.querySelector('[class*="company"]')?.textContent?.trim() || '';
        const location = document.querySelector('[class*="location"]')?.textContent?.trim() || '';
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
