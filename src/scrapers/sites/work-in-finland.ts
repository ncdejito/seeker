import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS, isPathAllowed } from '../../config/site-configs.js';
import { getBrowser } from '../browser.js';

export class WorkInFinlandScraper extends BaseScraper {
  private config = SCRAPER_CONFIGS['work-in-finland'];

  constructor() {
    super('https://www.workinfinland.com');
    if (this.config) {
      this.minDelay = this.config.minDelayMs;
      this.maxDelay = this.config.maxDelayMs;
    }
  }

  async fetchListingUrls(maxPages: number): Promise<string[]> {
    if (!this.config?.enabled) {
      console.warn(`Work in Finland scraper disabled: ${this.config?.notes}`);
      return [];
    }

    const browser = await getBrowser();
    const context = browser.contexts()[0] || await browser.newContext();
    const page = context.pages()[0] || await context.newPage();
    const urls: string[] = [];

    try {
      const url = 'https://www.workinfinland.com/en/open-jobs/?category=deep-tech%2Csoftware-development&query=ai';
      
      if (!isPathAllowed('work-in-finland', '/')) {
        console.warn('Work in Finland: path not allowed by robots.txt');
        return [];
      }

      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(this.config.minDelayMs);

      const jobLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="job"]'));
        return links
          .filter(a => {
            const text = a.textContent?.toLowerCase() || '';
            return (a as HTMLAnchorElement).href.includes('/job/') &&
                   !text.includes('cookie') &&
                   !text.includes('find a job') &&
                   text.length > 5;
          })
          .slice(0, 10)
          .map(a => (a as HTMLAnchorElement).href);
      });

      urls.push(...jobLinks.slice(0, 2));
    } catch (err) {
      console.error('Error fetching Work in Finland listings:', err);
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
      await page.waitForTimeout(this.config?.minDelayMs || 3000);

      const jobData = await page.evaluate(() => {
        const title = document.querySelector('h1')?.textContent?.trim() ||
                     document.querySelector('[class*="title"]')?.textContent?.trim() ||
                     document.querySelector('h2')?.textContent?.trim() || '';
        const company = document.querySelector('[class*="employer"]')?.textContent?.trim() ||
                       document.querySelector('[class*="company"]')?.textContent?.trim() ||
                       document.querySelector('[class*="organisation"]')?.textContent?.trim() || '';
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
