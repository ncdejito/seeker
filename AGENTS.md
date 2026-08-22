# Seeker — Agent Guidelines

## Task: "find me jobs" / "scrape today and alert me"

This is the day-to-day task users ask for. Do it in this order:

```bash
cd src/seeker
npm run build
node dist/scripts/scrape-today.js
```

This scrapes all enabled sites, drops jobs matching `state/preferences.json`'s `excluded_levels`, and writes `jobs_<date>.csv` (job_title, company, location, job_url, source). Read that CSV, pick the roles that best match the user's `FLOWER_PART1..7` values in `.env` (and `state/preferences.json`'s `role_keywords`/`seniority`), then send a short summary of the top matches:

```bash
node dist/scripts/send-telegram.js "<summary text, one job per line with title, company, link>"
```

Report the picks to the user in the chat too — don't rely on Telegram alone.

## Golden Rules

1. **Don't get me blocked.** Always use minimum-request strategy — respect robots.txt, crawl delays, and rate limits. Never hammer a site.
2. **Iterate smallest-first.** Make the smallest possible change, prove it works with tests, then proceed. No big-bang changes.
3. **Test before hitting real sites.** Use mocked tests first. Only make real HTTP requests as a final verification step, and only when explicitly asked.
4. **Obscura is optional.** The system must work without the obscura binary — fall back to plain Playwright transparently.
5. **Crawl-delay is sacred.** Always read and respect `robots.txt` Crawl-delay. Site configs in `site-configs.ts` are the source of truth for delays, and must be kept in sync with each site's actual `robots.txt` (paths change — verify before relying on them).

## Testing Strategy

- `npm test` — runs vitest (unit tests only, no network calls)
- Mock `getBrowser()` in scraper tests — never hit real URLs in unit tests
- Integration tests in `tests/integration/` may use real network — run separately

## Prerequisites

- Node.js 18+
- One LLM provider:
  - **OpenAI**: `OPENAI_API_KEY` env var
  - **Local (llama.cpp)**: `MODEL_PROVIDER=local`, `LOCAL_LLM_BASE_URL`
  - **Opencode (default)**: No API key needed — uses `opencode run` CLI
- CV path: `LOCAL_CV_PATH` (absolute path to your resume PDF)
- Optional: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` for alerts

## Environment Variables (`.env.example`)

```bash
MODEL_PROVIDER=opencode           # default, no API key needed
LOCAL_CV_PATH=/path/to/cv.pdf     # required
FLOWER_PART1-7=...                # Seven Parts of the Flower answers (V2)
TELEGRAM_BOT_TOKEN=...            # optional, for alerts
TELEGRAM_CHAT_ID=...              # optional, for alerts
```

## Usage

### One-shot scan

```bash
cd src/seeker
FLOWER_PART1="Python developer with 5 years experience. Core values: integrity and collaboration."
FLOWER_PART2="Want to work on AI/ML projects with measurable impact."
FLOWER_PART3="Prefer London or remote within GMT timezone."
FLOWER_PART4="Like flexible working hours with core collaboration time 10am-4pm."
FLOWER_PART5="Enjoy working in small teams of 3-5 people with flat hierarchy."
FLOWER_PART6="Salary above 50k with good health benefits and 25 days vacation."
FLOWER_PART7="Want to make an impact through technology that improves people's lives."
npm run pipeline
```

### API

```bash
# Start server
node dist/api/server.pm2  # or: pm2 start ecosystem.config.js

# Trigger run
curl -X POST http://localhost:3000/jobs/run

# Sync run (wait for result)
curl http://localhost:3000/jobs/run/sync

# Check status
curl http://localhost:3000/jobs/status

# Queue ad-hoc job
curl -X POST http://localhost:3000/jobs/adhoc \
  -d '{"urls": ["https://example.com/job/123"]}'
```

### Daily cron

```bash
0 9 * * * cd /path/to/seeker && node dist/scripts/run-pipeline.js >> logs/cron.log 2>&1
```

## Project Structure

```text
src/
├── api/server.ts           Fastify REST API
├── config/env.ts           Env loader (required vars + flower)
├── config/site-configs.ts  Per-site robots.txt allow/disallow + crawl delays
├── pipeline/
│   ├── orchestrator.ts     Main pipeline + flower integration
│   ├── title-filter.ts     LLM title pre-filter (score >= 40)
│   ├── technical-fit.ts    Technical scoring (CV + JD)
│   ├── aspirational-fit.ts Aspirational scoring (5 dimensions)
│   ├── resume-match.ts     Resume matching (top 3 from 11 resumes)
│   └── csv-writer.ts       CSV output (sorted by total_fit)
├── flower/                 V2: Flower exercise parser + criteria
├── scrapers/               Job site scrapers (HiringCafe, EURES, WorkInFinland, Adzuna AU)
├── llm/                    LLM provider abstraction (OpenAI/local/opencode)
├── resume/                 CV/resume loaders
└── scripts/
    ├── run-pipeline.ts     Full LLM-scored pipeline (WIP — see Gaps below)
    ├── scrape-today.ts     Working scrape → filter → CSV (no LLM)
    └── send-telegram.ts    Send a message via the configured Telegram bot
```

`state/preferences.json` holds hard filters (`role_keywords`, `seniority`, `excluded_levels`) applied by `scrape-today.ts`. `prompts/flower-exercise.md` is the copy-paste prompt users run in an AI chat to generate their `FLOWER_PART1..7` `.env` values.

## Output: CSV Columns

`date, job_url, job_title, company, technical_fit, technical_fit_reason, aspirational_fit, aspirational_fit_reason, total_fit, top_resume_match_1, resume_fit_score_1, resume_match_reason_1, top_resume_match_2, resume_fit_score_2, resume_match_reason_2, top_resume_match_3, resume_fit_score_3, resume_match_reason_3, recommendation, critical_gaps, upskill_time, flowerFitScore, part1Score-part7Score, flowerSummary`

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **API:** Fastify
- **Scraping:** Playwright + obscura (stealth mode, optional)
- **LLM:** OpenAI / local (OpenAI-compatible) / opencode CLI
- **Process:** PM2
- **Storage:** Flat files (no database)

## Gaps / Known Limitations

- `run-pipeline.ts` passes `scrapers: []` to the orchestrator — the LLM-scored pipeline (title-filter → technical-fit → aspirational-fit → resume-match → CSV) is not yet wired to the real site scrapers. Use `npm run build && node dist/scripts/scrape-today.js` for a working scrape → CSV (no LLM scoring) in the meantime.
- Cross-site dedup: same job on 2 sites scored twice (documented future: URL normalisation)
- Post-date filtering: pages 1–5 heuristic only
- Glassdoor rating: defaults to 2 (uncertain) if not in JD
- Climatebase: blocked (no public API support)
- Multi-user: single-user only
- Work in Finland job detail pages (jobly.fi) are bot-gated (Cloudflare challenge) — title/company/location are read from the listing card instead of the detail page
