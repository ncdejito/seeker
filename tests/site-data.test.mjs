/**
 * Completeness checks for site/data.js.
 * Run with: node tests/site-data.test.mjs
 * Also picked up by vitest (npm test) when VITEST is set.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const hub = require('../site/data.js');

const ROLE_IDS = [
  'data-engineer',
  'product-manager',
  'full-stack-engineer',
  'civil-engineer',
  'metal-press-technician',
];
const DEST_IDS = ['eu', 'spain', 'australia', 'remote'];

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function assertComplete() {
  assert.ok(hub, 'SEEKER_HUB / module.exports missing');
  assert.equal(hub.roles.length, 5, 'expected 5 roles');
  assert.equal(hub.destinations.length, 4, 'expected 4 destinations');
  assert.deepEqual(hub.roles.map((r) => r.id), ROLE_IDS);
  assert.deepEqual(hub.destinations.map((d) => d.id), DEST_IDS);

  assert.ok(Array.isArray(hub.checklist) && hub.checklist.length === 7, 'checklist must have 7 steps');
  for (const step of hub.checklist) {
    assert.ok(step.title && step.body, 'checklist step needs title and body');
  }

  assert.ok(hub.flowerExercise.localHtml, 'flower exercise html path');
  assert.ok(hub.flowerExercise.github.startsWith('https://'), 'flower exercise github url');
  assert.ok(hub.dmw.links.length >= 2, 'DMW links');
  for (const l of hub.dmw.links) {
    assert.ok(isHttpUrl(l.url), `DMW url ${l.url}`);
  }

  let combos = 0;
  for (const roleId of ROLE_IDS) {
    for (const destId of DEST_IDS) {
      combos += 1;
      const combo = hub.getCombo(roleId, destId);
      assert.ok(combo, `missing combo ${roleId} × ${destId}`);
      assert.ok(combo.links.length >= 3, `${roleId} × ${destId} needs ≥3 links, got ${combo.links.length}`);
      const names = new Set();
      for (const link of combo.links) {
        assert.ok(link.name, `${roleId} × ${destId} link missing name`);
        assert.ok(isHttpUrl(link.url), `${roleId} × ${destId} bad url: ${link.url}`);
        assert.ok(link.keywords && String(link.keywords).trim().length > 0, `${roleId} × ${destId} ${link.name} missing keywords`);
        names.add(link.name + link.url);
      }
      assert.equal(names.size, combo.links.length, `${roleId} × ${destId} duplicate links`);

      const path = combo.pathway;
      assert.ok(path.heading, `${roleId} × ${destId} pathway heading`);
      assert.ok(path.visaRoutes.length >= 1, `${roleId} × ${destId} visa routes`);
      for (const route of path.visaRoutes) {
        assert.ok(route.name && route.summary, `${roleId} × ${destId} visa route incomplete`);
        assert.ok(isHttpUrl(route.url), `${roleId} × ${destId} visa url ${route.url}`);
      }
      assert.ok(path.credentials && path.credentials.length > 40, `${roleId} × ${destId} credentials note`);
      assert.ok(path.credentialLinks.length >= 1, `${roleId} × ${destId} credential links`);
      for (const c of path.credentialLinks) {
        assert.ok(isHttpUrl(c.url), `${roleId} × ${destId} credential url ${c.url}`);
      }
      assert.ok(path.dmw && path.dmw.warning, `${roleId} × ${destId} DMW warning`);
      assert.match(path.dmw.warning, /illegal|DMW|passport/i);
    }
  }
  assert.equal(combos, 20, 'expected 20 role × destination combos');
}

if (process.env.VITEST) {
  const { describe, it } = await import('vitest');
  describe('site data completeness', () => {
    it('covers all 20 role × destination combos with links and pathway cards', () => {
      assertComplete();
    });
  });
} else {
  assertComplete();
  console.log('site-data: 20 combos, ≥3 links each, pathway + DMW notes OK');
}
