# Seeker — Tasks

---

## Completed

- **T-00** Project scaffold (npm, tsconfig, folder structure, state files)
- **T-01–T-18** All test files written (red phase complete)
- **T-19** `src/config/env.ts` — env loader with typed config
- **T-29** `src/scrapers/base-scraper.ts` — robots compliance, throttled requests
- **T-30** Site scrapers: hiring-cafe, eures, work-in-finland (operational); climatebase (stub — CF-blocked, see T-S2)
- **T-31** `src/scrapers/browser.ts` — obscura with plain Playwright fallback
- **T-36** `src/pipeline/csv-writer.ts` — sort by total_fit, PRD FR-30 columns
- **T-42** `src/scripts/scrape-today.ts` — standalone scraper → CSV, no LLM

---

## Next — SaaS Gaps (priority order)

### T-S1 Implement full API routes
**File:** `src/api/server.ts` (currently stub with only GET /jobs/status)

Add missing routes:
- `POST /jobs/run` → 202 immediately, calls orchestrator async; 409 if already running
- `GET /jobs/run/sync` → blocks until run completes, returns summary
- `POST /jobs/adhoc` with `{urls: [...]}` → appends to `state/adhoc_links.json`, returns `{queued, total_queued}`

**Done when:** integration tests in `tests/integration/api/` all green.

---

### T-S2 Stub out ClimateBase scraper clearly
**File:** `src/scrapers/sites/climatebase.ts`

Replace current broken implementation with explicit stub that throws `"ClimateBase blocked: requires residential proxy (CF + origin 504). Not supported."`. Remove from `scrape-today.ts` site list. Update tests accordingly.

**Done when:** no ClimateBase requests are made at runtime, error message is clear.

---

### T-S3 Implement utils prerequisites for pipeline
These are required before T-S4/T-S5 can work:

- `src/utils/logger.ts` — per-run log file, info/warn/error/fatal, `[TIMESTAMP] [LEVEL] msg` format
- `src/utils/retry.ts` — `withRetry(fn, maxAttempts=5)`, exponential backoff 1s→2s→4s→8s→16s
- `src/utils/semaphore.ts` — `createSemaphore(n)` wrapping p-limit
- `src/utils/validation.ts` — `validateJobDescription(text, config): {valid, reason?}`

**Done when:** T-02, T-03, T-04, T-05 unit tests all green.

---

### T-S4 Implement LLM pipeline
Wire the scoring pipeline. Requires T-S3.

- `src/llm/provider.ts` + `openai-provider.ts` + `local-provider.ts` — interface + factory (`createProvider`)
- `src/llm/prompt-loader.ts` — `loadPrompt(filename)`, `interpolate(template, vars)`, throw on unknown var
- `prompts/technical-fit.txt` — vars: `{{CV_TEXT}}`, `{{JOB_DESCRIPTION}}`
- `prompts/aspirational-fit.txt` — var: `{{JOB_DESCRIPTION}}`
- `prompts/resume-match.txt` — vars: `{{JOB_DESCRIPTION}}`, `{{CAREER_SUMMARIES}}`
- `prompts/title-prefilter.txt` — vars: `{{JOB_TITLE}}`, `{{ROLE_KEYWORDS}}`
- `src/pipeline/title-filter.ts` — LLM call + parse + score gate (≥40 pass)
- `src/pipeline/technical-fit.ts` — `scoreTechnicalFit`, withRetry(5), parse JSON, failure row on max retries
- `src/pipeline/aspirational-fit.ts` — `scoreAspirationalFit`, default salary=2 when not in JD
- `src/pipeline/resume-match.ts` — `matchResumes`, JD truncate 800 tokens, career summary cap 250 words, top-3

**Done when:** T-06, T-07, T-12, T-13, T-14, T-15 unit tests all green.

---

### T-S5 Implement orchestrator
**File:** `src/pipeline/orchestrator.ts`. Requires T-S3, T-S4.

Full pipeline: scrape → validate → title-filter → technical-fit → aspirational-fit → resume-match → CSV.
- Status writes: idle → running → complete (to `state/run_status.json`)
- Load ad-hoc links from `state/adhoc_links.json`, clear after processing
- Semaphore limits to MAX_CONCURRENCY concurrent job workflows
- Title-skipped jobs → CSV with skip reason
- Extraction failures → CSV with failure reason
- technical_fit < 70 → CSV with partial data only

Also implement `src/resume/cv-loader.ts` and `src/resume/resume-loader.ts` + placeholder resumes (`resumes/mlops.ts`, `resumes/ai-eng.ts`, `resumes/data-eng.ts`) needed by pipeline.

**Done when:** T-17 orchestrator unit tests green, end-to-end run via `POST /jobs/run` produces scored CSV.

---

### T-S6 Phase 3 — Cron + PM2 + final checks
- `src/scripts/run-pipeline.ts` — load env, call `runPipeline`, exit 1 on error
- `ecosystem.config.js`:
  ```js
  module.exports = { apps: [{ name: 'seeker-api', script: 'dist/api/server.js', env_file: '.env' }] }
  ```
- Final: `npm run build` zero TS errors, `npm test` all green, all prompts exist, `.env.example` complete

---

### T-S7 Build Hermes agent skill (Phase 5 — SaaS angle)

Goal: hourly Hermes polling → Telegram alerts for high-scoring jobs only. No manual runs needed.

**Architecture:**
```
hermes poll (hourly cron)
  → fetch new jobs via public APIs (Adzuna free tier, Remotive free, EURES REST API)
  → title-filter LLM pass (cheap, fast)
  → technical-fit + aspirational-fit on passing titles only
  → if total_fit >= threshold → Telegram message with job details + apply link
  → dedup — skip job IDs already seen/sent
```

**Deliverables:**
- `skill.md` — agent instructions: how to trigger fetch, API calls, scoring logic, how to update user prefs
- User preference store — role, location, seniority, keywords saved to Hermes memory
- Job dedup store — flat file or SQLite of seen job IDs
- API integrations: Adzuna (free tier), Remotive (no key), EURES REST API (no key)
- Telegram notification for high-fit jobs only

**Notes:**
- Self-hosted; user pays own LLM API costs
- ClimateBase: skip entirely (no public API, CF-blocked)
- Title filter runs first to minimize LLM cost on bulk results

**Done when:** Hermes running with skill → Telegram receives job alerts for matches found in last hour, no duplicates, no low-score noise.

---

### T-S8 Update README for self-hosted SaaS story

Rewrite `README.md` to frame Seeker as a self-hosted job-search SaaS, not just a scraper tool:
- What it does (scrape → score → alert)
- Prerequisites (Node 18+, OpenAI key or local LLM, Telegram bot)
- Setup in 5 steps: clone, `npm install`, copy `.env.example` → `.env`, fill vars, `npm start`
- How alerts work (Hermes skill / cron)
- How to add job preferences

---

## Sequence

```
T-S1 full API routes
T-S2 stub ClimateBase
T-S3 utils (logger, retry, semaphore, validation)
T-S4 LLM pipeline
T-S5 orchestrator
T-S6 cron + PM2 + final checks
T-S7 Hermes agent skill
T-S8 README rewrite
```
