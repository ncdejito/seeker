import type { DigestConfig, DigestJob, DigestOutput, EligibilityFlag } from './types.js';
import { escapeHtml, formatPosted, isHttpUrl } from './text.js';

const BADGE_CLASS: Record<EligibilityFlag, string> = {
  'worldwide-remote': 'badge-remote',
  'visa-sponsorship': 'badge-visa',
  'open-to-non-eu': 'badge-open',
  unknown: 'badge-unknown',
};

function safeHref(url: string): string {
  return isHttpUrl(url) ? escapeHtml(url) : '#';
}

function formatHumanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function jobCard(job: DigestJob): string {
  return `
<article class="card" data-role="${escapeHtml(job.roleId)}" data-destination="${escapeHtml(job.destinationId)}" data-eligibility="${escapeHtml(job.eligibility)}">
  <div class="card-top">
    <span class="source">${escapeHtml(job.source)}</span>
    <time datetime="${escapeHtml(job.postedAt || '')}">${escapeHtml(formatPosted(job.postedAt))}</time>
  </div>
  <h4><a href="${safeHref(job.url)}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a></h4>
  <p class="meta">${escapeHtml(job.company)} · ${escapeHtml(job.location)}</p>
  <p class="snippet">${escapeHtml(job.snippet)}</p>
  <div class="card-foot">
    <span class="badge ${BADGE_CLASS[job.eligibility]}" title="${escapeHtml(job.eligibilityReason)}">${escapeHtml(job.eligibilityLabel)}</span>
    <a class="apply" href="${safeHref(job.url)}" target="_blank" rel="noopener">Open listing</a>
  </div>
</article>`;
}

