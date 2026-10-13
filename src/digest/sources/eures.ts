import type { DigestConfig, RawListing, RoleConfig } from '../types.js';
import { isoFromUnknown, stripHtml } from '../text.js';
import { fetchJson, sleep } from './http.js';

const EURES_SEARCH = 'https://europa.eu/eures/api/jv-searchengine/public/jv-search/search';

interface EuresJob {
  id?: string;
  title?: string;
  description?: string;
  creationDate?: number;
  lastModificationDate?: number;
  locationMap?: Record<string, Array<string | null> | undefined>;
  employer?: { name?: string | null } | null;
  euresFlag?: boolean;
}

interface EuresSearchResponse {
  numberRecords?: number;
  jvs?: EuresJob[];
}

const COUNTRY_NAMES: Record<string, string> = {
  AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CH: 'Switzerland', CY: 'Cyprus',
  CZ: 'Czechia', DE: 'Germany', DK: 'Denmark', EE: 'Estonia', EL: 'Greece',
  ES: 'Spain', FI: 'Finland', FR: 'France', GR: 'Greece', HR: 'Croatia',
  HU: 'Hungary', IE: 'Ireland', IS: 'Iceland', IT: 'Italy', LI: 'Liechtenstein',
  LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MT: 'Malta', NL: 'Netherlands',
  NO: 'Norway', PL: 'Poland', PT: 'Portugal', RO: 'Romania', SE: 'Sweden',
  SI: 'Slovenia', SK: 'Slovakia', UK: 'United Kingdom', GB: 'United Kingdom',
};

function locationFromMap(map: EuresJob['locationMap']): { location: string; countryCodes: string[] } {
  if (!map) return { location: 'EU', countryCodes: [] };
  const codes = Object.keys(map);
  const names = codes.map((c) => COUNTRY_NAMES[c.toUpperCase()] || c.toUpperCase());
  return { location: names.join(', ') || 'EU', countryCodes: codes.map((c) => c.toLowerCase()) };
}

function toListing(job: EuresJob): RawListing | null {
  if (!job.id || !job.title) return null;
  const { location, countryCodes } = locationFromMap(job.locationMap);
  const description = stripHtml(job.description || '');
  return {
    title: job.title,
    company: job.employer?.name?.trim() || '',
    location,
    url: `https://europa.eu/eures/portal/jv-se/jv-details/${encodeURIComponent(job.id)}?lang=en`,
    source: 'EURES',
    postedAt: isoFromUnknown(job.creationDate || job.lastModificationDate),
    description,
    tags: job.euresFlag ? ['eures-flag'] : [],
    countryCodes,
    remoteHint: /remote|telework|teletrabajo|home office/i.test(`${job.title} ${description}`),
  };
}

async function searchEures(keyword: string, locationCodes: string[], resultsPerPage: number): Promise<RawListing[]> {
  const body = {
    resultsPerPage,
    page: 1,
    sortSearch: 'BEST_MATCH',
    keywords: [{ keyword, specificSearchCode: 'TITLE' }],
    publicationPeriod: 'LAST_MONTH',
    requestLanguage: 'en',
    ...(locationCodes.length ? { locationCodes } : {}),
  };

  const data = await fetchJson<EuresSearchResponse>(EURES_SEARCH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://europa.eu',
      Referer: 'https://europa.eu/eures/portal/jv-se/search',
    },
    body: JSON.stringify(body),
  });

  return (data.jvs || []).map(toListing).filter((j): j is RawListing => j !== null);
}

function primaryKeyword(role: RoleConfig): string {
  return role.keywords[0] || role.label;
}

function spainKeyword(role: RoleConfig): string {
  return (
    role.keywords.find((k) =>
      /ingeniero|desarrollador|operario|prensa|jefe de|responsable de/i.test(k)
    ) || primaryKeyword(role)
  );
}

/**
 * EURES public job-search JSON used by the official portal.
 * HTML Playwright scraper in src/scrapers/sites/eures.ts stays unchanged;
 * this path respects the same europa.eu crawl-delay (10s) without a browser.
 */
export async function fetchEuresListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.eures.enabled) return [];
  const perRole = config.sources.eures.resultsPerRole || 12;
  const delay = config.euresDelayMs ?? 10000;
  const out: RawListing[] = [];
  let first = true;

  for (const role of config.roles) {
    const keyword = primaryKeyword(role);
    if (!first) await sleep(delay);
    first = false;
    try {
      log(`EURES: searching "${keyword}" (EU-wide)`);
      const eu = await searchEures(keyword, [], perRole);
      out.push(...eu);
    } catch (err) {
      log(`EURES EU search failed for ${keyword}: ${(err as Error).message}`);
    }

    await sleep(delay);
    const esKeyword = spainKeyword(role);
    try {
      log(`EURES: searching "${esKeyword}" (Spain)`);
      const es = await searchEures(esKeyword, ['es'], Math.min(perRole, 8));
      out.push(...es);
    } catch (err) {
      log(`EURES Spain search failed for ${esKeyword}: ${(err as Error).message}`);
    }
  }

  return out;
}
