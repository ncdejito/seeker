(function () {
  'use strict';

  var data = window.APPLY_KIT_DATA;
  var keywords = window.ApplyKitKeywords;
  var promptApi = window.ApplyKitPrompt;
  var csvApi = window.ApplyKitCsv;

  var KEYS = {
    profile: 'seeker.applyKit.v1.profile',
    apps: 'seeker.applyKit.v1.applications',
    jd: 'seeker.applyKit.v1.jobDescription',
    prompt: 'seeker.applyKit.v1.prompt',
    score: 'seeker.applyKit.v1.score'
  };

  var lastScore = null;
  var lastPrompt = '';

  function $(id) { return document.getElementById(id); }

  function toast(id, message) {
    var el = $(id);
    if (el) el.textContent = message || '';
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function fillSelect(el, items, getValue, getLabel) {
    el.innerHTML = items.map(function (item) {
      return '<option value="' + escapeHtml(getValue(item)) + '">' + escapeHtml(getLabel(item)) + '</option>';
    }).join('');
  }

  function readProfileFromForm() {
    return {
      role: $('role').value,
      destination: $('destination').value,
      cvText: $('cv-text').value,
      flowerNotes: $('flower-notes').value
    };
  }

  function writeProfileToForm(profile) {
    if (!profile) return;
    if (profile.role) $('role').value = profile.role;
    if (profile.destination) $('destination').value = profile.destination;
    $('cv-text').value = profile.cvText || '';
    $('flower-notes').value = profile.flowerNotes || '';
  }

  function currentRole() {
    return promptApi.roleById($('role').value);
  }

  function currentDest() {
    return promptApi.destinationById($('destination').value);
  }

  function renderTipsAndVisas() {
    var role = currentRole();
    var dest = currentDest();
    $('tips-title').textContent = 'CV bullet tips — ' + role.label;
    $('tips-lede').textContent = 'How Filipino applicants often present this work for ' + dest.label + ' (' + dest.cvStyleName + ').';
    $('tips-list').innerHTML = role.tips.map(function (t) {
      return '<li>' + escapeHtml(t) + '</li>';
    }).join('');
    $('visa-lede').textContent = dest.label + ' · ' + data.verifyDisclaimer;
    function visaItem(v) {
      return '<li><a href="' + escapeHtml(v.url) + '" target="_blank" rel="noopener noreferrer">' +
        escapeHtml(v.title) + '</a><p class="note">' + escapeHtml(v.note) + ' Verify on official site.</p></li>';
    }
    $('visa-list').innerHTML = dest.visas.map(visaItem).join('');
    $('shared-visa-list').innerHTML = data.sharedCredentials.map(visaItem).join('');
  }

  function loadApps() {
    var apps = loadJson(KEYS.apps, []);
    return Array.isArray(apps) ? apps : [];
  }

  function saveApps(apps) {
    saveJson(KEYS.apps, apps);
    renderTracker();
    renderProgress();
  }

  function statusLabel(id) {
    var found = data.statuses.filter(function (s) { return s.id === id; })[0];
    return found ? found.label : id;
  }

  function renderProgress() {
    var apps = loadApps();
    var counts = { total: apps.length, saved: 0, applied: 0, interview: 0, offer: 0, rejected: 0, withdrawn: 0 };
    var weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    var thisWeek = 0;
    apps.forEach(function (a) {
      if (counts[a.status] != null) counts[a.status] += 1;
      if (a.date && new Date(a.date).getTime() >= weekAgo) thisWeek += 1;
    });
    $('progress').innerHTML = [
      chip('Jobs tracked', counts.total),
      chip('Applied', counts.applied, 'applied'),
      chip('Interviews', counts.interview, 'interview'),
      chip('Offers', counts.offer, 'offer'),
      chip('This week (by date)', thisWeek)
    ].join('');
  }

  function chip(label, n, cls) {
    return '<div class="chip ' + (cls || '') + '"><strong>' + n + '</strong> ' + escapeHtml(label) + '</div>';
  }

  function renderTracker() {
    var apps = loadApps();
    var body = $('tracker-body');
    if (!apps.length) {
      body.innerHTML = '<tr><td class="empty" colspan="9">No applications yet. Add one above, or import a CSV from a helper.</td></tr>';
      return;
    }
    body.innerHTML = apps.map(function (a) {
      var link = a.link
        ? '<a href="' + escapeHtml(a.link) + '" target="_blank" rel="noopener noreferrer">Open</a>'
        : '—';
      return '<tr>' +
        td(a.company, 'Company') +
        td(a.role, 'Role') +
        '<td data-label="Link">' + link + '</td>' +
        td(a.country, 'Country') +
        '<td data-label="Status"><span class="status ' + escapeHtml(a.status || '') + '">' + escapeHtml(statusLabel(a.status)) + '</span></td>' +
        td(a.date, 'Date') +
        td(a.next_step, 'Next step') +
        td(a.notes, 'Notes') +
        '<td data-label="Actions" class="tracker-actions">' +
          '<button type="button" class="secondary" data-edit="' + escapeHtml(a.id) + '">Edit</button> ' +
          '<button type="button" class="danger" data-del="' + escapeHtml(a.id) + '">Delete</button>' +
        '</td></tr>';
    }).join('');
  }

  function td(value, label) {
    var text = value ? escapeHtml(value) : '—';
    return '<td data-label="' + escapeHtml(label) + '">' + text + '</td>';
  }

  function resetAppForm() {
    $('app-form').reset();
    $('app-id').value = '';
    $('app-date').value = todayISO();
    $('app-status').value = 'saved';
    $('app-save-btn').textContent = 'Add to tracker';
  }

  function fillAppForm(app) {
    $('app-id').value = app.id || '';
    $('app-company').value = app.company || '';
    $('app-role').value = app.role || '';
    $('app-link').value = app.link || '';
    $('app-country').value = app.country || '';
    $('app-status').value = app.status || 'saved';
    $('app-date').value = app.date || todayISO();
    $('app-next').value = app.next_step || '';
    $('app-notes').value = app.notes || '';
    $('app-save-btn').textContent = app.id ? 'Save changes' : 'Add to tracker';
  }

  function readAppForm() {
    return {
      id: $('app-id').value || uid(),
      company: $('app-company').value.trim(),
      role: $('app-role').value.trim(),
      link: $('app-link').value.trim(),
      country: $('app-country').value.trim(),
      status: $('app-status').value,
      date: $('app-date').value,
      next_step: $('app-next').value.trim(),
      notes: $('app-notes').value.trim()
    };
  }

  function guessCompany(jd) {
    var m = String(jd || '').match(/company:\s*(.+)/i);
    if (m) return m[1].split('\n')[0].trim();
    return '';
  }

  function guessRoleTitle(jd) {
    var first = String(jd || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean)[0] || '';
    return first.replace(/\s+—\s+.*/, '').slice(0, 80);
  }

  function scoreNow() {
    var cv = $('cv-text').value;
    var jd = $('job-description').value;
    if (!jd.trim()) {
      toast('tailor-toast', 'Paste a job description first.');
      return null;
    }
    lastScore = keywords.scoreMatch(cv, jd);
    renderScore(lastScore);
    saveJson(KEYS.score, lastScore);
    toast('tailor-toast', 'Keyword score updated.');
    return lastScore;
  }

  function renderScore(result) {
    if (!result) return;
    lastScore = result;
    $('score-box').hidden = false;
    $('score-num').innerHTML = result.score + '<span>match</span>';
    $('score-caption').textContent = result.total
      ? result.matched.length + ' of ' + result.total + ' job keywords found in your CV. This is a word overlap check, not an AI judgment.'
      : 'Could not pick keywords from that job ad. Try pasting the requirements section.';
    $('matched-pills').innerHTML = result.matched.length
      ? result.matched.map(function (k) { return '<span class="pill ok">' + escapeHtml(k) + '</span>'; }).join('')
      : '<span class="tiny">None yet</span>';
    $('missing-pills').innerHTML = result.missing.length
      ? result.missing.map(function (k) { return '<span class="pill miss">' + escapeHtml(k) + '</span>'; }).join('')
      : '<span class="tiny">None</span>';
  }

  function buildPromptNow() {
    var profile = readProfileFromForm();
    var jd = $('job-description').value;
    if (!profile.cvText.trim() || !jd.trim()) {
      toast('tailor-toast', 'Paste both your CV (profile) and a job description.');
      return;
    }
    var score = lastScore || keywords.scoreMatch(profile.cvText, jd);
    lastScore = score;
    lastPrompt = promptApi.buildPrompt({
      role: profile.role,
      destination: profile.destination,
      cvText: profile.cvText,
      flowerNotes: profile.flowerNotes,
      jobDescription: jd,
      missingKeywords: score.missing,
      matchScore: score.score
    });
    $('prompt-box').hidden = false;
    $('prompt-box').textContent = lastPrompt;
    localStorage.setItem(KEYS.prompt, lastPrompt);
    scoreNow();
    toast('tailor-toast', 'Prompt ready. Copy it into ChatGPT, Claude, or Gemini.');
  }

  function copyPrompt() {
    if (!lastPrompt) buildPromptNow();
    if (!lastPrompt) return;
    function ok() { toast('tailor-toast', 'Prompt copied. Paste it into ChatGPT, Claude, or Gemini.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastPrompt).then(ok).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      var box = $('prompt-box');
      box.hidden = false;
      var range = document.createRange();
      range.selectNodeContents(box);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      try { document.execCommand('copy'); ok(); } catch (e) {
        toast('tailor-toast', 'Select the prompt text and copy it (Ctrl+C or Cmd+C).');
      }
    }
  }

  function exportCsv() {
    var blob = new Blob([csvApi.serializeCsv(loadApps())], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'apply-kit-tracker.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('tracker-toast', 'CSV downloaded. Send it to a helper, or keep it as a backup.');
  }

  function importCsvFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var rows = csvApi.parseCsv(String(reader.result || ''));
      if (!rows.length) {
        toast('tracker-toast', 'That CSV had no data rows.');
        return;
      }
      var apps = loadApps();
      var existing = {};
      apps.forEach(function (a) {
        existing[(a.company + '|' + a.role + '|' + a.link).toLowerCase()] = true;
      });
      var added = 0;
      rows.forEach(function (row) {
        var key = (row.company + '|' + row.role + '|' + row.link).toLowerCase();
        if (!row.company && !row.role) return;
        if (existing[key]) return;
        existing[key] = true;
        apps.push({
          id: uid(),
          company: row.company || '',
          role: row.role || '',
          link: row.link || '',
          country: row.country || '',
          status: row.status || 'saved',
          date: row.date || todayISO(),
          next_step: row.next_step || '',
          notes: row.notes || ''
        });
        added += 1;
      });
      saveApps(apps);
      toast('tracker-toast', 'Imported ' + added + ' new row(s). Existing rows were kept.');
    };
    reader.readAsText(file);
  }

  function init() {
    fillSelect($('role'), data.roles, function (r) { return r.id; }, function (r) { return r.label; });
    fillSelect($('destination'), data.destinations, function (d) { return d.id; }, function (d) { return d.label; });
    fillSelect($('app-status'), data.statuses, function (s) { return s.id; }, function (s) { return s.label; });
    writeProfileToForm(loadJson(KEYS.profile, { role: 'data-engineer', destination: 'eu' }));
    $('job-description').value = localStorage.getItem(KEYS.jd) || '';
    $('app-date').value = todayISO();
    lastPrompt = localStorage.getItem(KEYS.prompt) || '';
    if (lastPrompt) {
      $('prompt-box').hidden = false;
      $('prompt-box').textContent = lastPrompt;
    }
    var savedScore = loadJson(KEYS.score, null);
    if (savedScore && typeof savedScore.score === 'number') renderScore(savedScore);
    renderTipsAndVisas();
    renderTracker();
    renderProgress();

    $('profile-form').addEventListener('submit', function (e) {
      e.preventDefault();
      saveJson(KEYS.profile, readProfileFromForm());
      toast('profile-toast', 'Profile saved on this device.');
    });

    $('role').addEventListener('change', function () {
      saveJson(KEYS.profile, readProfileFromForm());
      renderTipsAndVisas();
    });
    $('destination').addEventListener('change', function () {
      saveJson(KEYS.profile, readProfileFromForm());
      renderTipsAndVisas();
    });
    $('cv-text').addEventListener('change', function () {
      saveJson(KEYS.profile, readProfileFromForm());
    });
    $('flower-notes').addEventListener('change', function () {
      saveJson(KEYS.profile, readProfileFromForm());
    });
    $('job-description').addEventListener('change', function () {
      localStorage.setItem(KEYS.jd, $('job-description').value);
    });

    $('score-btn').addEventListener('click', scoreNow);
    $('build-prompt-btn').addEventListener('click', buildPromptNow);
    $('copy-prompt-btn').addEventListener('click', copyPrompt);

    $('add-from-jd-btn').addEventListener('click', function () {
      var jd = $('job-description').value;
      if (!jd.trim()) {
        toast('tailor-toast', 'Paste a job description first.');
        return;
      }
      fillAppForm({
        company: guessCompany(jd),
        role: guessRoleTitle(jd) || currentRole().label,
        country: currentDest().shortLabel,
        status: 'saved',
        date: todayISO(),
        notes: 'Added from pasted job ad'
      });
      $('tracker').scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast('tailor-toast', 'Check the tracker form and save the row.');
    });

    $('app-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var row = readAppForm();
      if (!row.company || !row.role) {
        toast('tracker-toast', 'Company and role are required.');
        return;
      }
      var apps = loadApps();
      var idx = -1;
      for (var i = 0; i < apps.length; i++) {
        if (apps[i].id === row.id) { idx = i; break; }
      }
      if (idx >= 0) apps[idx] = row;
      else apps.unshift(row);
      saveApps(apps);
      resetAppForm();
      toast('tracker-toast', 'Tracker saved. Reload the page — the row will still be here.');
    });

    $('app-reset-btn').addEventListener('click', resetAppForm);

    $('tracker-body').addEventListener('click', function (e) {
      var editId = e.target.getAttribute('data-edit');
      var delId = e.target.getAttribute('data-del');
      if (editId) {
        var app = loadApps().filter(function (a) { return a.id === editId; })[0];
        if (app) {
          fillAppForm(app);
          $('app-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      if (delId) {
        if (!window.confirm('Delete this application row?')) return;
        saveApps(loadApps().filter(function (a) { return a.id !== delId; }));
        toast('tracker-toast', 'Row deleted.');
      }
    });

    $('export-csv-btn').addEventListener('click', exportCsv);
    $('import-csv').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) importCsvFile(file);
      e.target.value = '';
    });

    $('load-sample').addEventListener('click', function () {
      var s = data.samples;
      writeProfileToForm({
        role: s.role,
        destination: s.destination,
        cvText: s.cvText,
        flowerNotes: 'Want hybrid EU data work, not night-shift BPO. Salary floor competitive for Lisbon. Prefer teams that write things down.'
      });
      saveJson(KEYS.profile, readProfileFromForm());
      $('job-description').value = s.jobDescription;
      localStorage.setItem(KEYS.jd, s.jobDescription);
      renderTipsAndVisas();
      lastScore = null;
      scoreNow();
      buildPromptNow();
      toast('profile-toast', 'Sample loaded. Scroll to Tailor this job, then copy the prompt.');
    });

    $('clear-data').addEventListener('click', function () {
      if (!window.confirm('Clear profile, job ad, and tracker saved in this browser?')) return;
      localStorage.removeItem(KEYS.profile);
      localStorage.removeItem(KEYS.apps);
      localStorage.removeItem(KEYS.jd);
      localStorage.removeItem(KEYS.prompt);
      localStorage.removeItem(KEYS.score);
      lastPrompt = '';
      lastScore = null;
      $('cv-text').value = '';
      $('flower-notes').value = '';
      $('job-description').value = '';
      $('prompt-box').hidden = true;
      $('prompt-box').textContent = '';
      $('score-box').hidden = true;
      $('role').value = 'data-engineer';
      $('destination').value = 'eu';
      resetAppForm();
      renderTipsAndVisas();
      renderTracker();
      renderProgress();
      toast('profile-toast', 'Cleared.');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
