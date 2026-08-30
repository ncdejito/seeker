# Skill Tree Job-Seeker Tool — Spec

## GOAL

Produce a functional specification for a "Skill Tree" feature in Seeker: a career skill map built from first principles (what a role actually requires, not what recruiters typed into a posting), overlaid with real market demand data, so a job-seeker can see which skills compound in value over years versus which expire by next quarter, and get a clear, evidence-backed next move.

Pitch: Most job-skill tools tell you what's trending this week — useless the moment you've half-learned it. This tool builds a career skill map from first principles, then overlays real market demand on top, so you can see which skills compound in value over years versus which ones expire by next quarter. Pick a role, see exactly what you're missing, see which adjacent roles your effort still counts toward if plans change, and get a quarterly check on whether the ground shifted under you — turning "I don't know if I'm doing the right thing" into a clear, evidence-backed next move.

## OUTPUT DEFINITION

Good output is a complete functional spec covering all 5 surfaces below, with every button/control's behavior stated, no gaps left for an implementer to guess at. Bad output invents mechanics not listed here, omits a module, or turns any surface into a hard-gated/locked progression (explicitly rejected below).

### Core Structure: 4 Modules + 1 Home Screen

Tool built as a **spectrum tree** (not gated nodes) — matches real skill-building: non-linear, driven by time/opportunity, not sequence-locked. Five surfaces total.

---

### 1. HOME — "Next Move" Screen

Landing screen every visit.

**Shows:**
- One card: "This week, do X" — single recommended action, generated from tree state + decay/demand data
- Confidence badge on recommendation ("High evidence" / "Best guess — data thin")
- Streak/momentum indicator (visits, tiles completed last 30 days)

**Buttons:**
- `Do this` → opens tile detail
- `Show me why` → expands reasoning (which questions/data drove this pick)
- `Give me something else` → reshuffles based on secondary priority

---

### 2. SKILL MAP — Core Tree

Primary workspace.

**Layout:** hexagon spectrum, base→advanced, grouped by skill cluster (not locked branches — user can jump anywhere).

**Tile states (color-coded):**
- Have it (evidence-backed)
- Have it (self-claimed, no evidence)
- Gap — known
- Gap — surfaced by tool (user didn't know to look)
- In progress
- Decaying (see Module 3)

**Tile requires verb-first naming** — "Deploy X," "Negotiate Y," not "Understand Z." Filters out filler/no-op skills.

**Buttons per tile:**
- `Mark complete` → prompts for evidence link (portfolio item, project, cert)
- `Set as goal` → pins to Next Move queue
- `Why this matters` → shows compounding/decay + demand data (pulls Module 3+5)
- `Not relevant to me` → removes/greys, feeds personalization model
- `See who else has this` → optional social layer (peer benchmark, anonymized)

**Global map controls:**
- `Reveal blind spots` → runs first-principles gap scan (not JD-keyword matching — infers adjacent/foundational skills missing given current cluster)
- `Compress to my level` → hides tiles 2+ tiers above current zone (reduce overwhelm)
- `Full tree` toggle → un-hide everything

---

### 3. TIME VALUE LENS — Compounding vs Decaying

Overlay on Skill Map, not a separate screen — toggle-activated.

**Visual overlay on tiles:**
- Solid border = compounding (durable, cross-role value)
- Dashed border = decaying (narrow tool/version-specific, half-life visible)
- Pulsing = hype-flagged (rising fast, unproven longevity — caution marker)

**Per-tile data panel (on tap):**
- Trend line: demand over time (job postings mentioning skill, last 12–24mo)
- Half-life estimate: "typically stays relevant ~X years"
- Source count / confidence level

**Buttons:**
- `Refresh signal` → re-pulls current market data for this tile
- `Flag as stale` (manual override if user has direct market intel)
- `Compare two skills` → side-by-side trend for decision between competing tiles

**Recurring check-in:**
- Scheduled nudge (weekly/monthly, user-set): "3 of your skills moved tiers since last check — review?"
- `Run relevance audit` button → re-scores entire "Have it" tile set against current market, flags any newly-decaying

---

### 4. ROLE FIT — Position Finder

**Primary view:** ranked list of roles, scored against current tree state (% overlap, not keyword match — weighted by tile tier/evidence strength).

**Per role card:**
- Fit score + gap list (tiles needed to close distance)
- `This is Plan A` toggle
- `Show adjacent roles` → surfaces Plan B/C cluster: roles sharing 70%+ of current tree, ranked by smallest remaining gap
- `Industry lens` toggle → same role, filtered by industry: shows which industries let existing tiles **carry over** (amplify) vs require new base-tier tiles (reset)

**Buttons:**
- `Set as target` → pulls gap tiles into Skill Map as goals, auto-updates Home recommendation
- `Compare roles side by side` → up to 3 roles, tile-overlap Venn-style
- `Why ranked here` → transparency on scoring inputs

---

### 5. PORTFOLIO / EVIDENCE LEDGER

Required infrastructure — self-grading only works if backed by proof, else the tool becomes a self-deception engine.

**Contents:**
- List of completed tiles + attached evidence (link, file, description)
- `Export as portfolio` → generates shareable page/PDF for job applications, sorted by target role's required tiles first
- `Add evidence retroactively` to already-claimed tiles (upgrades self-claimed → evidence-backed status, raises confidence score used elsewhere in tool)

---

### Cross-Cutting Mechanics

- **No hard gating.** Any tile explorable/completable regardless of tier — matches real-world non-linear skill acquisition. Locking mechanic explicitly rejected (per game-design research: gating in non-game skill contexts frustrates rather than motivates).
- **No punishing respec.** Changing target role/goal tiles = free, instant, no cost. Real careers pivot; system shouldn't penalize reconsideration.
- **Meaningful-skill filter baked into tile creation.** Every tile must pass: does completing this change what user can *do* (verb-driven, portfolio-demonstrable) — not passive "understand/learn about" filler. Filler tiles excluded from tree at data layer, not just UI.
- **Failure/setback tiles included** in relevant clusters (e.g., "Shipped something that failed, wrote up why") — normalizes setbacks as progress, not just wins tracked.
- **Notification/nudge system** ties Module 3 + Home together — proactive, not just pull-based: user shouldn't have to remember to check staleness.

## TEST

Run these after generation:

- **Coverage check:** All 5 surfaces present (Home, Skill Map, Time Value Lens, Role Fit, Portfolio/Evidence Ledger), each with its full button/control list from this spec.
- **No-gating check:** Confirm no locking/prerequisite mechanic appears anywhere in the spec or any derived implementation plan.
- **Verb-first check:** Any example tile names introduced are verb-first and portfolio-demonstrable, not "understand/learn about" filler.
- **Traceability check:** Every button listed states what it does (action + resulting state change) — none left as a bare label with no behavior.
- **Scope check:** No mechanics beyond what's listed here (no added gamification, no added gating, no invented modules) unless explicitly requested in a follow-up.
- **Failure protocol:** If a derived implementation plan or build fails any check above, narrow the goal to the single offending module and revise before rerunning against the full spec.
