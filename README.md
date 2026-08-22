<p align="center">
  <img src="public/logo.png" alt="Seeker logo" width="120" />
</p>

<h1 align="center">Seeker — Job Search Assistant</h1>

<p align="center">Never lose track of what you're actually looking for — scrape job boards, filter by your own criteria, and get only the good ones pushed to your phone.</p>

---

## Why

Manual job searching is time-consuming and inconsistent, and it's easy to drift into applying for anything instead of what you actually want. Seeker starts from a clear statement of what you want (the "Seven Petals" exercise from *What Color Is Your Parachute*), scrapes job boards against that, and sends only the roles worth your time to Telegram.

---

## How to use this repo

### 1. Figure out what you're actually looking for

Open [`prompts/flower-exercise.md`](prompts/flower-exercise.md) and paste its contents into ChatGPT, Claude, or any AI chat app. It will interview you about the seven petals — who you are, what you want to do, where, how, with whom, under what conditions, and why — and hand you back seven `FLOWER_PART1..7` strings.

### 2. Make this repo yours

Copy the example config and fill in the blanks:

```bash
cd src/seeker
cp .env.example .env
```

In `.env`, paste in:
- The `FLOWER_PART1..7` values from step 1
- `LOCAL_CV_PATH` — absolute path to your resume PDF
- `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` — message [@BotFather](https://t.me/BotFather) to create a bot and get a token; message [@userinfobot](https://t.me/userinfobot) to get your chat ID

Then set up your preferences and resumes:

```bash
cp state/preferences.example.json state/preferences.json
```

- **[`state/preferences.json`](state/preferences.example.json)** (from the example above) — hard filters: role keywords, seniority level, seniority titles to exclude (e.g. "director", "VP")
- **[`resumes/*.ts`](resumes)** — one file per resume variant you have (e.g. `ai-eng.ts`, `data-eng.ts`); each just needs a `role`, a `careerSummary`, and the `filePath` to that PDF

### 3. Ask your AI coding agent to find you jobs

With this repo open in Claude Code (or a similar coding agent), just ask:

> "Scrape today's jobs and send me the ones that match my preferences on Telegram."

The agent follows [`AGENTS.md`](AGENTS.md) to run the scrapers (`npm run build && node dist/scripts/scrape-today.js`), filter the results against `state/preferences.json`, and push the top matches with `node dist/scripts/send-telegram.js "..."`. Do this daily, or whenever you have a few minutes — it takes the place of manually refreshing five job boards.

---

## Files you'll want to edit

| File | What it's for |
|---|---|
| [`prompts/flower-exercise.md`](prompts/flower-exercise.md) | Copy-paste prompt to figure out your `FLOWER_PART1..7` answers |
| `.env` (from `.env.example`) | Your flower answers, resume path, Telegram credentials |
| `state/preferences.json` (from [`preferences.example.json`](state/preferences.example.json)) | Hard filters: keywords, seniority, excluded levels |
| [`resumes/*.ts`](resumes) | Your resume variant(s) — role, summary, PDF path |

---

## Key Features

- **Multi-site scraping** — Hiring Cafe, EURES, Work in Finland, Adzuna (Australia), each respecting that site's `robots.txt` and crawl-delay
- **Preference filtering** — drop jobs at excluded seniority levels before they ever reach you
- **Telegram delivery** — matches land in your chat, not buried in a spreadsheet
- **Flower-based fit criteria** — grounded in a real self-assessment, not just keyword matching

---

## Current Limitations

The full LLM-scored pipeline described in [`architecture.md`](architecture.md) (title pre-filter → technical fit → aspirational fit → resume match → ranked CSV, all automatic on a cron) is still being built — see [`AGENTS.md`](AGENTS.md) for exact status. Today, the working path is: scrape → filter by `state/preferences.json` → your AI agent sends the shortlist to Telegram, which is enough to replace manually checking job boards.

Other known gaps: Climatebase is blocked (Cloudflare, no public API); no cross-site dedup yet.

For full setup, environment variables, and project internals, see [AGENTS.md](AGENTS.md).
