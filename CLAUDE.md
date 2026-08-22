# Seeker — Claude Guidelines

## Golden Rules

1. **Don't get me blocked.** Always use minimum-request strategy — respect robots.txt, crawl delays, and rate limits. Never hammer a site.
2. **Iterate smallest-first.** Make the smallest possible change, prove it works with tests, then proceed. No big-bang changes.
3. **Test before hitting real sites.** Use mocked tests first. Only make real HTTP requests as a final verification step, and only when explicitly asked.
4. **Obscura is optional.** The system must work without obscura binary — fall back to plain Playwright transparently.
5. **Crawl-delay is sacred.** Always read and respect `robots.txt` Crawl-delay. Site configs in `site-configs.ts` are the source of truth for delays.

## Testing Strategy

- `vitest run` — run all tests locally (no network calls in unit tests)
- Mock `getBrowser()` in scraper tests — never hit real URLs in unit tests
- Integration tests in `tests/integration/` may use real network — run separately
