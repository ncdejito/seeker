import type { DigestConfig, RawListing } from '../types.js';
import { isoFromUnknown, stripHtml } from '../text.js';
import { fetchJson } from './http.js';

interface AdzunaJob {
  redirect_url?: string;
  title?: string;
  created?: string;
  description?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
}

interface AdzunaResponse {
  results?: AdzunaJob[];
}

/**
 * Same public Adzuna AU JSON API as src/scrapers/sites/adzuna-au.ts.
 * Skips cleanly when ADZUNA_APP_ID / ADZUNA_APP_KEY are missing (no secrets required).
 */
export async function fetchAdzunaAuListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.adzunaAu.enabled) return [];
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    log('Adzuna AU skipped: ADZUNA_APP_ID / ADZUNA_APP_KEY not set');
    return [];
  }

  const perRole = config.sources.adzunaAu.resultsPerRole || 10;
  const out: RawListing[] = [];

  for (const role of config.roles) {
    const what = role.keywords.slice(0, 3).join(' OR ');
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(perRole),
      what,
      sort_by: 'date',
    });
    try {
      log(`Adzuna AU: searching "${what}"`);
      const data = await fetchJson<AdzunaResponse>(
        `https://api.adzuna.com/v1/api/jobs/au/search/1?${params}`
      );
      for (const job of data.results || []) {
        if (!job.redirect_url || !job.title) continue;
        out.push({
          title: job.title,
          company: job.company?.display_name || '',
          location: job.location?.display_name || 'Australia',
          url: job.redirect_url,
          source: 'Adzuna AU',
          postedAt: isoFromUnknown(job.created),
          description: stripHtml(job.description || ''),
          tags: [],
          countryCodes: ['au'],
          remoteHint: /remote|work from home/i.test(`${job.title} ${job.location?.display_name || ''}`),
        });
      }
    } catch (err) {
      log(`Adzuna AU search failed for ${role.id}: ${(err as Error).message}`);
    }
  }

  return out;
}
