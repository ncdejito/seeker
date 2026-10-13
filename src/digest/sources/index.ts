import type { DigestConfig, RawListing, SourceReport } from '../types.js';
import { fetchAdzunaAuListings } from './adzuna.js';
import { fetchArbeitnowListings } from './arbeitnow.js';
import { fetchEuresListings } from './eures.js';
import { fetchRemoteOkListings } from './remoteok.js';
import { fetchRemotiveListings } from './remotive.js';
import { fetchWwrListings } from './wwr.js';

async function runSource(
  id: string,
  fn: () => Promise<RawListing[]>,
  log: (msg: string) => void
): Promise<{ listings: RawListing[]; report: SourceReport }> {
  try {
    const listings = await fn();
    log(`${id}: fetched ${listings.length} raw listings`);
    return { listings, report: { id, ok: true, fetched: listings.length, kept: listings.length, error: null } };
  } catch (err) {
    const message = (err as Error).message || String(err);
    log(`${id}: FAILED ${message}`);
    return { listings: [], report: { id, ok: false, fetched: 0, kept: 0, error: message } };
  }
}

export async function fetchAllListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<{ listings: RawListing[]; reports: SourceReport[] }> {
  const [parallel, eures] = await Promise.all([
    Promise.all([
      runSource('remotive', () => fetchRemotiveListings(config, log), log),
      runSource('remoteok', () => fetchRemoteOkListings(config, log), log),
      runSource('weworkremotely', () => fetchWwrListings(config, log), log),
      runSource('arbeitnow', () => fetchArbeitnowListings(config, log), log),
      runSource('adzunaAu', () => fetchAdzunaAuListings(config, log), log),
    ]),
    runSource('eures', () => fetchEuresListings(config, log), log),
  ]);

  const results = [...parallel, eures];
  return {
    listings: results.flatMap((r) => r.listings),
    reports: results.map((r) => r.report),
  };
}
