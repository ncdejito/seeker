# Robotics Skill Tree — Data Build Spec

Companion to [`skill-tree-spec.md`](./skill-tree-spec.md) (functional spec for the tool). This spec covers only the data build: populating a first Skill Map (Module 2) for the robotics track — no UI, no scoring engine, no scraping code. Do not execute against this spec until told to.

## GOAL

Produce a robotics skill tile set (base tree + target-role gap tiles) sourced from `~/obsidian-git/gdrive/areas/learning/Learning for Work.xlsx`, with the target/frontier tiles anchored to real job requirements Seeker has extracted from live robotics postings.

## SOURCES

- **`Learning for Work.xlsx`** — the manually/LLM-curated precursor data for this tool. Relevant sheets:
  - `Seniority` — tier ladder (Junior → Mid → Senior → Tech Lead → Architect → CTO) with per-tier scope/autonomy/complexity text. Used as the tree's tier axis (base→advanced), not the cluster axis.
  - `Requirements` — role → representative phrase → extracted qualification quotes (with company + Required/Preferred classification) → tools mentioned → occurrence count. Already contains a `Robotics AI Engineer` block sourced from real postings (BMW, Google DeepMind, Figure, RIVR, RLWRLD, GrayMatter, RoboService, Flexion, FieldAI, Bedrock, Analog Devices, Hugging Face, PFN, Rerun, Telekinesis, Qualia). This is the primary source for target/frontier tiles.
  - `Competencies` — role → competency → tools → three-tier proficiency ladder (Familiar/Experienced/Proficient) → expected level → current level → strength of evidence → evidence text → last used. This is the primary source for tile definitions and current "Have it" state (evidence-backed vs self-claimed).
  - `Tools` — role → competency → specific tool → reward/risk scores → rationale → strengths/weaknesses → JD mention count. Feeds Module 3 (Time Value Lens): reward/risk here map to compounding-vs-decaying/hype-flagged, and JD-mention-count is a rough demand proxy.
  - `Certifications`, `Industry Reports` — currently sparse link/note lists, not structured rows. Treat as manual backlog, not an automated source, until reshaped.
- **Seeker's own job-requirement extraction** — Seeker (`src/seeker`, this repo) is the "other tool": it scrapes and stores real robotics/physical-AI postings (Hiring Cafe, EURES, Work in Finland, etc.). The `Requirements` sheet's quotes were extracted from postings Seeker surfaced. Any *new* target-role gap tiles beyond what's already in `Requirements` must be sourced the same way: real posting text Seeker has stored or fetched, not invented from general robotics knowledge.
- **Wireframe reference** — the attached bundled HTML mockup and the OER Australasia chapter (`https://oercollective.caul.edu.au/openedaustralasia/chapter/using-skill-tree/`) are visual/interaction inspiration only. They inform layout of Module 2 in a later UI spec; they carry no data for this build.

## OUTPUT DEFINITION

Output is a single structured tile dataset (format TBD at implementation time — e.g. JSON/YAML list) for the robotics cluster, where:

Good:
- Every tile maps to one `Competencies` row (tile name = competency, verb-recast if the sheet's phrasing is passive — e.g. "VLA & Foundation Model Experience" → "Fine-tune a VLA model").
- Every tile carries: cluster (from `Focus`/`Role`), tier (derived from Familiar/Experienced/Proficient ladder text, not a guess), current state (from `Current Level` + `Strength of Evidence` — "Direct" evidence = evidence-backed, "Transferable"/blank = self-claimed), associated tools (from `Tools` sheet rows sharing that competency).
- Frontier/gap tiles (tiles the user doesn't have yet, marking what to build toward) are tiles present in `Requirements`' extracted qualifications for `Robotics AI Engineer` but absent or below `Expected Level` in `Competencies`.
- Each frontier tile cites its source quote(s) and company/posting count from `Requirements` (the `Occurrence Count` column) — this is what makes it "extracted," not asserted.
- Time-Value data per tile (reward/risk/JD-mention-count) is carried over verbatim from the `Tools` sheet where a matching tool/competency row exists; tiles with no `Tools` row are left with time-value fields empty, not backfilled with a guess.
- No tile is created for a `Requirements` phrase that has zero matching `Competencies` or `Tools` row AND zero direct quote — i.e., no invented tiles.

Bad:
- Tiles invented from general robotics-industry knowledge not traceable to a row in the xlsx or a Seeker-sourced posting.
- Tiles named as passive "Understand/Learn about X" (violates the verb-first, meaningful-skill filter from `skill-tree-spec.md`).
- Tier or current-state values asserted without a corresponding `Current Level`/`Expected Level`/evidence cell.
- Any hard-gating or sequencing imposed on the output tile list (violates "No hard gating" cross-cutting mechanic).
- Mixing in tiles from non-robotics roles in the xlsx (e.g. the `AI Engineer` rows) unless a competency is explicitly shared by both role rows in `Requirements`/`Competencies`.

## TEST

- **Traceability check:** pick 5 tiles at random; each must resolve back to a specific row/cell in the xlsx (or a specific Seeker-stored posting for a frontier tile not yet in `Requirements`). No tile without a citation.
- **Verb-first check:** every tile name passes the meaningful-skill filter — starts with a verb, is portfolio-demonstrable.
- **Gap-accuracy check:** every frontier/gap tile is confirmed absent (or below `Expected Level`) in `Competencies` for the robotics role — cross-check, don't take the gap list on faith.
- **No cross-role bleed:** confirm no tile derives solely from the `AI Engineer` rows without an explicit robotics-role match.
- **Time-value completeness note:** report, don't silently drop, any tile with no `Tools`-sheet match — these need a manual reward/risk pass before Module 3 can render them.
- **Failure protocol:** if traceability or gap-accuracy fails on more than 1 of 5 sampled tiles, stop and re-derive the mapping rule between `Requirements`/`Competencies` rows and tiles before regenerating — don't patch individual tiles.
