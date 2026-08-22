import { BaseScraper } from '../base-scraper.js';

export class ClimatebaseScraper extends BaseScraper {
  constructor() {
    super('https://climatebase.org');
  }

  async authenticate(): Promise<void> {
    throw new Error('ClimateBase blocked: requires residential proxy (CF + origin 504). Not supported.');
  }

  async fetchListingUrls(_maxPages: number): Promise<string[]> {
    throw new Error('ClimateBase blocked: requires residential proxy (CF + origin 504). Not supported.');
  }

  async fetchJobDescription(_url: string): Promise<string> {
    throw new Error('ClimateBase blocked: requires residential proxy (CF + origin 504). Not supported.');
  }

  async extractCompanyName(_url: string, _html: string): Promise<string | null> {
    throw new Error('ClimateBase blocked: requires residential proxy (CF + origin 504). Not supported.');
  }
}
