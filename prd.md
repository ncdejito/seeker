# Seeker — Product Requirements Document


**Version:** 1.0  
**Status:** Draft  
**Last Updated:** 2026-05-02


---

## 1. Problem Statement


Manual job searching is time-consuming and inconsistent. Current workflow requires daily manual visits to 5+ job boards, copying links to Google Sheets, and manually running LLM scoring the next day. This creates lag, cognitive overhead, and misses jobs posted outside working hours. There is no structured way to match job openings against multiple resume versions or to quantify aspirational fit beyond gut feel.


---

## 2. Goal


Automate the full job discovery-to-shortlist pipeline so that every morning at 9am a ranked CSV of job openings is ready for review — scored for technical fit, aspirational fit, and best-matching resume version — requiring zero manual effort to produce.


---

## 3. Users


Solo user (owner). No multi-user requirements.


---

## 4. User Stories


| ID | Story |
|----|-------|
| US-01 | As a job seeker, I want a daily ranked list of job openings so I can focus time on tailoring applications not searching. |
| US-02 | As a job seeker, I want each job scored for technical fit so I know immediately if I am qualified. |
| US-03 | As a job seeker, I want each job scored for aspirational fit so I only apply where I want to work. |
| US-04 | As a job seeker, I want to know which resume version best matches each job so I can apply with the right one. |
| US-05 | As a job seeker, I want to submit ad-hoc job links throughout the day so they are included in the next morning's scoring run. |
| US-06 | As a job seeker, I want a REST API so I can trigger runs and submit links from an AI agent (OpenClaw) without touching the server. |
| US-07 | As a job seeker, I want a progress status endpoint so I know the pipeline is running and how far along it is. |


---

## 5. Functional Requirements


### 5.1 Scheduled Daily Run


- **FR-01** Pipeline triggers daily at 09:00 local VPS time via crontab.
- **FR-02** Each run produces one log file named `run_YYYY-MM-DD_HH-MM-SS.log` and one CSV named `jobs_YYYY-MM-DD.csv`.
- **FR-03** Pipeline processes jobs from the last 24 hours only (heuristic: pages 1–5 per site; exact date filtering is a stub — see Section 11).
- **FR-04** Ad-hoc links queued before 09:00 are included in that day's run and cleared from queue after processing.


### 5.2 Job Discovery


- **FR-05** System scrapes up to 5 configured job sites using URL-encoded search filters provided by the user.
- **FR-06** Per-site scrapers paginate up to 5 pages, extracting job listing URLs.
- **FR-07** URLs already processed in the current day's run (exact URL match) are skipped — no re-scoring.
- **FR-08** Each site scraper respects robots.txt: logs a warning if path is disallowed, limits request volume to appear as personal-use browsing (see Architecture §3.2).


### 5.3 Job Title Pre-filter


- **FR-09** Before fetching job description, system runs a lightweight LLM call comparing job title against role keywords derived from resume metadata.
- **FR-10** If title fit score < 40, skip full description extraction and scoring pipeline.
- **FR-11** Skipped jobs still appear in CSV with `skip_reason = "low title fit (score: N)"` in the recommendation column and blanks for all scoring columns.


### 5.4 Job Description Extraction


- **FR-12** Full job description fetched via Playwright + obscura for each job URL that passes title pre-filter.
- **FR-13** Extracted text validated for minimum quality: must meet minimum character length AND contain at least one keyword from a configurable required-keywords list (e.g. "required", "preferred", "responsibilities", "qualifications"). If validation fails, job is logged as extraction failure and marked in CSV recommendation column.
- **FR-14** Playwright uses a single shared browser instance per pipeline run. Concurrent scraping workflows queue for browser access (max 5 concurrent job-description workflows at any time).


### 5.5 LLM Scoring Pipeline


All LLM calls use the configured provider (llama.cpp local or OpenAI) set via `MODEL_PROVIDER` env var. Provider exposes OpenAI-compatible `/v1/chat/completions` endpoint regardless of which is selected.


#### 5.5.1 Technical Fit Scoring


