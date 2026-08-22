import { BaseScraper } from '../base-scraper.js';
import { SCRAPER_CONFIGS, isPathAllowed } from '../../config/site-configs.js';

// Bare "ml" and "automation" are too noisy on this site (federal "Office Automation"
// job-series codes, school abbreviations, etc.) — require an unambiguous token instead.
const TITLE_KEYWORDS = new Set(['ai', 'robotic', 'robotics', 'artificial']);

function slugMatchesKeywords(slugUrl: string): boolean {
  const slug = slugUrl.split('/job/')[1] || '';
  const tokens = slug.split('-');
  return tokens.some(t => TITLE_KEYWORDS.has(t)) ||
    tokens.some((t, i) => t === 'machine' && tokens[i + 1] === 'learning');
}

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

    // robots.txt disallows ?searchState= query params and the "recently posted"
    // feed is an unfiltered global firehose (mostly non-tech postings), so we
    // read the sitemap instead — always crawler-allowed, and slugs carry the title.
    const urls: string[] = [];

    try {
      const indexXml = await (await fetch('https://hiringcafe.com/priority-jobs-sitemap.xml')).text();
      const chunkUrl = indexXml.match(/<loc>([^<]+)<\/loc>/)?.[1];
      if (!chunkUrl) return [];

      const chunkXml = await (await fetch(chunkUrl)).text();
      const jobUrls = [...chunkXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

      urls.push(...jobUrls.filter(slugMatchesKeywords).slice(0, 10));
    } catch (err) {
      console.error('Error fetching Hiring Cafe sitemap:', err);
    }

    return urls;
  }

  async fetchJobDescription(url: string): Promise<string> {
    if (!isPathAllowed('hiring-cafe', '/job/')) {
      return '';
    }

    const page = await this.getPage();
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

      description = this.formatJobDescription(jobData);
    } catch (err) {
      console.error(`Error fetching job description from ${url}:`, err);
    }

    return description;
  }
}
