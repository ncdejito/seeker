import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadDigestConfig, DIGEST_DISCLAIMER } from './config.js';
import { capPerGroup, classifyListing, sortJobs } from './filter.js';
import { dedupeJobs } from './dedupe.js';
import { renderHtml, renderTelegram } from './render.js';
import { fetchAllListings } from './sources/index.js';
import { sendTelegramMessage } from '../scripts/send-telegram.js';
import type { DigestConfig, DigestJob, DigestOutput, SourceReport } from './types.js';

export interface RunDigestOptions {
  config?: DigestConfig;
  outDir?: string;
  now?: Date;
  log?: (msg: string) => void;
}

export function assembleDigest(
  config: DigestConfig,
  rawCountBySource: Map<string, number>,
  reports: SourceReport[],
  jobs: DigestJob[],
  generatedAt: string
): DigestOutput {
  const byRole: Record<string, number> = {};
  const byDestination: Record<string, number> = {};
  for (const role of config.roles) byRole[role.id] = 0;
  for (const dest of config.destinations) byDestination[dest.id] = 0;
  for (const job of jobs) {
    byRole[job.roleId] = (byRole[job.roleId] || 0) + 1;
    byDestination[job.destinationId] = (byDestination[job.destinationId] || 0) + 1;
  }
  const reportsWithKept = reports.map((r) => ({
    ...r,
    kept: jobs.filter((j) => sourceNameToId(j.source) === r.id).length,
    fetched: rawCountBySource.get(r.id) ?? r.fetched,
  }));

  return {
    generatedAt,
    audience: config.audience,
    disclaimer: DIGEST_DISCLAIMER,
    officialLinks: config.officialLinks,
    sources: reportsWithKept,
    jobs,
    counts: { total: jobs.length, byRole, byDestination },
  };
}

function sourceNameToId(name: string): string {
  const map: Record<string, string> = {
    EURES: 'eures',
    'Adzuna AU': 'adzunaAu',
    Remotive: 'remotive',
    'Remote OK': 'remoteok',
    'We Work Remotely': 'weworkremotely',
    Arbeitnow: 'arbeitnow',
  };
  return map[name] || name;
}

export async function runDigest(options: RunDigestOptions = {}): Promise<{ digest: DigestOutput; htmlPath: string; jsonPath: string }> {
  const log = options.log || ((msg: string) => console.log(msg));
  const config = options.config || loadDigestConfig();
  const outDir = options.outDir || process.env.DIGEST_OUT_DIR || join('docs', 'digest');
  const now = options.now || new Date();

  log('Fetching listings from public sources…');
  const { listings, reports } = await fetchAllListings(config, log);
  const rawCountBySource = new Map<string, number>();
  for (const listing of listings) {
    const id = sourceNameToId(listing.source);
    rawCountBySource.set(id, (rawCountBySource.get(id) || 0) + 1);
  }

  const classified = listings
    .map((listing) => classifyListing(listing, config, now))
    .filter((job): job is DigestJob => job !== null);

  const deduped = dedupeJobs(classified);
  const sorted = sortJobs(deduped);
  const capped = capPerGroup(sorted, config.maxPerRoleDestination);

  log(`Classified ${classified.length}; deduped ${deduped.length}; capped ${capped.length}`);

  const digest = assembleDigest(config, rawCountBySource, reports, capped, now.toISOString());
  const html = renderHtml(digest, config);

  mkdirSync(outDir, { recursive: true });
  const htmlPath = join(outDir, 'index.html');
  const jsonPath = join(outDir, 'digest.json');
  writeFileSync(htmlPath, html, 'utf-8');
  writeFileSync(jsonPath, JSON.stringify(digest, null, 2), 'utf-8');
  log(`Wrote ${htmlPath} and ${jsonPath}`);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat) {
    const publicUrl = process.env.DIGEST_PUBLIC_URL || 'https://ncdejito.github.io/seeker/';
    const text = renderTelegram(digest, publicUrl);
    try {
      await sendTelegramMessage(text);
      log('Telegram digest sent');
    } catch (err) {
      log(`Telegram send failed: ${(err as Error).message}`);
    }
  } else {
    log('Telegram skipped (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set)');
  }

  return { digest, htmlPath, jsonPath };
}
