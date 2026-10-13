import type { DigestJob } from './types.js';
import { normalizeText } from './text.js';

export function normalizeJobUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    u.hostname = u.hostname.replace(/^www\./, '').toLowerCase();
    for (const key of [...u.searchParams.keys()]) {
      if (/^(utm_|ref|fbclid|gclid|mc_)/i.test(key) || key === 'ref') {
        u.searchParams.delete(key);
      }
    }
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    return u.toString().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function titleCompanyKey(title: string, company: string): string {
  return `${normalizeText(title)}::${normalizeText(company)}`;
}

function completeness(job: DigestJob): number {
  let score = 0;
  if (job.postedAt) score += 2;
  if (job.company && job.company !== 'See listing') score += 2;
  if (job.location) score += 1;
  if (job.snippet) score += 1;
  return score;
}

/** Keep the newer / more complete row when the same job appears on two boards. */
export function dedupeJobs(jobs: DigestJob[]): DigestJob[] {
  const byUrl = new Map<string, DigestJob>();
  const order: string[] = [];

  for (const job of jobs) {
    const key = normalizeJobUrl(job.url);
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, job);
      order.push(key);
      continue;
    }
    const newer =
      (job.postedAt ? Date.parse(job.postedAt) : 0) > (existing.postedAt ? Date.parse(existing.postedAt) : 0);
    if (newer || completeness(job) > completeness(existing)) {
      byUrl.set(key, job);
    }
  }

  const urlDeduped = order.map((k) => byUrl.get(k)!);
  const byTitleCompany = new Map<string, DigestJob>();
  const out: DigestJob[] = [];

  for (const job of urlDeduped) {
    const key = titleCompanyKey(job.title, job.company);
    if (!job.company || job.company === 'See listing' || key.endsWith('::')) {
      out.push(job);
      continue;
    }
    const existing = byTitleCompany.get(key);
    if (!existing) {
      byTitleCompany.set(key, job);
      out.push(job);
      continue;
    }
    const newer =
      (job.postedAt ? Date.parse(job.postedAt) : 0) > (existing.postedAt ? Date.parse(existing.postedAt) : 0);
    if (newer || completeness(job) > completeness(existing)) {
      const idx = out.indexOf(existing);
      if (idx >= 0) out[idx] = job;
      byTitleCompany.set(key, job);
    }
  }

  return out;
}
