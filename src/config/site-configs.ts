export interface ScraperSiteConfig {
  name: string;
  baseUrl: string;
  allowedPaths: string[];
  disallowedPaths: string[];
  minDelayMs: number;
  maxDelayMs: number;
  enabled: boolean;
  notes: string;
}

export const SCRAPER_CONFIGS: Record<string, ScraperSiteConfig> = {
  'hiring-cafe': {
    name: 'Hiring Cafe',
    baseUrl: 'https://hiring.cafe',
    allowedPaths: ['/', '/job/', '/jobs/', '/recently-posted-jobs'],
    disallowedPaths: ['/viewjob/', '/org/', '/company/', '/account', '/inbox', '/invite/', '/applicant/', '/share/', '/myhiringcafe/', '/admin/', '/*?searchState=*', '/*?page=*'],
    minDelayMs: 2000,
    maxDelayMs: 5000,
    enabled: true,
    notes: 'robots.txt disallows /viewjob/, /org/, and ?searchState= query params — use /recently-posted-jobs and /job/ instead.',
  },

  'climatebase': {
    name: 'Climate Base',
    baseUrl: 'https://climatebase.org',
    allowedPaths: ['/', '/jobs', '/job/*'],
    disallowedPaths: [],
    minDelayMs: 10000,
    maxDelayMs: 15000,
    enabled: false,
    notes: 'Blocked: requires residential proxy (CF + origin 504). Not supported.',
  },

  'eures': {
    name: 'EURES (europa.eu)',
    baseUrl: 'https://europa.eu',
    allowedPaths: ['/'],
    disallowedPaths: ['/cgi-bin/', '/eur-lex/', '/archives/', '/youth/', '/capacity4dev/'],
    minDelayMs: 10000,
    maxDelayMs: 15000,
    enabled: true,
    notes: 'Crawl-delay: 10 seconds specified in robots.txt. Be patient with this site.',
  },

  'work-in-finland': {
    name: 'Work in Finland',
    baseUrl: 'https://www.workinfinland.com',
    allowedPaths: ['/'],
    disallowedPaths: [],
    minDelayMs: 3000,
    maxDelayMs: 8000,
    enabled: true,
    notes: 'Allows all paths. No crawl delay specified.',
  },
};

export function getScraperConfig(name: string): ScraperSiteConfig | undefined {
  return SCRAPER_CONFIGS[name];
}

export function isPathAllowed(scraperName: string, path: string): boolean {
  const config = SCRAPER_CONFIGS[scraperName];
  if (!config || !config.enabled) return false;

  for (const disallowed of config.disallowedPaths) {
    if (disallowed.endsWith('*')) {
      const prefix = disallowed.slice(0, -1);
      if (path.startsWith(prefix)) return false;
    } else if (path === disallowed) {
      return false;
    }
  }

  if (config.allowedPaths.length > 0) {
    return config.allowedPaths.some(allowed => {
      if (allowed.endsWith('*')) {
        const prefix = allowed.slice(0, -1);
        return path.startsWith(prefix);
      }
      return path === allowed;
    });
  }

  return true;
}
