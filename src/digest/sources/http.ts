export const USER_AGENT = 'SeekerDigest/1.0 (+https://github.com/ncdejito/seeker)';

const robotsCache = new Map<string, string | null>();

export async function fetchResponse(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('User-Agent')) headers.set('User-Agent', USER_AGENT);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json, application/rss+xml, text/xml, */*');

  const res = await fetch(url, {
    ...init,
    headers,
    signal: init.signal ?? AbortSignal.timeout(25000),
  });
  return res;
}

export async function fetchText(url: string, init: RequestInit = {}): Promise<string> {
  const res = await fetchResponse(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.text();
}

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchResponse(url, init);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
  return res.json() as Promise<T>;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pathAllowed(robotsText: string, path: string): boolean {
  const lines = robotsText.split(/\r?\n/);
  let relevant = false;
  let disallowed = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^user-agent:/i.test(line)) {
      const agent = line.slice(line.indexOf(':') + 1).trim();
      relevant = agent === '*' || /seeker/i.test(agent);
      continue;
    }
    if (!relevant) continue;
    if (/^disallow:/i.test(line)) {
      const rule = line.slice(line.indexOf(':') + 1).trim();
      if (!rule) continue;
      if (rule === '/' || path === rule || (rule.endsWith('*') && path.startsWith(rule.slice(0, -1)))) {
        disallowed = true;
      } else if (rule.endsWith('/') && path.startsWith(rule)) {
        disallowed = true;
      } else if (path.startsWith(rule)) {
        disallowed = true;
      }
    }
    if (/^allow:/i.test(line)) {
      const rule = line.slice(line.indexOf(':') + 1).trim();
      if (rule && (path === rule || path.startsWith(rule))) {
        disallowed = false;
      }
    }
  }
  return !disallowed;
}

export async function robotsAllows(origin: string, path: string): Promise<boolean> {
  let text = robotsCache.get(origin);
  if (text === undefined) {
    try {
      const res = await fetchResponse(new URL('/robots.txt', origin).toString());
      text = res.ok ? await res.text() : '';
      if (text.includes('<html') || text.includes('<!DOCTYPE')) text = '';
    } catch {
      text = null;
    }
    robotsCache.set(origin, text);
  }
  if (text === null) return false;
  if (!text) return true;
  return pathAllowed(text, path);
}