- **FR-15** LLM called with CV text + job description using the Brutal Job Fit Analyzer prompt (see `prompts/technical-fit.txt`).
- **FR-16** Output: score 0–100, strengths alignment, critical gaps, reality check, recommendation, upskill time estimate.
- **FR-17** If technical fit score < 70, skip aspirational fit scoring and resume match scoring.
- **FR-18** Jobs with technical fit < 70 still appear in CSV with score and skip reason in recommendation column; all other scoring columns blank.


#### 5.5.2 Aspirational Fit Scoring


- **FR-19** LLM called with job description using the Bolles Fit prompt (see `prompts/aspirational-fit.txt`).
- **FR-20** Output: score 0–100 plus per-dimension scores (Salary, Geography, Favorite Skills, Skills to Learn, Purpose, Working Conditions).
- **FR-21** Glassdoor rating dimension: if rating not found in job description, default score for that dimension is 2 (uncertain). Glassdoor scraping is a stub for future implementation (see Section 11).
- **FR-22** Salary dimension: if salary not stated in job description, default score for that dimension is 2 (uncertain).


#### 5.5.3 Resume Version Matching


- **FR-23** LLM called with full job description + all 11 career summary paragraphs (250 words each max).
- **FR-24** Output: top 3 best-matching resume roles with fit score (0–100) and one-line reason per match.
- **FR-25** Resume metadata stored as JS files on VPS with fields: `role`, `careerSummary`, `filePath`.
- **FR-26** CV/resume files loaded from local path specified in `CV_PATH` env var. A GDrive dynamic fetch stub exists for future extension (see Architecture §4.1).


### 5.6 Output — CSV


- **FR-27** Single CSV file per day: `jobs_YYYY-MM-DD.csv`, saved to `OUTPUT_DIR` (configured via env var, documented in Architecture §6).
- **FR-28** All jobs (passed, failed, skipped) appear in one unified table.
- **FR-29** Rows ordered by `total_fit` descending (`total_fit = technical_fit + aspirational_fit`).
- **FR-30** CSV columns (in order):


| Column | Description |
|--------|-------------|
| `date` | Extraction date YYYY-MM-DD |
| `job_url` | Full job listing URL |
| `job_title` | Job title as scraped |
| `company` | Company name if extractable, else blank |
| `technical_fit` | Score 0–100 |
| `technical_fit_reason` | LLM explanation for technical fit score |
| `aspirational_fit` | Score 0–100 |
| `aspirational_fit_reason` | LLM explanation for aspirational fit score |
| `total_fit` | technical_fit + aspirational_fit |
| `top_resume_match_1` | Role name of best resume match |
| `resume_fit_score_1` | Fit score for match 1 |
| `resume_match_reason_1` | One-line reason for match 1 |
| `top_resume_match_2` | Role name of second best match |
| `resume_fit_score_2` | Fit score for match 2 |
| `resume_match_reason_2` | One-line reason for match 2 |
| `top_resume_match_3` | Role name of third best match |
| `resume_fit_score_3` | Fit score for match 3 |
| `resume_match_reason_3` | One-line reason for match 3 |
| `recommendation` | LLM directive (Apply / Upskill First / Look Elsewhere) or skip reason |
| `critical_gaps` | From technical fit analysis |
| `upskill_time` | Estimated upskill duration if applicable |


### 5.7 REST API


Base URL: `http://<VPS_IP>:<PORT>` — no authentication (VPS is private network).


| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/jobs/adhoc` | Submit one or more job URLs for next run |
| `POST` | `/jobs/run` | Trigger pipeline run asynchronously |
| `GET` | `/jobs/run/sync` | Trigger pipeline run synchronously, wait for result (for manual testing and ad-hoc use) |
| `GET` | `/jobs/status` | Returns current pipeline status, progress %, current step description |


**Status response shape:**
```json
{
  "status": "running | idle | failed | complete",
  "progress": 65,
  "current_step": "Scoring job descriptions (13/20)",
  "run_started_at": "2026-05-02T09:00:01Z",
  "last_completed_run": "2026-05-01T09:14:22Z"
}
```


**Ad-hoc submission shape:**
```json
{ "urls": ["https://example.com/job/123", "https://example.com/job/456"] }
```


### 5.8 Retry & Error Handling


- **FR-31** All LLM calls retry up to 5 times with exponential backoff on failure.
- **FR-32** If all 5 attempts fail, job row is written to CSV with `recommendation = "LLM call failed after 5 retries"` and blank scoring columns.
- **FR-33** All failures logged to run log file with timestamp, job URL, attempt count, and error message.
- **FR-34** Misconfigured env vars (missing required keys) logged as fatal error in log file at startup; pipeline aborts with clear message.


---

## 6. Non-Functional Requirements


| ID | Requirement |
|----|-------------|
| NFR-01 | Pipeline completes within 30 minutes for a typical run of ~100 jobs across 5 sites. |
| NFR-02 | Max 5 concurrent job-description scoring workflows at any time. |
| NFR-03 | Single shared Playwright browser instance per run; concurrent requests queue. |
| NFR-04 | LLM context window: full JD + 11 × 250-word career summaries must fit within model context. JD truncated to 800 tokens if needed before resume match call. |
| NFR-05 | Scraping behaviour must appear as personal-use browsing: random delays between requests, single browser session, no parallel multi-tab crawling per site. |
| NFR-06 | All prompts isolated in `prompts/` directory — no prompt text embedded in application logic. |
| NFR-07 | Model provider switchable at runtime via `MODEL_PROVIDER` env var without code changes. |
| NFR-08 | One log file per run, retained on VPS. Log rotation not in scope. |
| NFR-09 | Application process managed by PM2 to ensure uptime between cron triggers. |
| NFR-10 | All components covered by Vitest unit tests written before implementation (TDD). Integration tests cover all REST endpoints. |


---

## 7. Prompt Files


All prompts stored under `prompts/` directory. See Architecture §5 for file list and injection strategy.


| File | Purpose |
|------|---------|
| `prompts/technical-fit.txt` | Brutal Job Fit Analyzer — CV + JD → technical fit score + analysis |
| `prompts/aspirational-fit.txt` | Bolles 8 Criteria — JD → aspirational fit score + per-dimension scores |
| `prompts/resume-match.txt` | JD + career summaries → top 3 resume role matches with scores and reasons |
| `prompts/title-prefilter.txt` | Job title + role keywords → quick fit score for pre-filter gate |


---

## 8. Resume Metadata


11 JS metadata files under `resumes/` directory. Shape:


```js
export default {
  role: "mlops",
  careerSummary: "250-word paragraph...",
  filePath: "/home/user/resumes/resume-mlops.pdf"
}
```


Roles covered: defined by user. See Architecture §4.2 for loader implementation.


---

## 9. Configured Job Sources


| Site | Notes |
|------|-------|
| HiringCafe | Public, URL-filter encoded |
| Climatebase | Public for first pass; auth stub for future (see Section 11) |
| EURES | Public |
| WorkInFinland | Public |
| _(5th site TBD)_ | Public |


Filter URLs configured per-site in environment or config file. See Architecture §3.1.


---

## 10. Out of Scope


- Multi-user support
- Auto-upload to Google Drive (manual retrieval via OpenClaw)
- Glassdoor rating scraping (stub only)
- Cross-site job deduplication
- Exact post-date filtering (heuristic only)
- Climatebase authentication
- Email or notification delivery of CSV
- Dashboard UI


---

## 11. Known Limitations & Documented Stubs


| Limitation | Stub / Workaround |
|------------|-------------------|
| Cross-site dedup | Same job on 2 sites scored twice. Documented. Future: URL normalisation + hash dedup. |
| Post-date filtering | Pages 1–5 heuristic. Stub: `extractPostDate()` method on base scraper with description comment. |
| Glassdoor rating | Defaults to score 2 (uncertain) if not in JD. Stub: `fetchGlassdoorRating(company)` with description comment. |
| Climatebase auth | First pass public filters. Stub: `authenticate()` method on ClimatebaseScraper with description comment. |
| GDrive CV fetch | Local path resolver implemented. Stub: `fetchFromGDrive(url)` with description comment. |
| Context window overflow | JD truncated to 800 tokens before resume match call. Career summaries capped at 250 words each. |


---

## 12. References


- Architecture Document: `seeker-architecture.md` (same Drive folder)
- Prompt source: user's AI Prompts GDoc — "Company Fit" heading (Bolles), "Brutal Job Fit Analyzer" heading (Technical Fit)
- Resume metadata spec: Architecture §4.2
- Env var schema: Architecture §6
- Folder/file structure: Architecture §7
