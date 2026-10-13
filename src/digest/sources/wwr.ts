import type { DigestConfig, RawListing } from '../types.js';
import { decodeEntities, isoFromUnknown, stripHtml } from '../text.js';
import { fetchText, robotsAllows } from './http.js';

const FEEDS = [
  '/categories/remote-programming-jobs.rss',
  '/categories/remote-product-jobs.rss',
  '/remote-jobs.rss',
];

function rssTag(item: string, name: string): string {
  const cdata = item.match(new RegExp(`<${name}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${name}>`, 'i'));
  if (cdata) return decodeEntities(cdata[1]).trim();
  const plain = item.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return plain ? decodeEntities(plain[1]).trim() : '';
}

function parseFeed(xml: string): RawListing[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  const out: RawListing[] = [];
  for (const item of items) {
    const rawTitle = rssTag(item, 'title');
    const url = rssTag(item, 'link') || rssTag(item, 'guid');
    if (!rawTitle || !url) continue;
    const colon = rawTitle.indexOf(':');
    const company = colon > 0 ? rawTitle.slice(0, colon).trim() : '';
    const title = colon > 0 ? rawTitle.slice(colon + 1).trim() : rawTitle;
    const region = rssTag(item, 'region');
    out.push({
      title,
      company,
      location: region || 'Remote',
      url,
      source: 'We Work Remotely',
      postedAt: isoFromUnknown(rssTag(item, 'pubDate')),
      description: stripHtml(rssTag(item, 'description')),
      tags: [rssTag(item, 'category')].filter(Boolean),
      countryCodes: [],
      remoteHint: true,
    });
  }
  return out;
}

/** Public WWR RSS feeds. robots.txt allows `/` and does not disallow RSS paths. */
export async function fetchWwrListings(
  config: DigestConfig,
  log: (msg: string) => void = console.log
): Promise<RawListing[]> {
  if (!config.sources.weworkremotely.enabled) return [];
  const origin = 'https://weworkremotely.com';
  const out: RawListing[] = [];

  for (const path of FEEDS) {
    const allowed = await robotsAllows(origin, path);
    if (!allowed) {
      log(`We Work Remotely skipped ${path}: robots.txt disallows it`);
      continue;
    }
    log(`We Work Remotely: ${path}`);
    const xml = await fetchText(`${origin}${path}`);
    out.push(...parseFeed(xml));
  }
  return out;
}
