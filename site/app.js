(function () {
  var hub = window.SEEKER_HUB;
  if (!hub) {
    document.body.innerHTML = '<p>Could not load site/data.js</p>';
    return;
  }

  var state = { role: null, dest: null };

  function $(id) {
    return document.getElementById(id);
  }

  function parseHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    var params = new URLSearchParams(raw);
    var role = params.get('role');
    var dest = params.get('dest');
    if (hub.getRole(role)) state.role = role;
    if (hub.getDest(dest)) state.dest = dest;
  }

  function writeHash() {
    var params = new URLSearchParams();
    if (state.role) params.set('role', state.role);
    if (state.dest) params.set('dest', state.dest);
    var next = params.toString();
    var hash = next ? '#' + next : '';
    if (location.hash !== hash) {
      history.replaceState(null, '', hash || location.pathname + location.search);
    }
    return hash;
  }

  function setPressed(container, id) {
    var buttons = container.querySelectorAll('.choice');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].dataset.id === id ? 'true' : 'false');
    }
  }

  function renderChoices() {
    var roleBox = $('roles');
    var destBox = $('dests');
    roleBox.innerHTML = '';
    destBox.innerHTML = '';

    hub.roles.forEach(function (role) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.id = role.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<span class="label">' + escapeHtml(role.label) + '</span><span class="blurb">' + escapeHtml(role.blurb) + '</span>';
      btn.addEventListener('click', function () {
        state.role = role.id;
        writeHash();
        paint();
      });
      roleBox.appendChild(btn);
    });

    hub.destinations.forEach(function (dest) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.dataset.id = dest.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = '<span class="label">' + escapeHtml(dest.label) + '</span><span class="blurb">' + escapeHtml(dest.blurb) + '</span>';
      btn.addEventListener('click', function () {
        state.dest = dest.id;
        writeHash();
        paint();
      });
      destBox.appendChild(btn);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function officialAnchor(url, label) {
    return (
      '<a class="official" href="' +
      escapeHtml(url) +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(label) +
      '</a><span class="verify">Verify on official site</span>'
    );
  }

  function renderResults() {
    var combo = hub.getCombo(state.role, state.dest);
    var results = $('results');
    var empty = $('empty');
    var hashEl = $('share-hash');

    setPressed($('roles'), state.role);
    setPressed($('dests'), state.dest);

    var hash = writeHash();
    hashEl.textContent = hash || '#role=…&dest=…';

    if (!combo) {
      results.hidden = true;
      empty.hidden = false;
      document.title = hub.title;
      return;
    }

    empty.hidden = true;
    results.hidden = false;
    document.title = combo.role.label + ' → ' + combo.dest.label + ' · ' + hub.title;

    $('result-kicker').textContent = combo.pathway.heading;
    $('result-sub').textContent =
      combo.links.length + ' search links · pathway card · 7-step checklist. Share this URL so the same combo opens.';

    var list = $('job-links');
    list.innerHTML = '';
    combo.links.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'job-link';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML =
        '<span class="name">' +
        escapeHtml(item.name) +
        '</span><span class="kw">Keywords: ' +
        escapeHtml(item.keywords) +
        (item.note ? ' — ' + escapeHtml(item.note) : '') +
        '</span><span class="go">Open →</span>';
      list.appendChild(a);
    });

    var visa = $('visa-routes');
    visa.innerHTML = combo.pathway.visaRoutes
      .map(function (route) {
        return (
          '<article class="route"><h3>' +
          escapeHtml(route.name) +
          '</h3><p>' +
          escapeHtml(route.summary) +
          '</p>' +
          officialAnchor(route.url, 'Official page') +
          '</article>'
        );
      })
      .join('');

    $('credentials').innerHTML =
      '<p>' +
      escapeHtml(combo.pathway.credentials) +
      '</p>' +
      combo.pathway.credentialLinks
        .map(function (c) {
          return officialAnchor(c.url, c.label);
        })
        .join('<br>');

    var caveats = $('caveats');
    if (combo.pathway.caveats.length) {
      caveats.hidden = false;
      caveats.innerHTML = combo.pathway.caveats.map(function (c) {
        return '<li>' + escapeHtml(c) + '</li>';
      }).join('');
    } else {
      caveats.hidden = true;
      caveats.innerHTML = '';
    }

    $('dmw-summary').textContent = combo.pathway.dmw.summary;
    $('dmw-extra').textContent = combo.pathway.dmwExtra;
    $('dmw-warning').textContent = combo.pathway.dmw.warning;
    var dmwLinks = $('dmw-links');
    dmwLinks.innerHTML = combo.pathway.dmw.links
      .map(function (c) {
        return officialAnchor(c.url, c.label);
      })
      .join('<br>');

    var ol = $('checklist');
    ol.innerHTML = combo.checklist
      .map(function (step, i) {
        var extra = '';
        if (i === 0) {
          extra =
            ' <a href="' +
            escapeHtml(combo.flowerExercise.localHtml) +
            '">Open the flower exercise</a> · <a href="' +
            escapeHtml(combo.flowerExercise.github) +
            '" target="_blank" rel="noopener noreferrer">GitHub copy</a>';
        }
        return '<li><strong>' + escapeHtml(step.title) + '</strong> ' + escapeHtml(step.body) + extra + '</li>';
      })
      .join('');

    $('verify-line').textContent = combo.verify;
    results.dataset.role = combo.role.id;
    results.dataset.dest = combo.dest.id;
    results.dataset.ready = 'true';
  }

  function paint() {
    renderResults();
  }

  $('copy-link').addEventListener('click', function () {
    writeHash();
    var url = location.href;
    var status = $('copy-status');
    function done(ok) {
      status.textContent = ok ? 'Copied. Paste it in Messenger or WhatsApp.' : 'Copy failed — select the hash and copy manually.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { done(true); }).catch(function () { done(false); });
    } else {
      done(false);
    }
  });

  window.addEventListener('hashchange', function () {
    parseHash();
    paint();
  });

  renderChoices();
  parseHash();
  paint();
})();
