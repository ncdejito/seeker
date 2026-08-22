import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS, isPathAllowed } from '../../config/site-configs.js';

export class WorkInFinlandScraper extends BaseScraper {
  private config = SCRAPER_CONFIGS['work-in-finland'];
  /** Job cards list title/company/location inline; the job detail page (off-domain, jobly.fi) is bot-gated, so cache this instead of re-fetching it. */
  private listingCache = new Map<string, { title: string; company: string; location: string }>();

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

    const page = await this.getPage();
    const urls: string[] = [];

    try {
      const url = 'https://www.workinfinland.com/en/open-jobs/?category=deep-tech%2Csoftware-development&query=ai';
      
      if (!isPathAllowed('work-in-finland', '/')) {
        console.warn('Work in Finland: path not allowed by robots.txt');
        return [];
      }

      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(this.config.minDelayMs);

      const jobCards = await page.$$eval('a.job-card[href*="/job/"]', links =>
        links.map(a => ({
          href: (a as HTMLAnchorElement).href,
          title: a.querySelector('.job-card__title')?.textContent?.trim() || '',
          company: a.querySelector('.job-card__employerName')?.textContent?.trim() || '',
          location: a.querySelector('.job-card__location')?.textContent?.trim() || '',
        }))
      );

      for (const card of jobCards.slice(0, 10)) {
        this.listingCache.set(card.href, card);
        urls.push(card.href);
      }
    } catch (err) {
      console.error('Error fetching Work in Finland listings:', err);
    }

    return urls;
  }

  async fetchJobDescription(url: string): Promise<string> {
    const cached = this.listingCache.get(url);
    return cached ? this.formatJobDescription(cached) : '';
  }
}
