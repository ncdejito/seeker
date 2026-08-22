import { getBrowser } from './browser.js';

export abstract class BaseScraper {
  protected baseUrl: string;
  protected minDelay: number;
  protected maxDelay: number;
  protected logger: any;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.minDelay = 1000;
    this.maxDelay = 3000;
    this.logger = { warn: (msg: string) => console.warn(msg) };
  }

  abstract fetchListingUrls(maxPages: number): Promise<string[]>;
  abstract fetchJobDescription(url: string): Promise<string>;

  /** Default: parses "Company: X" out of a formatted description. Override if a site needs different parsing. */
  async extractCompanyName(url: string, html: string): Promise<string | null> {
    const match = html.match(/Company:\s*(.+)/);
    return match ? match[1] : null;
  }

  /** Shared browser/context/page lookup used by every scraper's fetch methods. */
  protected async getPage() {
    const browser = await getBrowser();
    const context = browser.contexts()[0] || (await browser.newContext());
    return context.pages()[0] || (await context.newPage());
  }

  protected formatJobDescription(data: { title: string; company: string; location: string }): string {
    return `Title: ${data.title}\nCompany: ${data.company}\nLocation: ${data.location}`;
  }

  async checkRobotsCompliance(path: string): Promise<boolean> {
    try {
      const robotsUrl = new URL('/robots.txt', this.baseUrl).toString();
      const response = await fetch(robotsUrl);
      
      if (!response.ok) {
        return true; // If can't fetch robots.txt, allow (but log)
      }
      
      const text = await response.text();
      
      // Check if this is an HTML page (blocked/error) not robots.txt
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        this.logger.warn(`robots.txt for ${this.baseUrl} is blocked - skipping scraping`);
        return false;
      }
      
      const lines = text.split('\n');
      let isRelevant = false;
      let isDisallowed = false;
      let crawlDelay = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('User-agent:')) {
          const agent = trimmed.substring(11).trim();
          isRelevant = (agent === '*' || agent.includes('bot'));
        } else if (isRelevant) {
          if (trimmed.startsWith('Disallow:')) {
            const disallowedPath = trimmed.substring(9).trim();
            if (disallowedPath && (disallowedPath === path || (disallowedPath.endsWith('/') && path.startsWith(disallowedPath)))) {
              isDisallowed = true;
            }
          }
          if (trimmed.startsWith('Allow:')) {
            const allowedPath = trimmed.substring(6).trim();
            if (allowedPath && (allowedPath === path || (allowedPath.endsWith('/') && path.startsWith(allowedPath)))) {
              isDisallowed = false;
            }
          }
          if (trimmed.startsWith('Crawl-delay:')) {
            crawlDelay = parseInt(trimmed.substring(13).trim()) * 1000;
            if (crawlDelay > this.maxDelay) {
              this.maxDelay = crawlDelay;
              this.minDelay = crawlDelay;
            }
          }
        }
      }
      
      if (isDisallowed) {
        this.logger.warn(`robots.txt disallows ${path} on ${this.baseUrl}, skipping`);
      }
      
      if (crawlDelay > 0) {
        this.logger.warn(`robots.txt specifies Crawl-delay: ${crawlDelay/1000}s for ${this.baseUrl}`);
      }
      
      return !isDisallowed;
    } catch (err) {
      this.logger.warn(`Error checking robots.txt for ${this.baseUrl}: ${err}`);
      return false; // Be conservative - don't scrape if can't verify
    }
  }

  async throttledRequest<T>(fn: () => Promise<T>): Promise<T> {
    const delay = Math.floor(
      Math.random() * (this.maxDelay - this.minDelay) + this.minDelay
    );
    await new Promise(resolve => setTimeout(resolve, delay));
    return fn();
  }

  extractPostDate(url: string): Promise<Date | null> {
    throw new Error("Not implemented");
  }
}
