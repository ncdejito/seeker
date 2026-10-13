import type {
  DestinationConfig,
  DigestConfig,
  DigestJob,
  EligibilityFlag,
  RawListing,
  RoleConfig,
} from './types.js';
import { containsPhrase, daysAgo, normalizeText, snippet } from './text.js';

const ELIGIBILITY_LABEL: Record<EligibilityFlag, string> = {
  'worldwide-remote': 'Worldwide remote',
  'visa-sponsorship': 'Visa / sponsorship mentioned',
  'open-to-non-eu': 'Open to non-EU (heuristic)',
  unknown: 'Verify eligibility',
};

export function matchRole(title: string, description: string, roles: RoleConfig[]): RoleConfig | null {
  const titleText = title || '';
  let best: { role: RoleConfig; score: number } | null = null;

  for (const role of roles) {
    const excluded = (role.excludeKeywords || []).some(
      (kw) => containsPhrase(titleText, kw) || containsPhrase(description.slice(0, 180), kw)
    );
    if (excluded) continue;

    const titleHit = role.keywords.find((kw) => containsPhrase(titleText, kw));
    if (titleHit) {
      const score = titleHit.length;
      if (!best || score > best.score) best = { role, score };
    }
  }

  return best?.role ?? null;
}

export function matchDestination(
  listing: RawListing,
  destinations: DestinationConfig[]
): DestinationConfig | null {
  const codes = listing.countryCodes.map((c) => c.toLowerCase());
  const blob = `${listing.location} ${listing.title} ${listing.tags.join(' ')}`;

  for (const dest of destinations) {
    if (dest.countryCodes.some((code) => codes.includes(code.toLowerCase()))) {
      return dest;
    }
  }

  for (const dest of destinations) {
    if (dest.locationHints.some((hint) => containsPhrase(blob, hint))) {
      return dest;
    }
  }

  if (listing.remoteHint) {
    return destinations.find((d) => d.id === 'remote') ?? null;
  }

  return null;
}

export function detectEligibility(listing: RawListing): {
  flag: EligibilityFlag;
  reason: string;
} {
  const blob = normalizeText(
    `${listing.title} ${listing.location} ${listing.description} ${listing.tags.join(' ')}`
  );

  const worldwide =
    /\b(worldwide|anywhere in the world|work from anywhere|location[:\s]*worldwide|no location restriction|candidates worldwide)\b/.test(
      blob
    ) || /\banywhere\b/.test(normalizeText(listing.location));

  if (worldwide || (listing.remoteHint && /worldwide|anywhere/.test(blob))) {
    return { flag: 'worldwide-remote', reason: 'Listing text points to worldwide / anywhere remote' };
  }

  if (
    /\b(visa sponsorship|visa sponsor|will sponsor|sponsorship available|relocation (support|package|assistance)|blue card|work permit (provided|sponsored)|visa support)\b/.test(
      blob
    )
  ) {
    return { flag: 'visa-sponsorship', reason: 'Listing mentions visa sponsorship, Blue Card, or relocation' };
  }

  if (
    /\b(non[- ]eu|outside the eu|third[- ]country|open to all countries|global remote|candidates from anywhere)\b/.test(
      blob
    )
  ) {
    return { flag: 'open-to-non-eu', reason: 'Listing mentions non-EU / worldwide candidates' };
  }

  if (listing.remoteHint && /\b(remote|distributed|work from home)\b/.test(blob)) {
    return { flag: 'worldwide-remote', reason: 'Remote board listing with no country restriction found' };
  }

  return { flag: 'unknown', reason: 'No visa/remote-eligibility keywords found — verify on the official listing' };
}

export function classifyListing(listing: RawListing, config: DigestConfig, now = new Date()): DigestJob | null {
  const age = daysAgo(listing.postedAt, now);
  if (age != null && age > config.maxAgeDays) return null;

  const role = matchRole(listing.title, listing.description, config.roles);
  if (!role) return null;

  const destination = matchDestination(listing, config.destinations);
  if (!destination) return null;

  const eligibility = detectEligibility(listing);
  const url = listing.url.trim();
  if (!url) return null;

  return {
    id: `${listing.source}:${url}`,
    title: listing.title.trim() || 'Untitled role',
    company: listing.company.trim() || 'See listing',
    location: listing.location.trim() || destination.label,
    url,
    source: listing.source,
    postedAt: listing.postedAt,
    snippet: snippet(listing.description || listing.title),
    roleId: role.id,
    roleLabel: role.label,
    destinationId: destination.id,
    destinationLabel: destination.label,
    eligibility: eligibility.flag,
    eligibilityLabel: ELIGIBILITY_LABEL[eligibility.flag],
    eligibilityReason: eligibility.reason,
    tags: listing.tags,
  };
}

export function capPerGroup(jobs: DigestJob[], maxPerRoleDestination: number): DigestJob[] {
  const counts = new Map<string, number>();
  const out: DigestJob[] = [];
  for (const job of jobs) {
    const key = `${job.roleId}::${job.destinationId}`;
    const n = counts.get(key) || 0;
    if (n >= maxPerRoleDestination) continue;
    counts.set(key, n + 1);
    out.push(job);
  }
  return out;
}

export function sortJobs(jobs: DigestJob[]): DigestJob[] {
  return [...jobs].sort((a, b) => {
    const da = a.postedAt ? Date.parse(a.postedAt) : 0;
    const db = b.postedAt ? Date.parse(b.postedAt) : 0;
    return db - da;
  });
}
