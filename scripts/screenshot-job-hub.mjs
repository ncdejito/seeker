/**
 * Render hub screenshots into docs/screenshots/.
 *
 * Prefers Playwright/Chromium when the environment can launch a browser.
 * Falls back to WeasyPrint + pdftoppm (single-process) when Chromium cannot
 * start — common in tight PID cgroups.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { accessSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const hub = require('../site/data.js');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, 'site');
const shots = path.join(root, 'docs', 'screenshots');
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

const ROLE_IDS = hub.roles.map((r) => r.id);
const DEST_IDS = hub.destinations.map((d) => d.id);

function which(bin) {
  const r = spawnSync('which', [bin], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function snapshotHtml(combo, pageHeight) {
  const css = path.join(site, 'styles.css');
  const logo = path.join(site, 'logo.png');
  const links = combo
    ? combo.links
        .map(
          (item) =>
            `<a class="job-link" href="${esc(item.url)}"><span class="name">${esc(item.name)}</span><span class="kw">Keywords: ${esc(item.keywords)}${item.note ? ' — ' + esc(item.note) : ''}</span><span class="go">Open →</span></a>`
        )
        .join('')
    : '';
  const visas = combo
    ? combo.pathway.visaRoutes
        .map(
          (route) =>
            `<article class="route"><h3>${esc(route.name)}</h3><p>${esc(route.summary)}</p><a class="official" href="${esc(route.url)}">Official page</a><span class="verify">Verify on official site</span></article>`
        )
        .join('')
    : '';
  const credLinks = combo
    ? combo.pathway.credentialLinks
        .map((c) => `<a class="official" href="${esc(c.url)}">${esc(c.label)}</a><span class="verify">Verify on official site</span>`)
        .join('<br>')
    : '';
  const caveats = combo && combo.pathway.caveats.length
    ? `<ul class="caveats">${combo.pathway.caveats.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`
    : '';
  const steps = combo
    ? combo.checklist
        .map((step) => `<li><strong>${esc(step.title)}</strong> ${esc(step.body)}</li>`)
        .join('')
    : '';
  const roleBtns = hub.roles
    .map((role) => {
      const on = combo && combo.role.id === role.id;
      return `<button type="button" class="choice" aria-pressed="${on ? 'true' : 'false'}"><span class="label">${esc(role.label)}</span><span class="blurb">${esc(role.blurb)}</span></button>`;
    })
    .join('');
  const destBtns = hub.destinations
    .map((dest) => {
      const on = combo && combo.dest.id === dest.id;
      return `<button type="button" class="choice" aria-pressed="${on ? 'true' : 'false'}"><span class="label">${esc(dest.label)}</span><span class="blurb">${esc(dest.blurb)}</span></button>`;
    })
    .join('');

  const results = combo
    ? `
      <h2 class="kicker">${esc(combo.pathway.heading)}</h2>
      <p class="subkicker">${combo.links.length} search links · pathway card · 7-step checklist.</p>
      <section class="panel"><h2>Search these boards</h2><div class="links">${links}</div></section>
      <section class="panel pathway">
        <h2>Pathway card</h2>
        <p class="hint">${esc(combo.verify)}</p>
        <h3>Visa / work routes</h3>${visas}
        <h3>Credentials and recognition</h3><p>${esc(combo.pathway.credentials)}</p>${credLinks}${caveats}
        <div class="dmw-box">
          <h3>DMW / former POEA</h3>
          <p>${esc(combo.pathway.dmw.summary)}</p>
          <p>${esc(combo.pathway.dmwExtra)}</p>
          <p>${esc(combo.pathway.dmw.warning)}</p>
        </div>
      </section>
      <section class="panel checklist"><h2>7-step checklist</h2><ol>${steps}</ol></section>`
    : `<p class="hint">Choose a role and a destination to see boards, the pathway card, and the checklist.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${combo ? esc(combo.pathway.heading) : 'Seeker PH Job Hub'}</title>
  <link rel="stylesheet" href="${esc(css)}">
  <style>
    body { background: #f4efe4; }
    @page { size: 900px ${pageHeight || 4200}px; margin: 24px; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <img class="mark" src="${esc(logo)}" width="72" height="72" alt="">
      <div>
        <p class="eyebrow">Seeker · MVP option A</p>
        <h1>PH Job Hub</h1>
        <p class="lede">A shareable starting kit for Filipino job seekers targeting the EU, Spain, Australia, and remote work.</p>
        <p class="tagalog">Walang setup. Piliin ang role at destination, tapos i-share ang link.</p>
      </div>
    </header>
    <aside class="banner"><strong>Anti-illegal recruiter.</strong> Verify agencies on the DMW licensed list. Never pay a “guaranteed visa”.</aside>
    <section class="panel"><h2>1. Your role</h2><div class="choices roles">${roleBtns}</div></section>
    <section class="panel"><h2>2. Destination</h2><div class="choices dests">${destBtns}</div></section>
    ${results}
  </div>
</body>
</html>`;
}

function rasterize(htmlPath, pngPath) {
  const pdfPath = htmlPath.replace(/\.html$/, '.pdf');
  const wp = spawnSync('weasyprint', [htmlPath, pdfPath], { encoding: 'utf8' });
  if (wp.status !== 0) {
    throw new Error('weasyprint failed: ' + (wp.stderr || wp.stdout));
  }
  const ppm = spawnSync('pdftoppm', ['-png', '-singlefile', '-r', '120', pdfPath, pngPath.replace(/\.png$/, '')], {
    encoding: 'utf8',
  });
  if (ppm.status !== 0) {
    throw new Error('pdftoppm failed: ' + (ppm.stderr || ppm.stdout));
  }
}

function startServer() {
  return spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
    cwd: site,
    stdio: 'ignore',
  });
}

async function tryPlaywright() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    return false;
  }
  const home = process.env.HOME || '';
  const candidates = [
    process.env.CHROMIUM_PATH,
    path.join(home, '.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell'),
    '/usr/bin/chromium',
  ].filter(Boolean);
  let executablePath = null;
  for (const file of candidates) {
    try {
      accessSync(file);
      executablePath = file;
      break;
    } catch {
      // next
    }
  }
  if (!executablePath) return false;

  const server = startServer();
  let browser;
  try {
    await new Promise((r) => setTimeout(r, 400));
    browser = await Promise.race([
      chromium.launch({
        executablePath,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('launch timeout')), 8000)),
    ]);
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForSelector('#roles .choice', { timeout: 8000 });
    await page.screenshot({ path: path.join(shots, 'hub-home.png'), fullPage: true });

    async function openCombo(role, dest) {
      await page.goto(`${BASE}/#role=${role}&dest=${dest}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
      await page.waitForSelector('#results:not([hidden])', { timeout: 8000 });
      const count = await page.locator('#job-links a.job-link').count();
      if (count < 3) throw new Error(`${role} × ${dest} rendered ${count} links`);
      return count;
    }
    for (const role of ROLE_IDS) {
      for (const dest of DEST_IDS) {
        await openCombo(role, dest);
      }
    }
    await openCombo('data-engineer', 'spain');
    await page.screenshot({ path: path.join(shots, 'hub-data-engineer-spain.png'), fullPage: true });
    await openCombo('civil-engineer', 'australia');
    await page.screenshot({ path: path.join(shots, 'hub-civil-engineer-australia.png'), fullPage: true });
    await openCombo('metal-press-technician', 'eu');
    await page.screenshot({ path: path.join(shots, 'hub-metal-press-technician-eu.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await openCombo('full-stack-engineer', 'remote');
    await page.screenshot({ path: path.join(shots, 'hub-mobile-full-stack-remote.png'), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${BASE}/flower-exercise.html`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.screenshot({ path: path.join(shots, 'hub-flower-exercise.png'), fullPage: true });
    return true;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill('SIGTERM');
  }
}

function pidHeadroom() {
  try {
    const max = Number(require('node:fs').readFileSync('/sys/fs/cgroup/pids.max', 'utf8'));
    const cur = Number(require('node:fs').readFileSync('/sys/fs/cgroup/pids.current', 'utf8'));
    if (!Number.isFinite(max) || !Number.isFinite(cur) || max <= 0) return Infinity;
    return max - cur;
  } catch {
    return Infinity;
  }
}

await mkdir(shots, { recursive: true });

let usedBrowser = false;
const skipBrowser = process.env.SKIP_PLAYWRIGHT === '1' || pidHeadroom() < 80;
if (!skipBrowser) {
  try {
    usedBrowser = await tryPlaywright();
  } catch (err) {
    console.warn('Playwright/Chromium unavailable (' + err.message + '); using WeasyPrint fallback.');
  }
} else {
  console.warn('Skipping Playwright (PID headroom ' + pidHeadroom() + ' or SKIP_PLAYWRIGHT=1).');
}

if (!usedBrowser) {
  if (!which('weasyprint') || !which('pdftoppm')) {
    throw new Error('Need Playwright/Chromium or weasyprint+pdftoppm to write screenshots');
  }
  const tmp = path.join(os.tmpdir(), 'seeker-hub-shots');
  await mkdir(tmp, { recursive: true });

  const jobs = [
    ['hub-home.png', null, 1500],
    ['hub-data-engineer-spain.png', hub.getCombo('data-engineer', 'spain'), 4200],
    ['hub-civil-engineer-australia.png', hub.getCombo('civil-engineer', 'australia'), 4400],
    ['hub-metal-press-technician-eu.png', hub.getCombo('metal-press-technician', 'eu'), 4400],
    ['hub-mobile-full-stack-remote.png', hub.getCombo('full-stack-engineer', 'remote'), 4000],
  ];

  for (const [name, combo, height] of jobs) {
    const htmlPath = path.join(tmp, name.replace('.png', '.html'));
    await writeFile(htmlPath, snapshotHtml(combo, height));
    rasterize(htmlPath, path.join(shots, name));
  }

  const flowerSrc = path.join(site, 'flower-exercise.html');
  const flowerPdf = path.join(tmp, 'flower.pdf');
  const wp = spawnSync('weasyprint', [flowerSrc, flowerPdf, '-u', site + '/'], { encoding: 'utf8' });
  if (wp.status !== 0) throw new Error('weasyprint flower failed: ' + (wp.stderr || wp.stdout));
  spawnSync('pdftoppm', ['-png', '-singlefile', '-r', '120', flowerPdf, path.join(shots, 'hub-flower-exercise').replace(/\.png$/, '')], {
    encoding: 'utf8',
  });
  await unlink(flowerPdf).catch(() => {});
}

let checked = 0;
for (const role of ROLE_IDS) {
  for (const dest of DEST_IDS) {
    const combo = hub.getCombo(role, dest);
    if (!combo || combo.links.length < 3 || !combo.pathway.heading) {
      throw new Error(`combo failed ${role} × ${dest}`);
    }
    checked += 1;
  }
}
if (checked !== 20) throw new Error(`checked ${checked} combos`);

console.log(
  usedBrowser
    ? 'screenshots: Playwright captured live page (20 combos checked in-browser)'
    : 'screenshots: WeasyPrint fallback (20 combos checked via data.js); Chromium PID cgroup was too tight'
);
console.log('files in docs/screenshots/');
