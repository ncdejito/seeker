# Seeker — Architecture Document


**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-05-02


---

## 1. System Overview


Seeker is a TypeScript/Node.js backend application running on an Oracle Cloud free-tier VPS (Ubuntu). It orchestrates job scraping, LLM scoring, and CSV output via a daily cron trigger and a REST API.


```
┌─────────────────────────────────────────────────────────────┐
│                        Oracle VPS                           │
│                                                             │
│  crontab (09:00)          REST API (Fastify)                │
│       │                        │                           │
│       └──────────┬─────────────┘                           │
│                  ▼                                          │
│         Pipeline Orchestrator                               │
│                  │                                          │
│    ┌─────────────┼──────────────┐                          │
│    ▼             ▼              ▼                           │
│  Scraper      LLM Layer      Resume                        │
│  Layer        (OpenAI-compat) Loader                       │
│    │             │              │                           │
│    ▼             ▼              ▼                           │
│  Playwright   llama.cpp      Local FS                      │
│  + obscura    or OpenAI      (CV + metadata)               │
│                  │                                          │
│                  ▼                                          │
│              CSV Writer + Logger                            │
└─────────────────────────────────────────────────────────────┘
```


**Key technology decisions:**
- TypeScript + Node.js — typed, async-native, single runtime for scraping + API + orchestration
- Fastify — typed, fast, low boilerplate, closest Node.js equivalent to FastAPI
- Playwright — browser automation for JS-heavy job sites
- obscura — Rust-based fingerprint evasion, called as subprocess from TypeScript orchestrator
- Vitest — test runner, TDD, Jest-compatible API
- PM2 — process management, keeps app alive between cron triggers
- Flat files only — no database; simplicity over queryability for solo use


---

## 2. Pipeline Orchestration


### 2.1 Daily Run Flow


```
crontab trigger / POST /jobs/run
        │
        ▼
1. Load config (env vars, site configs, resume metadata, CV text)
        │
        ▼
2. Load ad-hoc links from adhoc_links.json + merge with site scrape targets
        │
        ▼
3. Per configured site: paginate pages 1–5, collect job listing URLs
        │
        ▼
4. Dedup URLs against already-processed set for today (exact URL match)
        │
        ▼
5. For each unprocessed URL:
   a. Title pre-filter (LLM call) → if score < 40: mark skip, write to CSV, continue
   b. Extract job description (Playwright + obscura) → validate extraction quality
   c. Technical fit scoring (LLM) → if score < 70: mark partial skip, write to CSV, continue
   d. Aspirational fit scoring (LLM)
   e. Resume match scoring (LLM)
   f. Write complete row to CSV buffer
        │
        ▼
6. Sort CSV buffer by total_fit descending
        │
        ▼
7. Write CSV to OUTPUT_DIR/jobs_YYYY-MM-DD.csv
        │
        ▼
8. Clear adhoc_links.json
        │
        ▼
9. Write run summary to log file, update status to complete
```


### 2.2 Concurrency Model


- Max 5 job-description workflows run simultaneously (configurable via `MAX_CONCURRENCY` env var).
- Implemented via async semaphore (p-limit or equivalent).
- Playwright: single shared browser instance per run. Concurrent workflows queue for page access — no parallel tabs per site.
- LLM calls: each workflow makes sequential LLM calls (title → technical → aspirational → resume). Parallelism comes from multiple concurrent workflows, not multiple calls per workflow.


### 2.3 Retry Logic


All LLM calls wrapped in retry handler:
- Max attempts: 5
- Backoff: exponential (1s, 2s, 4s, 8s, 16s)
- On final failure: log error with job URL + attempt count, write failure row to CSV


### 2.4 Status Tracking


Pipeline writes status to `state/run_status.json` at each stage transition:


```json
{
  "status": "running | idle | failed | complete",
  "progress": 65,
  "current_step": "Scoring job descriptions (13/20)",
  "run_started_at": "2026-05-02T09:00:01Z",
  "last_completed_run": "2026-05-01T09:14:22Z",
  "total_jobs": 20,
  "processed_jobs": 13
}
```


`GET /jobs/status` reads this file. File persists across restarts.


---

## 3. Scraper Layer


### 3.1 Base Scraper Class


All site scrapers extend `BaseScraper`. Tests written first (TDD) for each method.


