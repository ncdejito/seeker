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

## MVP option B: how to use and share

**Apply Kit** is a static page for Filipino job seekers targeting the EU, Spain, Australia, and remote roles (data engineer, product manager, full stack engineer, civil engineer, metal press technician). It does not call an AI API. It builds a copy-paste prompt for ChatGPT / Claude / Gemini, scores JD keywords in the browser, and keeps an application tracker in `localStorage`.

### Try it in under two minutes

1. Open [`apply-kit/index.html`](apply-kit/index.html) in a browser (double-click the file, or serve the folder). No install, no account.
2. Click **Load a 2-minute sample**.
3. Read the keyword score, then **Copy prompt** and paste it into ChatGPT, Claude, or Gemini.
4. Add a row in **Application tracker**, reload the page — the row is still there. **Export CSV** to send the table to a helper.

Screenshots: [`docs/screenshots/apply-kit-desktop.png`](docs/screenshots/apply-kit-desktop.png), [`docs/screenshots/apply-kit-prompt.png`](docs/screenshots/apply-kit-prompt.png), [`docs/screenshots/apply-kit-mobile.png`](docs/screenshots/apply-kit-mobile.png).

### Share it with someone non-technical

- **Send the folder:** zip `apply-kit/` and ask them to open `index.html`.
- **GitHub Pages:** on push to `main`, [`.github/workflows/apply-kit-pages.yml`](.github/workflows/apply-kit-pages.yml) deploys the folder to `/apply-kit`. Enable Pages: repo **Settings → Pages → GitHub Actions**. After that, the app is at `https://<user>.github.io/seeker/apply-kit/`.
- **Share progress, not the CV:** use **Export CSV**. Profile and tracker never leave the browser unless they export.

### What it does

| Step | What happens |
|---|---|
| Profile | Role, destination, CV text, optional Seven Petals notes — saved locally |
| Tailor | Paste a job ad → keyword overlap score + missing keywords (no LLM) |
| Prompt | Ready-to-copy prompt: tailored CV + cover letter, destination norms (Europass / Spanish CV / Australian resume / remote-async), role tips (PRC, TESDA NC), adapted from `prompts/resume-match.txt`, `prompts/technical-fit.txt`, `prompts/flower-fit.txt` |
| Tracker | Company, role, link, country, status, date, next step, notes · CSV import/export |
| Visas | Links to official EU, Spain, Australia, DMW, PRC, TESDA pages. Marked **verify on official site**. Not legal advice. |

### Limitations

- No backend, no accounts, no direct ChatGPT/Claude/Gemini API calls — you copy the prompt yourself.
- Keyword score is word overlap, not a hiring decision.
- Visa blurbs are pointers. Always verify on the official URL shown in the app.
- `localStorage` is per browser/device. Export CSV before clearing site data.

---

## Current Limitations

The full LLM-scored pipeline described in [`architecture.md`](architecture.md) (title pre-filter → technical fit → aspirational fit → resume match → ranked CSV, all automatic on a cron) is still being built — see [`AGENTS.md`](AGENTS.md) for exact status. Today, the working path is: scrape → filter by `state/preferences.json` → your AI agent sends the shortlist to Telegram, which is enough to replace manually checking job boards.

Other known gaps: Climatebase is blocked (Cloudflare, no public API); no cross-site dedup yet.

For full setup, environment variables, and project internals, see [AGENTS.md](AGENTS.md).
