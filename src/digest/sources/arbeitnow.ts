import type { DigestConfig, RawListing } from '../types.js';
import { isoFromUnknown, stripHtml } from '../text.js';
import { fetchJson } from './http.js';

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number;
}

interface ArbeitnowResponse {
  data?: ArbeitnowJob[];
}

/** Arbeitnow public job-board API. Link back; do not paginate aggressively. */
export async function fetchArbeitnowListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.arbeitnow.enabled) return [];
  log('Arbeitnow: fetching public job-board API');
  const data = await fetchJson<ArbeitnowResponse>('https://www.arbeitnow.com/api/job-board-api');
  const out: RawListing[] = [];
  for (const job of data.data || []) {
    if (!job.url || !job.title) continue;
    const location = job.location || (job.remote ? 'Remote' : '');
    out.push({
      title: job.title,
      company: job.company_name || '',
      location,
      url: job.url,
      source: 'Arbeitnow',
      postedAt: isoFromUnknown(job.created_at),
      description: stripHtml(job.description || ''),
      tags: [...(job.tags || []), ...(job.job_types || [])],
      countryCodes: [],
      remoteHint: Boolean(job.remote) || /remote/i.test(location),
    });
  }
  return out;
}
