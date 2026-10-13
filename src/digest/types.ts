export type EligibilityFlag =
  | 'worldwide-remote'
  | 'visa-sponsorship'
  | 'open-to-non-eu'
  | 'unknown';

export interface RoleConfig {
  id: string;
  label: string;
  keywords: string[];
  excludeKeywords?: string[];
}

export interface DestinationConfig {
  id: string;
  label: string;
  countryCodes: string[];
  locationHints: string[];
}

export interface SourceToggle {
  enabled: boolean;
  resultsPerRole?: number;
}

export interface OfficialLink {
  label: string;
  url: string;
  region: string;
}

export interface DigestConfig {
  audience: string;
  maxAgeDays: number;
  maxPerRoleDestination: number;
  euresDelayMs: number;
  roles: RoleConfig[];
  destinations: DestinationConfig[];
  sources: {
    eures: SourceToggle;
    adzunaAu: SourceToggle;
    remotive: SourceToggle;
    remoteok: SourceToggle;
    weworkremotely: SourceToggle;
    arbeitnow: SourceToggle;
  };
  officialLinks: OfficialLink[];
}

export interface RawListing {
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string | null;
  description: string;
  tags: string[];
  countryCodes: string[];
  remoteHint: boolean;
}

export interface DigestJob {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  postedAt: string | null;
  snippet: string;
  roleId: string;
  roleLabel: string;
  destinationId: string;
  destinationLabel: string;
  eligibility: EligibilityFlag;
  eligibilityLabel: string;
  eligibilityReason: string;
  tags: string[];
}

export interface SourceReport {
  id: string;
  ok: boolean;
  fetched: number;
  kept: number;
  error: string | null;
}

export interface DigestOutput {
  generatedAt: string;
  audience: string;
  disclaimer: string;
  officialLinks: OfficialLink[];
  sources: SourceReport[];
  jobs: DigestJob[];
  counts: {
    total: number;
    byRole: Record<string, number>;
    byDestination: Record<string, number>;
  };
}
