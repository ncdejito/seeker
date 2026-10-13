import { readFileSync } from 'fs';
import { join } from 'path';
import type { DigestConfig } from './types.js';

export const DIGEST_DISCLAIMER =
  'Visa, work-permit, and remote-eligibility notes on this page are simple keyword heuristics, not legal advice. Always verify on the official site before you apply or book travel.';

export function loadDigestConfig(stateDir = process.env.STATE_DIR || 'state'): DigestConfig {
  const configPath = process.env.DIGEST_CONFIG_PATH || join(stateDir, 'digest-config.json');
  const raw = readFileSync(configPath, 'utf-8');
  const parsed = JSON.parse(raw) as DigestConfig;
  if (!parsed.roles?.length) {
    throw new Error(`Digest config at ${configPath} has no roles`);
  }
  if (!parsed.destinations?.length) {
    throw new Error(`Digest config at ${configPath} has no destinations`);
  }
  if (process.env.DIGEST_EURES_DELAY_MS) {
    parsed.euresDelayMs = Number(process.env.DIGEST_EURES_DELAY_MS) || parsed.euresDelayMs;
  }
  return parsed;
}
