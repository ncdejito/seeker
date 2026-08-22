import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS as siteConfigs } from '../../config/site-configs.js';

export class EURESScraper extends BaseScraper {
  private config = siteConfigs['eures'];

  constructor() {
    super('https://europa.eu');
    this.minDelay = this.config.minDelayMs;
    this.maxDelay = this.config.maxDelayMs;
  }

  async fetchListingUrls(maxPages: number): Promise<string[]> {
    const page = await this.getPage();
    const urls: string[] = [];

    try {
      // LAST_DAY + bare "ai" returns zero results (too narrow); LAST_WEEK + a full phrase works.
      const params = new URLSearchParams({
        page: '1',
        resultsPerPage: '10',
        orderBy: 'BEST_MATCH', // MOST_RECENT deprioritizes keyword relevance entirely (returns unrelated jobs)
        keywordsEverywhere: 'artificial intelligence',
        publicationPeriod: 'LAST_WEEK',
        lang: 'en',
      });
      const searchUrl = `https://europa.eu/eures/portal/jv-se/search?${params}`;

      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
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
    const page = await this.getPage();
    let description = '';

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
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

      description = this.formatJobDescription(jobData);
    } catch (err) {
      console.error(`Error fetching job description from ${url}:`, err);
    }

    return description;
  }
}
