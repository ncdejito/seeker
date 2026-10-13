import type { DigestConfig, RawListing } from '../types.js';
import { isoFromUnknown, stripHtml } from '../text.js';
import { fetchJson } from './http.js';

interface RemoteOkJob {
  id?: string | number;
  position?: string;
  company?: string;
  location?: string;
  url?: string;
  date?: string;
  epoch?: number;
  description?: string;
  tags?: string[];
}

/**
 * Remote OK public JSON API (https://remoteok.com/api).
 * First array element is a legal notice. Attribution with a follow-link is required.
 */
export async function fetchRemoteOkListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.remoteok.enabled) return [];
  log('Remote OK: fetching public API');
  const data = await fetchJson<unknown[]>('https://remoteok.com/api');
  const out: RawListing[] = [];
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const job = row as RemoteOkJob;
    if (!job.position || !job.url) continue;
    out.push({
      title: job.position,
      company: job.company || '',
      location: job.location || 'Remote',
      url: job.url,
      source: 'Remote OK',
      postedAt: isoFromUnknown(job.date || job.epoch),
      description: stripHtml(job.description || ''),
      tags: job.tags || [],
      countryCodes: [],
      remoteHint: true,
    });
  }
  return out;
}
