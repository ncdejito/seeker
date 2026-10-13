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

## MVP option C: how to use and share

A shareable **Daily Job Digest** for Filipino seekers targeting, in priority, **EU / EEA, Spain, Australia, and remote** roles. It covers five titles: data engineer, product manager, full stack engineer, civil engineer, and metal press technician.

No account, no paid API, and no LLM scoring. One command refreshes a static page you can send in Messenger, WhatsApp, or Telegram.

### Try it in under 2 minutes

1. Open the latest snapshot: [`docs/digest/index.html`](docs/digest/index.html) (download the file and open it in a browser), or the GitHub Pages URL once Pages is enabled: `https://ncdejito.github.io/seeker/`
2. Filter by role and destination. Each card links out to the original listing (EURES, Remotive, Remote OK, We Work Remotely, Arbeitnow, Adzuna AU).
3. Read the yellow **Verify on official site** box before treating any badge as a visa answer.

### Generate a fresh digest

```bash
npm run digest
```

That builds the TypeScript and writes:

- `docs/digest/index.html` — mobile-friendly page, grouped by role then destination
- `docs/digest/digest.json` — the same data as JSON

Optional environment variables (all skip cleanly when missing):

| Variable | Effect |
|---|---|
| `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | Include Australia listings via the existing Adzuna AU API |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Send a short summary through the existing Telegram helper |
| `DIGEST_PUBLIC_URL` | Link included in the Telegram message (defaults to the GitHub Pages URL) |

Roles, keywords, destinations, and official visa URLs live in [`state/digest-config.json`](state/digest-config.json).

### Share

- Send the GitHub Pages link once the daily workflow has published it
- Or send `docs/digest/index.html` as a file — it is self-contained (CSS and filters inlined)
- A GitHub Actions workflow runs daily at 06:00 UTC and on `workflow_dispatch`, then publishes `docs/digest/` to GitHub Pages. No secrets are required. Adzuna and Telegram run only if those repository secrets exist.

The workflow YAML is [`docs/digest-workflow.yml`](docs/digest-workflow.yml). Copy it to `.github/workflows/digest.yml` once (GitHub OAuth tokens without the `workflow` scope cannot push files under `.github/workflows/`). Then enable Pages: **Settings → Pages → Source: GitHub Actions**.

### Limitations

- Listings are recent public posts, not a ranked “best fit”. There is no resume matching on this path.
- Visa / sponsorship / worldwide-remote badges are **keyword heuristics**. They are not legal advice. Confirm on the employer listing and on the official pages linked in the digest.
- Adzuna Australia is omitted unless API keys are present (free tier at developer.adzuna.com).
- EURES is queried through the portal’s public JSON search and throttled to the `robots.txt` crawl-delay of 10 seconds, so a run takes a couple of minutes.
- Remote boards (Remotive, Remote OK, We Work Remotely) rarely carry civil engineering or metal press roles; those titles depend more on EURES / Arbeitnow.
- Sources can be briefly down; the digest still publishes with whatever succeeded.

---

## Files you'll want to edit

| File | What it's for |
|---|---|
| [`prompts/flower-exercise.md`](prompts/flower-exercise.md) | Copy-paste prompt to figure out your `FLOWER_PART1..7` answers |
| `.env` (from `.env.example`) | Your flower answers, resume path, Telegram credentials |
| `state/preferences.json` (from [`preferences.example.json`](state/preferences.example.json)) | Hard filters: keywords, seniority, excluded levels |
| [`resumes/*.ts`](resumes) | Your resume variant(s) — role, summary, PDF path |
| [`state/digest-config.json`](state/digest-config.json) | Daily digest roles, keywords, destinations, official visa URLs |

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
