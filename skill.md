# Hermes — Seeker Job Alert Agent

## Description
Hermes polls job APIs hourly, scores them via LLM, and sends Telegram alerts for high-fit jobs.

## Architecture
```
Every hour:
  1. Fetch new jobs from Adzuna, Remotive, EURES
  2. Title-filter (LLM) — skip low-fit titles
  3. Technical-fit + Aspirational-fit scoring
  4. If total_fit >= threshold → Telegram alert
  5. Dedup: skip already-seen job IDs
```

## Configuration

### Zero-config (agent-native, default)
No API keys needed. The running opencode agent handles all scoring.
```
MODEL_PROVIDER=opencode   # default — uses `opencode run` CLI
LOCAL_CV_PATH=~/cv.pdf    # your CV for resume-match scoring
```

### With external LLM
```
MODEL_PROVIDER=openai
OPENAI_API_KEY=sk-...
LOCAL_CV_PATH=~/cv.pdf

# or local llama.cpp:
MODEL_PROVIDER=local
LOCAL_LLM_BASE_URL=http://localhost:8080
LOCAL_CV_PATH=~/cv.pdf
```

Telegram alerts (optional):
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`

## User Preference Store
Save to Hermes memory:
- Role keywords
- Preferred locations
- Seniority level
- Minimum total_fit threshold (default: 120)

## Job Dedup Store
Flat file at `state/seen_job_ids.json` — append-only list of processed job IDs.

## API Integrations
- Adzuna (free tier): `https://api.adzuna.com/v1/api/jobs/{country}/search/{page}`
- Remotive (no key): `https://remotive.com/api/remote-jobs`
- EURES REST API: `https://ec.europa.eu/eures/api/jobsearch`

## Alert Format
```
🔥 *High-Fit Job Alert*
{job_title} @ {company}
Fit: {total_fit}/200
Apply: {apply_url}
```

## Usage

### One-shot scan (agent picks this up and runs it)
```bash
cd ~/product-incubator/src/seeker
npm install
MODEL_PROVIDER=opencode LOCAL_CV_PATH=~/cv.pdf npm run pipeline
```
Pipeline fetches jobs → agent scores each one → results written to `output/results.csv`.

### Scheduled (cron + Telegram alerts)
1. Copy `.env.example` to `.env`, set `LOCAL_CV_PATH` (and Telegram vars if wanted)
2. `pm2 start ecosystem.config.js`
3. Alerts arrive in Telegram when `total_fit >= 120`

## Notes
- ClimateBase: skipped entirely (no public API, CF-blocked)
- Title filter runs first to minimize LLM cost
