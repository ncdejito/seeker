# Seeker — Job Search Assistant

Automate job discovery, scoring, and alerts so you focus on tailoring applications, not searching.

---

## Why

Manual job searching is time-consuming and inconsistent. Seeker scrapes job boards hourly, scores each opening for technical fit and aspirational fit via LLM, and alerts you only for high-fit roles. You tell it your preferences via the "Seven Parts of the Flower" exercise from *What Color is Your Parachute*, and it filters jobs to those that match your goals, location, work style, conditions, and purpose.

---

## How It Works

```text
Job sites + ad-hoc links
        │
        ▼
Title pre-filter (LLM, score >= 40 → skip description)
        │
        ▼
Technical fit scoring (CV + JD, 0-100, strengths/gaps)
        │
        ▼
Aspirational fit scoring (JD, 5 dimensions: salary, geo, skills, purpose, conditions)
        │
        ▼
Resume match scoring (JD + 11 resumes, top 3 matches)
        │
        ▼
Flower fit scoring (JD + 7 flower parts, 7 part scores + overall)
        │
        ▼
Ranked CSV + Telegram alerts (total_fit >= 120)
```

---

## Key Features

- **Title pre-filter** — Skip jobs with mismatched titles before fetching descriptions (saves LLM cost)
- **Technical fit** — Score 0-100 with strengths, critical gaps, upskill estimate
- **Aspirational fit** — 5 dimensions: salary, geography, favorite skills, skills to learn, purpose, working conditions
- **Resume matching** — Top 3 resume versions with fit scores and reasons
- **Flower assessment** — 7 parts from *What Color is Your Parachute* → per-job fit scores + recommendation
- **Ranked output** — CSV sorted by `total_fit` (technical + aspirational)
- **Telegram alerts** — High-fit jobs pushed to you (configurable)

---

## Prerequisites

- Node.js 18+
- One LLM provider:
  - **OpenAI**: `OPENAI_API_KEY` env var
  - **Local (llama.cpp)**: `MODEL_PROVIDER=local`, `LOCAL_LLM_BASE_URL`
  - **Opencode (default)**: No API key needed — uses `opencode run` CLI
- CV path: `LOCAL_CV_PATH` (absolute path to your resume PDF)
- Optional: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` for alerts

---

## Environment Variables (`.env.example`)

```bash
MODEL_PROVIDER=opencode           # default, no API key needed
LOCAL_CV_PATH=/path/to/cv.pdf     # required
FLOWER_PART1-7=...                # Seven Parts of the Flower answers (V2)
TELEGRAM_BOT_TOKEN=...            # optional, for alerts
TELEGRAM_CHAT_ID=...              # optional, for alerts
```

---

## Usage

### One-shot scan (recommended)

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

---

## Project Structure

```text
src/
├── api/server.ts           Fastify REST API
├── config/env.ts           Env loader (required vars + flower)
├── pipeline/
│   ├── orchestrator.ts     Main pipeline + flower integration
│   ├── title-filter.ts     LLM title pre-filter (score >= 40)
│   ├── technical-fit.ts    Technical scoring (CV + JD)
│   ├── aspirational-fit.ts Aspirational scoring (5 dimensions)
│   ├── resume-match.ts     Resume matching (top 3 from 11 resumes)
│   └── csv-writer.ts       CSV output (sorted by total_fit)
├── flower/                 V2: Flower exercise parser + criteria
├── scrapers/              Job site scrapers (HiringCafe, EURES, WorkInFinland)
├── llm/                   LLM provider abstraction (OpenAI/local/opencode)
├── resume/                CV/resume loaders
└── scripts/               Runnable pipelines (run-pipeline.ts)
```

---

## Tests

```bash
npm test          # runs vitest (unit tests only, no network)
# Flower tests: tests/unit/flower/exercise.test.ts
```

---

## Output: CSV Columns

`date, job_url, job_title, company, technical_fit, technical_fit_reason, aspirational_fit, aspirational_fit_reason, total_fit, top_resume_match_1, resume_fit_score_1, resume_match_reason_1, top_resume_match_2, resume_fit_score_2, resume_match_reason_2, top_resume_match_3, resume_fit_score_3, resume_match_reason_3, recommendation, critical_gaps, upskill_time, flowerFitScore, part1Score-part7Score, flowerSummary`

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **API:** Fastify
- **Scraping:** Playwright + obscura (stealth mode)
- **LLM:** OpenAI / local (OpenAI-compatible) / opencode CLI
- **Process:** PM2
- **Storage:** Flat files (no database)

---

## Gaps / Known Limitations

- Cross-site dedup: same job on 2 sites scored twice (documented future: URL normalisation)
- Post-date filtering: pages 1–5 heuristic only
- Glassdoor rating: defaults to 2 (uncertain) if not in JD
- Climatebase: blocked (no public API support)
- Multi-user: single-user only