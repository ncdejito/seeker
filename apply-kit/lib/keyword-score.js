(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ApplyKitKeywords = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STOPWORDS = {};
  [
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'by',
    'for', 'in', 'of', 'on', 'to', 'up', 'with', 'from', 'as', 'into', 'over',
    'after', 'before', 'between', 'out', 'off', 'via', 'per', 'than', 'too',
    'very', 'can', 'will', 'just', 'about', 'above', 'below', 'into', 'again',
    'further', 'once', 'here', 'there', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'also', 'than', 'too', 'very', 's', 't', 'don', 'should', 'now',
    'we', 'you', 'your', 'ours', 'our', 'us', 'they', 'their', 'them', 'it', 'its',
    'this', 'that', 'these', 'those', 'i', 'me', 'my', 'he', 'she', 'his', 'her',
    'who', 'whom', 'which', 'what', 'how', 'why', 'where', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
    'did', 'doing', 'would', 'could', 'should', 'may', 'might', 'must', 'need',
    'job', 'role', 'position', 'opening', 'opportunity', 'opportunities',
    'company', 'team', 'teams', 'work', 'working', 'worker', 'workers',
    'experience', 'experienced', 'year', 'years', 'including', 'include',
    'includes', 'ability', 'able', 'skills', 'skill', 'required', 'requirement',
    'requirements', 'preferred', 'preference', 'responsibilities',
    'responsibility', 'qualifications', 'qualification', 'duties', 'duty',
    'about', 'who', 'what', 'looking', 'join', 'plus', 'using', 'used', 'use',
    'across', 'within', 'well', 'good', 'strong', 'highly', 'please', 'apply',
    'application', 'candidate', 'candidates', 'ideal', 'successful',
    'environment', 'based', 'new', 'one', 'two', 'three', 'etc', 'eg', 'ie',
    'andor', 'and/or', 'full', 'time', 'part', 'contract', 'permanent',
    'salary', 'benefits', 'offer', 'offering', 'bonus', 'day', 'days',
    'week', 'weeks', 'must', 'minimum', 'least', 'etc', 'among', 'along',
    'like', 'make', 'made', 'ensure', 'ensuring', 'help', 'helps', 'helping',
    'drive', 'driving', 'deliver', 'delivery', 'support', 'supporting',
    'understand', 'understanding', 'knowledge', 'familiar', 'familiarity',
    'comfort', 'comfortable', 'passion', 'passionate', 'excited', 'love',
    'great', 'best', 'world', 'class', 'people', 'person', 'someone',
    'everyone', 'every', 'other', 'others', 'etc', 'perks', 'life',
    'description', 'title', 'location', 'hybrid', 'onsite', 'office',
    'report', 'reports', 'reporting', 'closely', 'together', 'future',
    'today', 'currently', 'please', 'click', 'visit', 'website', 'equal',
    'employer', 'diversity', 'inclusive', 'inclusion', 'status', 'gender',
    'race', 'religion', 'disability', 'veteran', 'law', 'laws',
    'right', 'rights', 'authorized', 'authorised', 'sponsorship'
  ].forEach(function (w) { STOPWORDS[w] = true; });

  var GENERIC = {};
  [
    'data', 'engineer', 'engineering', 'building', 'production', 'documentation',
    'english', 'portuguese', 'spanish', 'lisbon', 'madrid', 'sydney', 'melbourne',
    'manila', 'company', 'hiring', 'write', 'model', 'jobs', 'plus', 'hybrid',
    'office', 'days', 'sponsor', 'eligible', 'short', 'letter', 'cover', 'apply',
    'application', 'cv', 'resume', 'authorisation', 'authorization', 'work',
    'role', 'position', 'candidate', 'team', 'year', 'years', 'strong', 'hands',
    'comfortable', 'written', 'familiarity', 'nice', 'have', 'must',
    'insights', 'senior', 'junior', 'lead', 'owner', 'own', 'need', 'needs',
    'looking', 'join', 'across', 'within', 'using', 'used', 'including',
    'pipeline', 'pipelines', 'warehouse', 'cloud', 'office', 'hybrid',
    'portugal', 'spain', 'australia', 'remote', 'on-site', 'onsite'
  ].forEach(function (w) { GENERIC[w] = true; });

  var SKILL_WORDS = {};
  [
    'python', 'javascript', 'typescript', 'react', 'angular', 'vue', 'node',
    'nodejs', 'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'docker',
    'kubernetes', 'airflow', 'snowflake', 'bigquery', 'redshift', 'databricks',
    'spark', 'kafka', 'dbt', 'pandas', 'looker', 'tableau', 'terraform',
    'ansible', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab', 'jira',
    'figma', 'autocad', 'revit', 'staad', 'etabs', 'geotechnical', 'hydraulics',
    'stamping', 'blanking', 'punching', 'bending', 'forming', 'tonnage',
    'tooling', 'gdpr', 'etl', 'elt', 'sql', 'api', 'graphql', 'oauth',
    'playwright', 'cypress', 'pytest', 'scrum', 'kanban', 'roadmap',
    'discovery', 'okrs', 'okr', 'kpi', 'retention', 'conversion', 'backlog',
    'nscp', 'eurocode', 'bim', 'boq', 'tesda', 'prc', 'iso', 'spc', 'tpm',
    'ppe', 'gd&t', 'gdt', 'micrometer', 'vernier', 'hydraulic', 'mechanical',
    'dbt', 'rest', 'nextjs', 'nodejs', 'fastapi', 'django',
    'flask', 'linux', 'bash', 'excel', 'powerpoint', 'stakeholder',
    'prioritization', 'experimentation', 'research', 'prd', 'gtm'
  ].forEach(function (w) { SKILL_WORDS[w] = true; });

  var KNOWN_PHRASES = [
    'machine learning', 'data pipeline', 'data pipelines', 'data warehouse',
    'data modeling', 'dimensional modeling', 'project management',
    'product management', 'user research', 'user stories', 'selection criteria',
    'civil 3d', 'site supervision', 'quantity surveying',
    'structural design', 'press machine', 'lockout/tagout', 'sheet metal',
    'metal stamping', 'die set', 'tool and die', 'rest api', 'unit tests',
    'integration tests', 'ci/cd', 'github actions', 'azure data factory',
    'google cloud', 'looker studio', 'power bi', 'data quality',
    'full stack', 'front end', 'back end', 'node.js', 'next.js', 'react native',
    'stakeholder management', 'go-to-market', 'a/b test', 'ab test',
    'pull request', 'code review', 'tesda nc', 'prc license', 'data engineer'
  ];

  function normalize(text) {
    return String(text || '')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\u00a0/g, ' ');
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function cleanToken(token) {
    return String(token || '')
      .toLowerCase()
      .replace(/^[^a-z0-9+#]+/, '')
      .replace(/[^a-z0-9+#]+$/, '');
  }

  function tokenize(text) {
    return normalize(text)
      .toLowerCase()
      .replace(/[^a-z0-9+#./-]+/g, ' ')
      .split(/\s+/)
      .map(cleanToken)
      .filter(Boolean);
  }

  function isStop(token) {
    if (!token) return true;
    if (STOPWORDS[token]) return true;
    if (/^\d+(\.\d+)?$/.test(token)) return true;
    return false;
  }

  function isSkillish(token) {
    if (!token || token.length < 2) return false;
    if (/[+#]/g.test(token)) return true;
    if (/\d/.test(token)) return true;
    if (token.indexOf('.') !== -1 || token.indexOf('/') !== -1) return true;
    if (token.length >= 3 && token === token.toUpperCase() && /^[A-Z0-9]{2,6}$/.test(token)) return true;
    return token.length >= 3 && !isStop(token);
  }

  function extractAcronyms(text) {
    var found = [];
    var re = /\b[A-Z][A-Z0-9]{1,5}\b/g;
    var m;
    var raw = normalize(text);
    while ((m = re.exec(raw))) {
      var token = m[0];
      if (token.length < 3) continue;
      if (token === 'CV' || token === 'JD' || token === 'EU' || token === 'PH' || token === 'THE' || token === 'AND' || token === 'FOR' || token === 'ARE' || token === 'WITH') {
        continue;
      }
      found.push(token.toLowerCase());
    }
    return found;
  }

  function uniquePush(list, seen, item) {
    var key = String(item).toLowerCase();
    if (!key || seen[key]) return;
    seen[key] = true;
    list.push(item);
  }

  function extractKeywords(text, options) {
    options = options || {};
    var max = options.max == null ? 40 : options.max;
    var raw = normalize(text);
    if (!raw.trim()) return [];

    var lower = raw.toLowerCase();
    var tokens = tokenize(raw);
    var seen = {};
    var ranked = [];

    function add(term, weight) {
      var key = term.toLowerCase().trim();
      if (!key || isStop(key) || GENERIC[key]) return;
      if (key.length < 2) return;
      if (/^\d/.test(key) && !/[a-z]/i.test(key)) return;
      if (!seen[key]) {
        seen[key] = { term: key, weight: 0 };
        ranked.push(seen[key]);
      }
      seen[key].weight += weight;
    }

    KNOWN_PHRASES.forEach(function (phrase) {
      if (lower.indexOf(phrase) !== -1) add(phrase, 8);
    });

    extractAcronyms(raw).forEach(function (a) { add(a, 6); });

    tokens.forEach(function (t) {
      if (isStop(t) || GENERIC[t]) return;
      if (t.indexOf('/') !== -1) {
        add(t, 6);
        t.split('/').forEach(function (part) {
          if (SKILL_WORDS[part] && part.length >= 3) add(part, 5);
        });
        return;
      }
      if (t.indexOf('-') !== -1) {
        t.split('-').forEach(function (part) {
          if (SKILL_WORDS[part]) add(part, 5);
        });
      }
      if (SKILL_WORDS[t] || /[+#.]/.test(t) || /\d/.test(t)) add(t, 4);
    });

    ranked.sort(function (x, y) {
      if (y.weight !== x.weight) return y.weight - x.weight;
      var spaceDiff = (y.term.split(' ').length) - (x.term.split(' ').length);
      if (spaceDiff) return spaceDiff;
      return x.term.localeCompare(y.term);
    });

    var out = [];
    var outSeen = {};
    ranked.forEach(function (item) {
      if (out.length >= max) return;
      uniquePush(out, outSeen, item.term);
    });
    return out;
  }

  function containsKeyword(haystack, keyword) {
    var text = normalize(haystack).toLowerCase();
    var kw = normalize(keyword).toLowerCase().trim();
    if (!kw) return false;
    if (kw.indexOf(' ') !== -1 || /[.#/+]/.test(kw)) {
      return text.indexOf(kw) !== -1;
    }
    var re = new RegExp('(^|[^a-z0-9+#])' + escapeRegex(kw) + '([^a-z0-9+#]|$)', 'i');
    return re.test(text);
  }

  function scoreMatch(cvText, jdText, options) {
    var keywords = extractKeywords(jdText, options);
    var matched = [];
    var missing = [];
    keywords.forEach(function (kw) {
      if (containsKeyword(cvText, kw)) matched.push(kw);
      else missing.push(kw);
    });
    var score = keywords.length === 0 ? 0 : Math.round((matched.length / keywords.length) * 100);
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return {
      score: score,
      matched: matched,
      missing: missing,
      keywords: keywords,
      total: keywords.length
    };
  }

  function roleKeywordCoverage(roleKeywords, cvText, jdText) {
    return (roleKeywords || []).map(function (keyword) {
      return {
        keyword: keyword,
        inJd: containsKeyword(jdText, keyword),
        inCv: containsKeyword(cvText, keyword)
      };
    });
  }

  return {
    STOPWORDS: STOPWORDS,
    extractKeywords: extractKeywords,
    containsKeyword: containsKeyword,
    scoreMatch: scoreMatch,
    roleKeywordCoverage: roleKeywordCoverage
  };
});
