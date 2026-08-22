export interface ValidationConfig {
  MIN_CHAR_LENGTH: number;
  ROLE_KEYWORDS: string;
}

export function validateJobDescription(
  text: string,
  config: ValidationConfig
): { valid: boolean; reason?: string } {
  const reasons: string[] = [];

  const keywords = config.ROLE_KEYWORDS.split(',').map(k => k.trim().toLowerCase());
  const textLower = text.toLowerCase();
  const hasKeyword = keywords.some(kw => textLower.includes(kw));

  if (!hasKeyword) {
    reasons.push('No matching keyword found in text');
  }

  if (text.length < config.MIN_CHAR_LENGTH) {
    reasons.push(`Below minCharLength of ${config.MIN_CHAR_LENGTH}`);
  }

  if (reasons.length > 0) {
    return { valid: false, reason: reasons.join('; ') };
  }

  return { valid: true };
}