export function renderHtml(digest: DigestOutput, config: DigestConfig): string {
  const generated = formatHumanDate(digest.generatedAt);
  const roleFilters = config.roles
    .map((r) => `<button type="button" class="chip" data-filter-role="${escapeHtml(r.id)}">${escapeHtml(r.label)}</button>`)
    .join('');
  const destFilters = config.destinations
    .map((d) => `<button type="button" class="chip" data-filter-dest="${escapeHtml(d.id)}">${escapeHtml(d.label)}</button>`)
    .join('');

  const groups = config.roles.map((role) => {
    const roleJobs = digest.jobs.filter((j) => j.roleId === role.id);
    const destBlocks = config.destinations.map((dest) => {
      const jobs = roleJobs.filter((j) => j.destinationId === dest.id);
      if (!jobs.length) {
        return `<section class="dest empty" data-destination="${escapeHtml(dest.id)}"><h3>${escapeHtml(dest.label)}</h3><p class="empty-note">No recent listings in this snapshot.</p></section>`;
      }
      return `<section class="dest" data-destination="${escapeHtml(dest.id)}"><h3>${escapeHtml(dest.label)} <small>${jobs.length}</small></h3><div class="grid">${jobs.map(jobCard).join('')}</div></section>`;
    }).join('');
    return `<section class="role" id="role-${escapeHtml(role.id)}" data-role="${escapeHtml(role.id)}">
      <h2>${escapeHtml(role.label)} <small>${roleJobs.length}</small></h2>
      ${destBlocks}
    </section>`;
  }).join('\n');

  const official = digest.officialLinks
    .map((l) => `<li><a href="${safeHref(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.label)}</a></li>`)
    .join('');

  const sourceLine = digest.sources
    .map((s) => s.ok ? `${s.id} (${s.fetched})` : `${s.id} (unavailable)`)
    .join(' · ');

  const ogDesc = `${digest.counts.total} recent listings for ${config.roles.map((r) => r.label.toLowerCase()).join(', ')}. For Filipino seekers targeting EU, Spain, Australia, and remote.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seeker Daily Job Digest — ${escapeHtml(generated)}</title>
  <meta name="description" content="${escapeHtml(ogDesc)}" />
  <meta property="og:title" content="Seeker Daily Job Digest — ${escapeHtml(generated)}" />
  <meta property="og:description" content="${escapeHtml(ogDesc)}" />
  <style>
    :root {
      --ink: #1c241c;
      --muted: #5c6758;
      --paper: #f4efe4;
      --card: #fffdf8;
      --line: #ddd4c4;
      --forest: #1f3d2b;
      --gold: #c4922a;
      --remote: #1f6f5b;
      --visa: #8a4b12;
      --open: #355f8a;
      --unknown: #6b6458;
    }
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    body {
      margin: 0;
      font-family: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
      background: var(--paper);
      color: var(--ink);
      line-height: 1.5;
    }
    header {
      background: var(--forest);
      color: #f6f1e6;
      padding: 1.75rem 1.25rem 1.5rem;
    }
    header .wrap, main, footer .wrap { max-width: 980px; margin: 0 auto; }
    .eyebrow { letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.72rem; color: #d9c48a; margin: 0 0 0.4rem; }
    h1 { font-family: Georgia, "Source Serif 4", serif; font-weight: 600; font-size: clamp(1.6rem, 4vw, 2.3rem); margin: 0 0 0.4rem; }
    header p { margin: 0.2rem 0; color: #e6e0d2; }
    .count { display: inline-block; margin-top: 0.85rem; background: #163022; border: 1px solid #2f5a40; border-radius: 999px; padding: 0.25rem 0.75rem; font-size: 0.9rem; }
    .notice {
      background: #fff7d6;
      border: 1px solid #e2c56a;
      border-radius: 12px;
      padding: 1rem 1.1rem;
      margin: 1.25rem auto;
      max-width: 980px;
    }
    .notice strong { color: #6a4b00; }
    .notice ul { margin: 0.5rem 0 0; padding-left: 1.1rem; }
    .filters {
      position: sticky; top: 0; z-index: 5;
      background: rgba(244,239,228,0.94);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--line);
      padding: 0.7rem 1.25rem;
    }
    .filters .wrap { display: flex; flex-direction: column; gap: 0.45rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .chip {
      border: 1px solid var(--line);
      background: #fff;
      color: var(--ink);
      border-radius: 999px;
      padding: 0.35rem 0.8rem;
      min-height: 40px;
      font: inherit;
      cursor: pointer;
    }
    .chip[aria-pressed="true"] { background: var(--forest); color: #fff; border-color: var(--forest); }
    h2 { font-family: Georgia, serif; font-size: 1.55rem; margin: 1.6rem 0 0.4rem; }
    h2 small, h3 small { color: var(--muted); font-family: inherit; font-weight: 500; font-size: 0.85rem; }
    h3 { margin: 1rem 0 0.6rem; font-size: 1.05rem; color: var(--forest); }
    .grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 720px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 0.9rem 1rem 0.85rem;
      display: flex; flex-direction: column; gap: 0.35rem;
    }
    .card-top { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.78rem; color: var(--muted); }
    .source { font-weight: 600; color: var(--gold); letter-spacing: 0.02em; }
    .card h4 { margin: 0; font-size: 1.02rem; line-height: 1.35; }
    .card h4 a { color: inherit; text-decoration: none; }
    .card h4 a:hover { text-decoration: underline; }
    .meta { margin: 0; color: var(--muted); font-size: 0.9rem; }
    .snippet { margin: 0; font-size: 0.88rem; color: #3f473d; flex: 1; }
    .card-foot { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 0.4rem; }
    .badge { font-size: 0.72rem; font-weight: 600; border-radius: 999px; padding: 0.2rem 0.55rem; }
    .badge-remote { background: #e4f4ee; color: var(--remote); }
    .badge-visa { background: #f7ead8; color: var(--visa); }
    .badge-open { background: #e4eef7; color: var(--open); }
    .badge-unknown { background: #eeeae3; color: var(--unknown); }
    .apply { font-size: 0.85rem; font-weight: 600; color: var(--forest); }
    .empty-note, .hidden-empty { color: var(--muted); font-size: 0.9rem; }
    footer { padding: 2rem 1.25rem 3rem; color: var(--muted); font-size: 0.88rem; }
    footer a { color: var(--forest); }
    .role.is-hidden, .dest.is-hidden, .card.is-hidden { display: none; }
    .no-matches { display: none; margin: 1.5rem auto; max-width: 980px; color: var(--muted); }
    .no-matches.show { display: block; }
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <p class="eyebrow">Seeker · MVP option C</p>
      <h1>Daily Job Digest</h1>
      <p>${escapeHtml(digest.audience)}</p>
      <p>Snapshot of ${escapeHtml(generated)} (UTC). Tap a role to apply on the original board.</p>
      <span class="count">${digest.counts.total} listings after filters &amp; dedupe</span>
    </div>
  </header>

  <aside class="notice">
    <strong>Verify on official site.</strong> ${escapeHtml(digest.disclaimer)}
    <ul>${official}</ul>
  </aside>

  <div class="filters">
    <div class="wrap">
      <div class="chips" role="group" aria-label="Filter by role">
        <button type="button" class="chip" data-filter-role="all" aria-pressed="true">All roles</button>
        ${roleFilters}
      </div>
      <div class="chips" role="group" aria-label="Filter by destination">
        <button type="button" class="chip" data-filter-dest="all" aria-pressed="true">All destinations</button>
        ${destFilters}
      </div>
    </div>
  </div>

  <main>
    <p class="no-matches" id="no-matches">No listings match those filters in this snapshot.</p>
    ${groups}
  </main>

  <footer>
    <div class="wrap">
      <p>Sources this run: ${escapeHtml(sourceLine)}.</p>
      <p>Remote listings include attribution as required by each board:
        <a href="https://remotive.com" target="_blank" rel="noopener">Remotive</a>,
        <a href="https://remoteok.com" target="_blank" rel="noopener">Remote OK</a>,
        <a href="https://weworkremotely.com" target="_blank" rel="noopener">We Work Remotely</a>,
        and <a href="https://www.arbeitnow.com" target="_blank" rel="noopener">Arbeitnow</a>.
        EU/Spain listings come from the public <a href="https://europa.eu/eures" target="_blank" rel="noopener">EURES</a> search API.
        Australia listings come from the <a href="https://developer.adzuna.com" target="_blank" rel="noopener">Adzuna AU</a> API when keys are present.</p>
      <p>Generated by <a href="https://github.com/ncdejito/seeker">ncdejito/seeker</a>. Heuristic badges only — not a visa assessment.</p>
    </div>
  </footer>
  <script>
    const roleBtns = [...document.querySelectorAll("[data-filter-role]")];
    const destBtns = [...document.querySelectorAll("[data-filter-dest]")];
    const params = new URLSearchParams(location.search);
    let role = params.get("role") || "all";
    let dest = params.get("dest") || "all";
    function apply() {
      document.querySelectorAll(".card").forEach((card) => {
        const okRole = role === "all" || card.dataset.role === role;
        const okDest = dest === "all" || card.dataset.destination === dest;
        card.classList.toggle("is-hidden", !(okRole && okDest));
      });
      document.querySelectorAll(".dest").forEach((section) => {
        const visible = [...section.querySelectorAll(".card")].some((c) => !c.classList.contains("is-hidden"));
        const destOk = dest === "all" || section.dataset.destination === dest;
        section.classList.toggle("is-hidden", !destOk || !visible);
      });
      document.querySelectorAll(".role").forEach((section) => {
        const roleOk = role === "all" || section.dataset.role === role;
        const visible = [...section.querySelectorAll(".card")].some((c) => !c.classList.contains("is-hidden"));
        section.classList.toggle("is-hidden", !roleOk || !visible);
      });
      const any = [...document.querySelectorAll(".card")].some((c) => !c.classList.contains("is-hidden"));
      document.getElementById("no-matches").classList.toggle("show", !any);
    }
    function syncChips() {
      roleBtns.forEach((b) => b.setAttribute("aria-pressed", String((b.getAttribute("data-filter-role") || "all") === role)));
      destBtns.forEach((b) => b.setAttribute("aria-pressed", String((b.getAttribute("data-filter-dest") || "all") === dest)));
    }
    roleBtns.forEach((btn) => btn.addEventListener("click", () => {
      role = btn.getAttribute("data-filter-role") || "all";
      syncChips();
      apply();
    }));
    destBtns.forEach((btn) => btn.addEventListener("click", () => {
      dest = btn.getAttribute("data-filter-dest") || "all";
      syncChips();
      apply();
    }));
    syncChips();
    apply();
  </script>
</body>
</html>
`;
}

