const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

export function decodeEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, body: string) => {
      if (body[0] === '#') {
        const code = body[1] === 'x' || body[1] === 'X'
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
        return Number.isFinite(code) ? String.fromCharCode(code) : _;
      }
      return ENTITY_MAP[body] ?? _;
    });
}

export function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[-_/.,()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function collapsedText(value: string): string {
  return normalizeText(value).replace(/\s+/g, '');
}

export function snippet(text: string, max = 220): string {
  const clean = stripHtml(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function containsPhrase(haystack: string, phrase: string): boolean {
  const nHay = normalizeText(haystack);
  const nPhrase = normalizeText(phrase);
  if (!nPhrase) return false;
  if (nHay.includes(nPhrase)) return true;
  const cHay = collapsedText(haystack);
  const cPhrase = collapsedText(phrase);
  return cPhrase.length >= 8 && cHay.includes(cPhrase);
}

export function isoFromUnknown(value: unknown): string | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof value === 'string') {
    const asNum = Number(value);
    if (/^\d+$/.test(value) && Number.isFinite(asNum)) {
      return isoFromUnknown(asNum);
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

export function formatPosted(iso: string | null): string {
  if (!iso) return 'Date unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date unknown';
  return d.toISOString().slice(0, 10);
}

export function daysAgo(iso: string | null, now = new Date()): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000);
}
