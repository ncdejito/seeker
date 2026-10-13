(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ApplyKitCsv = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var HEADERS = ['company', 'role', 'link', 'country', 'status', 'date', 'next_step', 'notes'];

  var HEADER_ALIASES = {
    company: 'company',
    role: 'role',
    title: 'role',
    job: 'role',
    link: 'link',
    url: 'link',
    job_url: 'link',
    country: 'country',
    location: 'country',
    destination: 'country',
    status: 'status',
    date: 'date',
    applied: 'date',
    applied_date: 'date',
    next_step: 'next_step',
    nextstep: 'next_step',
    'next step': 'next_step',
    notes: 'notes',
    note: 'notes'
  };

  function escapeField(value) {
    var s = value == null ? '' : String(value);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function serializeCsv(rows) {
    var lines = [HEADERS.join(',')];
    (rows || []).forEach(function (row) {
      lines.push(HEADERS.map(function (key) {
        var value = row[key];
        if (value == null && key === 'next_step') value = row.nextStep;
        return escapeField(value);
      }).join(','));
    });
    return lines.join('\n') + '\n';
  }

  function parseCsv(text) {
    var input = String(text || '');
    if (input.charCodeAt(0) === 0xFEFF) input = input.slice(1);
    var rows = [];
    var row = [];
    var field = '';
    var i = 0;
    var inQuotes = false;
    while (i < input.length) {
      var c = input.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (input.charAt(i + 1) === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i += 1;
          continue;
        }
        field += c;
        i += 1;
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        i += 1;
        continue;
      }
      if (c === ',') {
        row.push(field);
        field = '';
        i += 1;
        continue;
      }
      if (c === '\n' || c === '\r') {
        row.push(field);
        field = '';
        if (row.length > 1 || (row[0] && row[0].trim())) rows.push(row);
        row = [];
        if (c === '\r' && input.charAt(i + 1) === '\n') i += 2;
        else i += 1;
        continue;
      }
      field += c;
      i += 1;
    }
    if (field.length || row.length) {
      row.push(field);
      if (row.length > 1 || (row[0] && row[0].trim())) rows.push(row);
    }
    if (!rows.length) return [];
    var headers = rows[0].map(function (h) {
      var key = String(h || '').trim().toLowerCase().replace(/\s+/g, '_');
      return HEADER_ALIASES[key] || HEADER_ALIASES[String(h || '').trim().toLowerCase()] || key;
    });
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var cells = rows[r];
      if (cells.every(function (cell) { return String(cell || '').trim() === ''; })) continue;
      var obj = {};
      HEADERS.forEach(function (h) { obj[h] = ''; });
      headers.forEach(function (h, idx) {
        if (!h) return;
        obj[h] = cells[idx] != null ? String(cells[idx]) : '';
      });
      out.push(obj);
    }
    return out;
  }

  return {
    HEADERS: HEADERS,
    serializeCsv: serializeCsv,
    parseCsv: parseCsv
  };
});