```typescript
abstract class BaseScraper {
  // Config
  protected siteConfig: SiteConfig;    // name, baseUrl, searchUrls, selectors
  protected robotsConfig: RobotsConfig; // allowed paths, request delay range


  // Core methods (must override)
  abstract fetchListingUrls(maxPages: number): Promise<string[]>;
  abstract fetchJobDescription(url: string): Promise<string>;
  abstract extractCompanyName(url: string, html: string): Promise<string | null>;


  // Shared implementations
  async checkRobotsCompliance(url: string): Promise<boolean>;
  // Fetches /robots.txt, checks if path is allowed.
  // If disallowed: logs warning "robots.txt disallows [path] on [site], skipping".
  // Does NOT hard-block — personal use — but logs every skipped URL.


  async throttledRequest(fn: () => Promise<any>): Promise<any>;
  // Wraps any request with random delay (robotsConfig.minDelayMs to maxDelayMs)
  // to mimic personal browsing cadence.


  // Stubs (documented for future implementation)
  async extractPostDate(url: string, html: string): Promise<Date | null> {
    // STUB: Extract job post date from listing page HTML.
    // Purpose: enable exact 24h cutoff filtering instead of page 1-5 heuristic.
    // Implementation note: date format varies per site — requires per-subclass override.
    // Current behaviour: returns null, pipeline uses page heuristic.
    throw new Error("Not implemented");
  }
}
```


**SiteConfig shape:**
```typescript
interface SiteConfig {
  name: string;
  searchUrls: string[];      // pre-built filter URLs, e.g. "https://climatebase.org/jobs?..."
  listingSelector: string;   // CSS selector for job listing links
  descriptionSelector: string; // CSS selector for JD content
  maxPages: number;          // default 5
  robotsDelay: { min: number; max: number }; // ms
}
```


### 3.2 Site Subclasses


One file per site under `scrapers/sites/`:


| File | Site | Notes |
|------|------|-------|
| `scrapers/sites/hiring-cafe.ts` | HiringCafe | Public |
| `scrapers/sites/climatebase.ts` | Climatebase | Public first pass. Auth stub below. |
| `scrapers/sites/eures.ts` | EURES | Public |
| `scrapers/sites/work-in-finland.ts` | WorkInFinland | Public |
| `scrapers/sites/generic.ts` | Generic fallback | For ad-hoc URLs not matching known sites |


**ClimatebaseScraper stub:**
```typescript
class ClimatebaseScraper extends BaseScraper {
  async authenticate(): Promise<void> {
    // STUB: Climatebase login for authenticated job listings.
    // Purpose: access jobs behind login wall that may not appear in public filter URLs.
    // Implementation note: requires CLIMATEBASE_EMAIL and CLIMATEBASE_PASSWORD env vars.
    // Playwright flow: navigate to /login, fill credentials, store session cookie.
    // Current behaviour: no-op, proceeds as unauthenticated.
    return;
  }
}
```


### 3.3 Playwright + obscura Integration


```typescript
// obscura called as child process before Playwright session starts
// obscura generates browser fingerprint config (user-agent, canvas noise, webGL params)
// Playwright launch options injected with obscura output


const obscuraConfig = await spawnObscura(); // returns JSON fingerprint config
const browser = await chromium.launch({
  args: obscuraConfig.chromiumArgs,
  // ...other fingerprint options
});
```


obscura binary path configured via `OBSCURA_BIN_PATH` env var.


### 3.4 Job Description Quality Validation


After extraction, raw text validated before LLM call:


```typescript
interface ValidationConfig {
  minCharLength: number;        // default: 200
  requiredKeywords: string[];   // default: ["required", "preferred", "responsibilities", "qualifications", "experience"]
  minKeywordMatches: number;    // default: 1
}
```


If validation fails: log extraction failure, write row to CSV with `recommendation = "extraction failed: [reason]"`, skip LLM scoring.


---

## 4. Resume & CV Layer


### 4.1 CV Loader


```typescript
class CVLoader {
  static async loadFromLocal(path: string): Promise<string> {
    // Reads CV txt file from LOCAL_CV_PATH env var
    // Returns raw text content for injection into LLM prompts
  }


  static async loadFromGDrive(driveUrl: string): Promise<string> {
    // STUB: Fetch CV text from a Google Drive shareable link.
    // Purpose: enable remote CV updates without VPS file transfer.
    // Implementation note: requires GDrive API credentials or public share link parsing.
    // Current behaviour: throws NotImplementedError with guidance message.
    throw new Error("GDrive CV fetch not implemented. Set LOCAL_CV_PATH instead.");
  }
}
```


### 4.2 Resume Metadata Loader


Resume metadata files under `resumes/` directory:


```typescript
// resumes/mlops.ts
export default {
  role: "mlops",
  careerSummary: "...(max 250 words)...",
  filePath: "/home/user/resumes/resume-mlops.pdf"
} satisfies ResumeMetadata;
```


Loader scans `resumes/` directory, imports all metadata files, returns array for prompt injection.


---

## 5. LLM Layer


### 5.1 Provider Abstraction


