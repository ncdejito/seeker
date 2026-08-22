import { BaseScraper } from '../base-scraper.js';

interface AdzunaJob {
  redirect_url: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
}

/**
 * Adzuna AU — free public JSON API (register at developer.adzuna.com), not scraped HTML.
 * No robots.txt/crawl-delay concerns apply; the constraint is the API's own rate limit
 * (free tier: ~250 calls/day), so this stays a single request per run.
 */
export class AdzunaAUScraper extends BaseScraper {
  private appId = process.env.ADZUNA_APP_ID;
  private appKey = process.env.ADZUNA_APP_KEY;
  private jobCache = new Map<string, { title: string; company: string; location: string }>();

  constructor() {
    super('https://api.adzuna.com');
  }

  async fetchListingUrls(maxPages: number): Promise<string[]> {
    if (!this.appId || !this.appKey) {
      console.warn('Adzuna AU scraper disabled: missing ADZUNA_APP_ID / ADZUNA_APP_KEY');
      return [];
    }

    const urls: string[] = [];

    try {
      const params = new URLSearchParams({
        app_id: this.appId,
        app_key: this.appKey,
        results_per_page: '10',
        what: 'ai OR machine learning OR robotics',
        sort_by: 'date',
      });

      const res = await fetch(`https://api.adzuna.com/v1/api/jobs/au/search/1?${params}`);
      if (!res.ok) {
        console.error(`Adzuna AU request failed: ${res.status} ${res.statusText}`);
        return [];
      }

      const data = await res.json() as { results: AdzunaJob[] };

      for (const job of data.results ?? []) {
        this.jobCache.set(job.redirect_url, {
          title: job.title,
          company: job.company?.display_name || '',
          location: job.location?.display_name || '',
        });
        urls.push(job.redirect_url);
      }
    } catch (err) {
      console.error('Error fetching Adzuna AU listings:', err);
    }

    return urls;
  }

  async fetchJobDescription(url: string): Promise<string> {
    const cached = this.jobCache.get(url);
    return cached ? this.formatJobDescription(cached) : '';
  }
}
