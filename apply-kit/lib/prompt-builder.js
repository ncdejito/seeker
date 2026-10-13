(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./data.js'));
  } else {
    root.ApplyKitPrompt = factory(root.APPLY_KIT_DATA);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (data) {
  'use strict';

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function roleById(id) {
    return findById(data.roles, id) || data.roles[0];
  }

  function destinationById(id) {
    return findById(data.destinations, id) || data.destinations[0];
  }

  function bullet(lines) {
    return (lines || []).map(function (line) { return '- ' + line; }).join('\n');
  }

  function visaLines(dest) {
    return (dest.visas || []).map(function (v) {
      return '- ' + v.title + ' — ' + v.url + ' (' + v.note + ')';
    }).join('\n');
  }

  function sharedCredentialLines() {
    return (data.sharedCredentials || []).map(function (v) {
      return '- ' + v.title + ' — ' + v.url + ' (' + v.note + ')';
    }).join('\n');
  }

  function fillOrAsk(value, label) {
    var trimmed = String(value || '').trim();
    if (trimmed) return trimmed;
    return '[' + label + ' not provided — ask the candidate for this before inventing content]';
  }

  function buildPrompt(opts) {
    opts = opts || {};
    var role = roleById(opts.role);
    var dest = destinationById(opts.destination);
    var cvText = fillOrAsk(opts.cvText, 'CV text');
    var jobDescription = fillOrAsk(opts.jobDescription, 'job description');
    var flowerNotes = String(opts.flowerNotes || '').trim();
    var missingKeywords = Array.isArray(opts.missingKeywords) ? opts.missingKeywords : [];
    var matchScore = opts.matchScore;

    var flowerBlock = flowerNotes
      ? [
          '',
          '## Aspirational / flower-fit notes (from the candidate)',
          'Score how well this job matches these notes (0–100) and say Apply / Upskill first / Look elsewhere. Do not let a high flower score hide a low technical fit.',
          flowerNotes
        ].join('\n')
      : [
          '',
          '## Aspirational fit',
          data.flowerHint,
          'The candidate did not paste flower notes. Skip a numeric flower score. Still flag obvious mismatches (wrong country, onsite vs remote, seniority) from the JD vs CV.'
        ].join('\n');

    var missingBlock = missingKeywords.length
      ? missingKeywords.slice(0, 25).join(', ')
      : '(keyword checker found none, or no JD yet)';

    var scoreLine = typeof matchScore === 'number'
      ? 'Client-side keyword overlap score (not an LLM): ' + matchScore + '/100. Treat this as a hint, not a hiring decision.'
      : 'No keyword score was provided.';

    return [
      'You are an expert career coach and resume writer helping a Filipino job seeker.',
      'They will paste your output into ChatGPT, Claude, or Gemini — you ARE that assistant. Produce finished drafts they can copy.',
      '',
      '## Non-negotiable rules',
      '- Do not invent employers, dates, tools, certificates, license numbers, language levels, or metrics that are not in the CV. Rephrase and tighten; do not fabricate.',
      '- If a job requirement is missing from the CV, list it under "Ask the candidate" or "Critical gaps". Never "fill it in" to look stronger.',
      '- Keep Philippine credentials internationally readable: PRC license (civil engineer), TESDA National Certificate title (metal press / stamping), 4-year bachelor, English as working language.',
      '- ' + data.verifyDisclaimer,
      '- Link official pages when you mention visas. Do not give legal advice.',
      '',
      '## Candidate',
      '- Target role family: ' + role.label,
      '- Target destination: ' + dest.label + ' (' + dest.cvStyleName + ')',
      '',
      '## Destination CV and cover-letter conventions (' + dest.cvStyleName + ')',
      bullet(dest.conventions),
      '',
      'CV format to follow:',
      dest.cvFormat,
      '',
      'Cover letter to follow:',
      dest.coverLetter,
      '',
      '## Role keyword themes (use only when the CV supports them)',
      role.keywords.join(', '),
      '',
      '## Starter CV bullet guidance for Filipino applicants — ' + role.label,
      bullet(role.tips),
      '',
      '## Client-side keyword check (already run in Apply Kit)',
      scoreLine,
      'JD keywords not found in the current CV: ' + missingBlock,
      '',
      '## Official pages to cite if you mention immigration or credentials',
      visaLines(dest),
      sharedCredentialLines(),
      '',
      '## Task — write these sections in this order',
      '',
      '### 1. Technical fit snapshot (Brutal Job Fit Analyzer)',
      'Adapted from Seeker\'s technical-fit prompt. Return:',
      '- score (0–100)',
      '- strengths (bullets)',
      '- critical_gaps (bullets)',
      '- recommendation: apply | upskill first | skip',
      '- upskill_time (honest: days / weeks / months, or n/a)',
      '- one-paragraph reality check in plain English',
      '',
      '### 2. Resume match note',
      'Adapted from Seeker\'s resume-match prompt. In 3 lines: how well this CV maps to the JD, which experiences to lead with, and what to demote.',
      '',
      '### 3. Tailored CV',
      'Full rewritten CV for this job and destination. Destination format: ' + dest.cvStyleName + '.',
      'Achievement bullets: verb + what you did + result (number if the CV has one). Mirror JD language only where evidence exists.',
      '',
      '### 4. Cover letter',
      'Ready to send. ' + dest.coverLetter,
      '',
      '### 5. Keyword checklist',
      'Table or two lists: keywords now in the tailored CV vs still missing. For each missing keyword: "add if true" or "leave out — not evidenced".',
      '',
      '### 6. Ask the candidate',
      'Questions for facts you still need (metrics, PRC/TESDA numbers, CEFR, notice period, visa status, photo yes/no for EU/Spain).',
      '',
      '### 7. How to send the application',
      '- Suggested file names (no spaces, role + company)',
      '- What to verify on official immigration / credential sites before applying or paying anyone',
      '- Remind them: ' + data.verifyDisclaimer,
      flowerBlock,
      '',
      '---',
      'CANDIDATE CV:',
      cvText,
      '',
      '---',
      'JOB DESCRIPTION:',
      jobDescription,
      ''
    ].join('\n');
  }

  return {
    buildPrompt: buildPrompt,
    roleById: roleById,
    destinationById: destinationById
  };
});