```typescript
interface LLMProvider {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}


class OpenAIProvider implements LLMProvider { ... }
class LocalLlamaProvider implements LLMProvider { ... }
// Both call /v1/chat/completions — same interface, different base URLs
```


Selected via `MODEL_PROVIDER=openai|local` env var at startup. `OPENAI_API_KEY` and `LOCAL_LLM_BASE_URL` configured separately.


### 5.2 Prompt Files


All prompts under `prompts/` — no prompt text in application logic.


| File | Injected Variables |
|------|--------------------|
| `prompts/technical-fit.txt` | `{{CV_TEXT}}`, `{{JOB_DESCRIPTION}}` |
| `prompts/aspirational-fit.txt` | `{{JOB_DESCRIPTION}}` |
| `prompts/resume-match.txt` | `{{JOB_DESCRIPTION}}`, `{{CAREER_SUMMARIES}}` |
| `prompts/title-prefilter.txt` | `{{JOB_TITLE}}`, `{{ROLE_KEYWORDS}}` |


Prompt loader replaces `{{VARIABLE}}` tokens at runtime. Prompt files are source of truth — edit prompts without touching code.


### 5.3 Context Window Management


Resume match call specifically:
- 11 career summaries × 250 words ≈ 2750 words ≈ 3600 tokens
- JD: truncated to 800 tokens if raw extraction exceeds that
- Total ≈ 4400 tokens — fits within 8k context of Qwen 3.6B and standard OpenAI models


Technical fit call:
- CV text + JD — CV expected < 2000 tokens, JD ≤ 800 tokens


### 5.4 LLM Response Parsing


Each scoring call expects structured output. Prompts instruct model to respond in JSON only (no markdown fences, no preamble). Parser strips any accidental fences before JSON.parse.


Expected shapes:


**Technical fit:**
```json
{
  "score": 82,
  "reason": "...",
  "strengths": "...",
  "critical_gaps": "...",
  "reality_check": "...",
  "recommendation": "Apply",
  "upskill_time": null
}
```


**Aspirational fit:**
```json
{
  "score": 71,
  "reason": "...",
  "dimensions": {
    "salary": 2, "geography": 3, "favorite_skills": 3,
    "skills_to_learn": 2, "purpose": 3, "working_conditions": 2
  }
}
```


**Resume match:**
```json
{
  "matches": [
    { "role": "mlops", "score": 88, "reason": "..." },
    { "role": "data-eng", "score": 74, "reason": "..." },
    { "role": "ai-eng", "score": 61, "reason": "..." }
  ]
}
```


---

## 6. Environment Variables


| Variable | Required | Description |
|----------|----------|-------------|
| `MODEL_PROVIDER` | Yes | `openai` or `local` |
| `OPENAI_API_KEY` | If openai | OpenAI API key |
| `LOCAL_LLM_BASE_URL` | If local | e.g. `http://localhost:8080` |
| `LOCAL_CV_PATH` | Yes | Absolute path to CV txt file |
| `OBSCURA_BIN_PATH` | Yes | Absolute path to obscura binary |
| `OUTPUT_DIR` | Yes | Absolute path for CSV + log output |
| `STATE_DIR` | Yes | Absolute path for status + adhoc queue flat files |
| `PORT` | No | Fastify port, default 3000 |
| `MAX_CONCURRENCY` | No | Max concurrent job workflows, default 5 |
| `LOG_LEVEL` | No | `debug` / `info` / `error`, default `info` |


Missing required env vars: logged as fatal error to stderr + log file at startup. Pipeline aborts. No silent misconfiguration.


---

## 7. File & Folder Structure