export function renderTelegram(digest: DigestOutput, publicUrl?: string): string {
  const date = formatHumanDate(digest.generatedAt);
  const lines: string[] = [
    `<b>Seeker Daily Job Digest</b> — ${date}`,
    `${digest.counts.total} listings for Filipino seekers (EU / Spain / Australia / remote).`,
    '',
  ];

  const byRole = new Map<string, DigestJob[]>();
  for (const job of digest.jobs) {
    const list = byRole.get(job.roleLabel) || [];
    list.push(job);
    byRole.set(job.roleLabel, list);
  }

  for (const [label, jobs] of byRole) {
    const destCounts = jobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.destinationLabel] = (acc[j.destinationLabel] || 0) + 1;
      return acc;
    }, {});
    const dest = Object.entries(destCounts).map(([k, n]) => `${k} ${n}`).join(', ');
    lines.push(`<b>${label}</b> · ${jobs.length}${dest ? ` (${dest})` : ''}`);
    for (const job of jobs.slice(0, 2)) {
      lines.push(`· ${job.title} — ${job.company} (${job.source})`);
    }
  }

  if (publicUrl) {
    lines.push('', `Full digest: ${publicUrl}`);
  }
  lines.push('', 'Heuristic badges only — verify visa rules on official sites.');
  const text = lines.join('\n');
  return text.length > 3900 ? `${text.slice(0, 3890)}\n…` : text;
}
