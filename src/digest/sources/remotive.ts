import type { DigestConfig, RawListing } from '../types.js';
import { isoFromUnknown, stripHtml } from '../text.js';
import { fetchJson } from './http.js';

interface RemotiveJob {
  id?: number;
  url?: string;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  publication_date?: string;
  description?: string;
  tags?: string[];
  category?: string;
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

/**
 * Remotive public API (https://remotive.com/api/remote-jobs).
 * Attribution required: link to the Remotive job URL and name Remotive as the source.
 * One request per run (Remotive asks for at most ~4 requests/day).
 */
export async function fetchRemotiveListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.remotive.enabled) return [];
  log('Remotive: fetching public remote jobs API');
  const data = await fetchJson<RemotiveResponse>('https://remotive.com/api/remote-jobs');
  const out: RawListing[] = [];
  for (const job of data.jobs || []) {
    if (!job.url || !job.title) continue;
    const location = job.candidate_required_location || 'Remote';
    out.push({
      title: job.title,
      company: job.company_name || '',
      location,
      url: job.url,
      source: 'Remotive',
      postedAt: isoFromUnknown(job.publication_date),
      description: stripHtml(job.description || ''),
      tags: [...(job.tags || []), job.category || ''].filter(Boolean),
      countryCodes: [],
      remoteHint: true,
    });
  }
  return out;
}