```
seeker/
├── src/
│   ├── api/
│   │   ├── server.ts              # Fastify app setup
│   │   └── routes/
│   │       ├── adhoc.ts           # POST /jobs/adhoc
│   │       ├── run.ts             # POST /jobs/run, GET /jobs/run/sync
│   │       └── status.ts          # GET /jobs/status
│   ├── pipeline/
│   │   ├── orchestrator.ts        # Main pipeline logic, shared by async + sync routes
│   │   ├── title-filter.ts        # Title pre-filter LLM call
│   │   ├── technical-fit.ts       # Technical fit LLM call
│   │   ├── aspirational-fit.ts    # Aspirational fit LLM call
│   │   ├── resume-match.ts        # Resume match LLM call
│   │   └── csv-writer.ts          # CSV assembly + file write
│   ├── scrapers/
│   │   ├── base-scraper.ts        # Abstract base class
│   │   └── sites/
│   │       ├── hiring-cafe.ts
│   │       ├── climatebase.ts
│   │       ├── eures.ts
│   │       ├── work-in-finland.ts
│   │       └── generic.ts
│   ├── llm/
│   │   ├── provider.ts            # LLMProvider interface
│   │   ├── openai-provider.ts
│   │   ├── local-provider.ts
│   │   └── prompt-loader.ts       # Loads + interpolates prompt files
│   ├── resume/
│   │   ├── cv-loader.ts           # Local + GDrive stub
│   │   └── resume-loader.ts       # Scans resumes/ dir, loads metadata
│   ├── utils/
│   │   ├── logger.ts              # Per-run log file writer
│   │   ├── retry.ts               # Exponential backoff retry wrapper
│   │   ├── semaphore.ts           # Concurrency limiter
│   │   └── validation.ts          # JD quality validation
│   └── config/
│       └── env.ts                 # Env var loading + validation logging
├── prompts/
│   ├── technical-fit.txt
│   ├── aspirational-fit.txt
│   ├── resume-match.txt
│   └── title-prefilter.txt
├── resumes/
│   ├── mlops.ts
│   ├── ai-eng.ts
│   ├── data-eng.ts
│   └── ... (11 total)
├── state/
│   ├── run_status.json            # Pipeline status (read by /status endpoint)
│   └── adhoc_links.json           # Ad-hoc URL queue (cleared after each run)
├── output/                        # CSV files: jobs_YYYY-MM-DD.csv
├── logs/                          # Log files: run_YYYY-MM-DD_HH-MM-SS.log
├── tests/
│   ├── unit/
│   │   ├── scrapers/
│   │   ├── pipeline/
│   │   └── llm/
│   └── integration/
│       └── api/
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```


---

## 8. Cron Setup


```bash
# crontab -e
0 9 * * * cd /home/user/seeker && node dist/scripts/run-pipeline.js >> /home/user/seeker/logs/cron.log 2>&1
```


- Cron fires once daily at 09:00 VPS local time.
- Script calls same orchestrator function as `POST /jobs/run`.
- Long run logs written to per-run log file inside pipeline. Cron stdout/stderr captured separately to `logs/cron.log` for cron-level failures (e.g. node not found).
- PM2 manages the Fastify API process separately — cron script is a one-shot invocation.


---

## 9. Test Strategy


Framework: **Vitest** (TDD — tests written before implementation).


### Unit Tests


| Module | What to test |
|--------|-------------|
| `base-scraper` | robots.txt compliance logic, throttle delay range, quality validation |
| `title-filter` | Score threshold gate, skip reason generation |
| `technical-fit` | Response parsing, retry on failure, < 70 gate logic |
| `aspirational-fit` | Response parsing, default score 2 for missing salary/glassdoor |
| `resume-match` | Top-3 extraction, JD truncation at 800 tokens |
| `csv-writer` | Column order, sorting by total_fit, blank columns for skipped rows |
| `retry` | Backoff timing, max attempts, failure logging |
| `semaphore` | Max concurrency enforcement |
| `prompt-loader` | Variable interpolation, missing variable error |


### Integration Tests


| Test | What to verify |
|------|---------------|
| `POST /jobs/adhoc` | URLs appended to adhoc_links.json |
| `POST /jobs/run` | Returns 202, status transitions to running |
| `GET /jobs/run/sync` | Waits for completion, returns result summary |
| `GET /jobs/status` | Returns correct shape, progress % updates |


Integration tests mock LLM provider and Playwright. No real network calls in CI.


---

## 10. Deployment Notes


- VPS: Oracle Cloud free tier, Ubuntu 22.04
- Node.js: v20 LTS
- PM2: manages Fastify API process (`pm2 start dist/api/server.js --name seeker-api`)
- obscura binary: compiled Rust, placed at `OBSCURA_BIN_PATH`
- llama.cpp: deployed separately on same VPS, exposed at `http://localhost:8080/v1`
- Build: `tsc` compiles to `dist/`, cron and PM2 run from `dist/`
- `.env` file at project root, never committed


---

## 11. Known Limitations & Stubs (cross-reference: PRD §11)


| Stub | Location | Description |
|------|----------|-------------|
| `extractPostDate()` | `BaseScraper` | Returns null. Future: per-site date parsing for exact 24h filter. |
| `ClimatebaseScraper.authenticate()` | `scrapers/sites/climatebase.ts` | No-op. Future: Playwright login flow with stored session. |
| `CVLoader.loadFromGDrive()` | `resume/cv-loader.ts` | Throws NotImplementedError. Future: GDrive API or public share fetch. |
| `fetchGlassdoorRating()` | `pipeline/aspirational-fit.ts` | Not called. Future: scrape Glassdoor rating before Bolles scoring call. |
| Cross-site dedup | Not implemented | Same job on 2 sites = 2 rows. Future: URL normalisation + SHA hash dedup. |
