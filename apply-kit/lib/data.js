(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.APPLY_KIT_DATA = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERIFY = 'Verify on the official site. Rules change and this app is not legal advice.';

  var roles = [
    {
      id: 'data-engineer',
      label: 'Data engineer',
      keywords: [
        'SQL', 'Python', 'ETL', 'ELT', 'Spark', 'Airflow', 'dbt', 'Kafka',
        'Snowflake', 'BigQuery', 'Redshift', 'Databricks', 'Azure Data Factory',
        'data warehouse', 'data pipeline', 'data modeling', 'dimensional modeling',
        'CI/CD', 'Git', 'dbt tests', 'data quality', 'partitioning'
      ],
      tips: [
        'Lead with systems, not tasks: “Built a Python/SQL pipeline in BigQuery that refreshed credit-risk dashboards for 40 underwriters.”',
        'Name the warehouse, orchestrator, and scale (rows/day, SLA, cost saved). Hiring managers outside PH often do not know local product names — add one line of context.',
        'If your experience is BPO reporting or Excel, reframe the production parts: scheduled jobs, data quality checks, stakeholder SLAs.',
        'English stand-ups and documentation are a strength for Filipino engineers — mention async updates, runbooks, or incident notes you owned.',
        'Do not hide a BS Computer Science / Statistics / Engineering degree. For EU roles, add the year and that it is a 4-year bachelor (helps Europass / ENIC-NARIC readers).'
      ]
    },
    {
      id: 'product-manager',
      label: 'Product manager',
      keywords: [
        'roadmap', 'discovery', 'user research', 'PRD', 'OKR', 'KPI',
        'stakeholder', 'prioritization', 'A/B test', 'experimentation',
        'Jira', 'SQL', 'go-to-market', 'backlog', 'user stories',
        'retention', 'conversion', 'discovery interviews'
      ],
      tips: [
        'Use outcome bullets: “Shipped X to N users; raised activation 12% in one quarter.” Avoid “responsible for coordinating with teams.”',
        'Show discovery: interviews, problem statements, what you cut from the roadmap and why.',
        'If you were a “project manager” or “business analyst” in a PH org, map the PM craft: problem, users, metrics, trade-offs, launch.',
        'Cross-border collaboration (US/EU/AU clients, night-shift stand-ups) is relevant for remote and EU roles — put timezone overlap in one line.',
        'Keep the CV to evidence. Do not invent “owned P&L” unless you truly did. Ask the LLM to flag gaps instead of filling them.'
      ]
    },
    {
      id: 'full-stack-engineer',
      label: 'Full stack engineer',
      keywords: [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'REST', 'GraphQL',
        'PostgreSQL', 'testing', 'CI/CD', 'Docker', 'AWS', 'GCP', 'Azure',
        'Next.js', 'API', 'authentication', 'Git', 'unit tests', 'Playwright'
      ],
      tips: [
        'Stack first, then impact: “React + Node.js + PostgreSQL. Cut API p95 from 800ms to 180ms.”',
        'Link a public GitHub or deployed demo when you can. Many AU/EU/remote screens start there.',
        'Production ownership beats bootcamp lists: on-call, migrations, auth, tests, code review.',
        'If you built internal tools for a PH company, describe the users and load (“120 agents, 5k tickets/week”).',
        'For remote roles, mention written RFCs, pull-request habits, and overlapping hours with the team timezone.'
      ]
    },
    {
      id: 'civil-engineer',
      label: 'Civil engineer',
      keywords: [
        'AutoCAD', 'Civil 3D', 'Revit', 'STAAD', 'ETABS', 'site supervision',
        'quantity surveying', 'structural design', 'NSCP', 'Eurocode',
        'AS 3600', 'BIM', 'geotechnical', 'hydraulics', 'project management',
        'BOQ', 'construction methodology', 'safety'
      ],
      tips: [
        'Put your PRC Civil Engineer license on line one of the header: “Civil Engineer — PRC License No. ______ (active).” If the number is sensitive, write “PRC-licensed Civil Engineer, Philippines” and keep the number for the employer portal.',
        'For each project: type (building, road, water), your role (design / site / QS), codes used, and a number (floor area, budget band, crew size).',
        'PH codes (NSCP) are fine — add that you can learn Eurocodes (EU/Spain) or Australian Standards. Do not claim you already design to those codes unless you have.',
        'Civil engineering is often a regulated profession abroad. Degree recognition (ENIC-NARIC in the EU, Engineers Australia skills assessment) is a separate step from the job application. Verify on the official site.',
        'Site safety, DPWH/LGU permitting, and contractor coordination are real skills — translate them into “statutory approvals,” “site inspections,” and “contractor management.”'
      ]
    },
    {
      id: 'metal-press-technician',
      label: 'Metal press technician',
      keywords: [
        'press machine', 'stamping', 'tonnage', 'die set', 'tooling',
        'blanking', 'punching', 'bending', 'forming', 'SPC', 'ISO 9001',
        'lockout/tagout', 'PPE', 'GD&T', 'tolerance', 'setup', 'TPM',
        'hydraulic press', 'mechanical press', 'sheet metal'
      ],
      tips: [
        'Lead with TESDA: “TESDA National Certificate — Press Machine Operation NC I / Metal Stamping NC II (state the exact title on your certificate).” Verify the wording on your paper and at tesda.gov.ph.',
        'Name the machines: brand, type (mechanical / hydraulic), tonnage (e.g. 80-ton, 150-ton), and metals (CRS, stainless, aluminum).',
        'Quantify: parts per shift, changeover time, scrap/defect rate, die changes you can do without a setter.',
        'Safety is a hiring filter in the EU and Australia: lockout/tagout, PPE, press guarding, incident-free stretch. Put it in bullets, not a generic “safety-oriented” line.',
        'If you also do die maintenance, measurement (vernier, micrometer, go/no-go), or read engineering drawings, say so — those map to “setter” and “quality” roles, not only operator seats.'
      ]
    }
  ];

  var destinations = [
    {
      id: 'eu',
      label: 'European Union',
      shortLabel: 'EU',
      cvStyleName: 'Europass / EU CV',
      conventions: [
        'Follow a Europass-inspired CV: personal information, work experience (most recent first), education, skills, language levels using CEFR (A1–C2).',
        'Many EU employers still expect a photo, date of birth, and nationality — include them only if the candidate already has them in the CV. Never invent a photo instruction that requires uploading a file.',
        'Keep 2 pages when possible. Spell out Philippine degree length (4-year bachelor) to help readers compare to Bologna cycles.',
        'Language: state English (and Spanish/German/French if true) with CEFR. “Fluent English” is weaker than “English C1 (professional working).”',
        'Cover letter: one page, addressed to the company, formal, specific to the posting. Mention relocation timing and that visa/work-permit steps will be verified with the employer against official EU/member-state pages.'
      ],
      cvFormat: 'Europass-inspired headings, reverse-chronological experience, CEFR languages, skills grouped (technical / organisational / communication). Prefer 1–2 pages.',
      coverLetter: 'Formal one-page letter. Opening names the role and where it was posted. Middle paragraph maps 3 evidenced strengths to the JD. Closing states notice period and that immigration steps will follow official EU / member-state guidance.',
      visas: [
        {
          title: 'EU Immigration Portal',
          url: 'https://immigration-portal.ec.europa.eu/index_en',
          note: 'Start here for work and residence routes by country.'
        },
        {
          title: 'EU Blue Card (European Commission)',
          url: 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/eu-blue-card_en',
          note: 'Highly qualified employment route. Member states issue the card, not the Commission.'
        },
        {
          title: 'EURES — work in European countries',
          url: 'https://eures.europa.eu/index_en',
          note: 'Official EU job mobility portal and living/working guides.'
        },
        {
          title: 'Europass CV',
          url: 'https://europass.europa.eu/en',
          note: 'Official CV format used across many EU applications.'
        },
        {
          title: 'ENIC-NARIC (qualification recognition)',
          url: 'https://www.enic-naric.net/',
          note: 'Find the national centre that compares foreign degrees.'
        }
      ]
    },
    {
      id: 'spain',
      label: 'Spain',
      shortLabel: 'Spain',
      cvStyleName: 'Spanish CV (currículum)',
      conventions: [
        'Spanish CVs (currículum vitae) often include a professional photo, date of birth, nationality, city, and phone with +63 or a Spanish number if you have one.',
        'Use reverse-chronological order. Headings can be in English for international firms, or Spanish (Datos personales, Experiencia profesional, Formación, Idiomas, Competencias) for local SMEs.',
        'Idiomas: English C1/C2 is a selling point. If you have any Spanish, give a honest CEFR level — do not write “bilingüe” unless you are.',
        'Carta de presentación: one page, slightly warmer than northern-EU letters, still specific. Address “Estimados/as Sres./Sras.” or a named hiring manager.',
        'Highly qualified / EU Blue Card style roles in Spain are often processed via the employer (UGE-CE / Large Companies unit). Do not tell the candidate to “just fly in and apply.”'
      ],
      cvFormat: 'Spanish-style currículum: datos personales, experiencia, formación, idiomas (CEFR), competencias. Photo only if already used by the candidate. 1–2 pages.',
      coverLetter: 'Carta de presentación, one page, in the same language as the job ad (English or Spanish). If the ad is in Spanish and the candidate’s Spanish is not job-ready, write the letter in English and flag that honestly in “Ask the candidate.”',
      visas: [
        {
          title: 'Trabajador altamente cualificado (Ministerio de Inclusión)',
          url: 'https://www.inclusion.gob.es/web/migraciones/trabajador-altamente-cualificado',
          note: 'Official page for highly qualified workers, including EU Blue Card modality.'
        },
        {
          title: 'Hoja 66 — autorización inicial (altamente cualificados)',
          url: 'https://www.inclusion.gob.es/web/migraciones/w/66.-autorizacion-inicial-de-residencia-y-trabajo-de-profesionales-altamente-cualificados',
          note: 'Procedure sheet for the initial residence-and-work authorisation.'
        },
        {
          title: 'Highly Qualified Professionals visa (Plataforma ONE)',
          url: 'https://one.gob.es/en/procedures/application-highly-qualified-professionals-visa',
          note: 'Employer-led route; visa is requested after authorisation.'
        },
        {
          title: 'Spanish Ministry of Foreign Affairs — consular services',
          url: 'https://www.exteriores.gob.es/en/ServiciosAlCiudadano/Paginas/Servicios-consulares.aspx',
          note: 'Find the consulate that serves your Philippine address.'
        }
      ]
    },
    {
      id: 'australia',
      label: 'Australia',
      shortLabel: 'Australia',
      cvStyleName: 'Australian resume',
      conventions: [
        'Australian resumes: no photo, no date of birth, no marital status, no religion, no National ID. Start with name, city/country, phone, email, LinkedIn/GitHub.',
        '2–4 pages is acceptable for experienced hires. Lead with a short profile, key skills, then reverse-chronological employment with achievement bullets.',
        'Mirror the job ad’s wording (selection criteria). Government and some corporate roles want a separate selection-criteria response — if the JD asks for it, draft that as well.',
        'Referees: “Available on request” is fine unless the ad asks to list them. Never invent referee names.',
        'Cover letter: one page, plain English, no fluff, address each major requirement with evidence. Mention that skilled visas and skills assessments will be checked on homeaffairs.gov.au.'
      ],
      cvFormat: 'Australian resume: no photo or protected attributes. Profile + skills + reverse-chronological achievements. 2 pages typical, up to 4 if senior.',
      coverLetter: 'One-page Australian cover letter in plain English. Address the hiring manager if named. Map evidence to the listed requirements / selection criteria. Closing: availability and that visa pathways will be confirmed on official Home Affairs pages.',
      visas: [
        {
          title: 'Working in Australia (Department of Home Affairs)',
          url: 'https://immi.homeaffairs.gov.au/working-in-australia',
          note: 'Official overview of work visa types.'
        },
        {
          title: 'Visa list',
          url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing',
          note: 'Authoritative list of visa subclasses.'
        },
        {
          title: 'Skills assessment',
          url: 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment',
          note: 'Many skilled visas need an assessing authority first.'
        },
        {
          title: 'SkillSelect',
          url: 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect',
          note: 'Expression of interest system for some skilled visas.'
        }
      ]
    },
    {
      id: 'remote',
      label: 'Remote (anywhere)',
      shortLabel: 'Remote',
      cvStyleName: 'Remote / async-friendly resume',
      conventions: [
        'Write for async teams: short paragraphs, evidence of written communication, GitHub/Notion/docs, overlapping hours with the employer timezone.',
        'No photo unless the company culture clearly uses them. Lead with timezone (e.g. Asia/Manila, UTC+8) and typical overlap you can offer.',
        'Show independent delivery: tickets you owned end-to-end, documentation, recorded demos, on-call without a local office.',
        'Be explicit about work-from-Philippines, equipment, and internet. Do not imply you already have a right to work in the company’s country if you do not.',
        'Cover letter: concise, specific, no “I am passionate about synergies.” State timezone, tools, and two evidenced wins that match the JD.'
      ],
      cvFormat: 'Lean resume: timezone, stack/tools, remote collaboration habits, reverse-chronological achievements. 1–2 pages. Links over adjectives.',
      coverLetter: 'Short async-friendly letter (250–350 words). First line: role + timezone + one matching win. Do not promise visa sponsorship or relocation unless the candidate asked for it.',
      visas: [
        {
          title: 'DMW (Department of Migrant Workers, Philippines)',
          url: 'https://www.dmw.gov.ph/',
          note: 'If the contract is with a foreign employer, check whether DMW registration / overseas employment rules apply.'
        },
        {
          title: 'BIR (Philippines tax)',
          url: 'https://www.bir.gov.ph/',
          note: 'Remote pay from a foreign firm can still have PH tax obligations. Verify with official BIR guidance or a licensed adviser.'
        },
        {
          title: 'EU Immigration Portal (if the employer is in the EU)',
          url: 'https://immigration-portal.ec.europa.eu/index_en',
          note: 'Remote-from-PH is not the same as EU work authorisation. Confirm with the employer and the official portal.'
        }
      ]
    }
  ];

  var sharedCredentials = [
    {
      title: 'PRC — Professional Regulation Commission',
      url: 'https://www.prc.gov.ph/',
      note: 'Civil engineers (and other licensed professions): verify license status here before you put a number on a foreign CV.'
    },
    {
      title: 'TESDA',
      url: 'https://www.tesda.gov.ph/',
      note: 'Metal press / stamping certificates: use the exact NC title printed on your certificate.'
    },
    {
      title: 'DMW — Department of Migrant Workers',
      url: 'https://www.dmw.gov.ph/',
      note: 'Philippine overseas employment rules. Verify before paying any agency.'
    }
  ];

  var statuses = [
    { id: 'saved', label: 'Saved' },
    { id: 'applied', label: 'Applied' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'withdrawn', label: 'Withdrawn' }
  ];

  var samples = {
    role: 'data-engineer',
    destination: 'eu',
    cvText: [
      'Maria Santos',
      'Data Engineer · Manila, Philippines · maria.santos@email.com · +63 917 000 0000',
      '',
      'SUMMARY',
      'Data engineer with 5 years building batch pipelines for a Philippine fintech lender and a BPO analytics team. Comfortable in Python, SQL, Airflow, and BigQuery. Working language: English.',
      '',
      'EXPERIENCE',
      'Data Engineer, FinServe PH — 2021–present',
      '- Built Python + SQL pipelines on BigQuery that refresh credit-risk dashboards used by 40 underwriters each morning.',
      '- Reduced a 3-hour Airflow DAG to 35 minutes by partitioning tables and rewriting incremental loads.',
      '- Added dbt tests on core marts; broken-dashboard incidents dropped about 60% over two quarters.',
      '- Documented runbooks in English for a mixed Manila / Singapore stakeholder group.',
      '',
      'Junior Data Analyst, Contoso BPO — 2019–2021',
      '- Wrote recurring MySQL reports for operations (20+ queries, daily and weekly).',
      '- Automated Excel workbooks with Python (pandas) so agents stopped copy-pasting overnight files.',
      '',
      'EDUCATION',
      'B.S. Computer Science (4-year), University of the Philippines Diliman, 2019',
      '',
      'SKILLS',
      'Python, SQL, Airflow, dbt, BigQuery, Git, pandas, Looker Studio, English (professional working)'
    ].join('\n'),
    jobDescription: [
      'Senior Data Engineer — Lisbon, Portugal (hybrid, 3 days in office)',
      'Company: Iberia Insights',
      '',
      'We are hiring a data engineer to own ETL/ELT into Snowflake. You will write Python and SQL, model data with dbt, and orchestrate jobs in Airflow. Kafka (or similar streaming) is a plus.',
      '',
      'Requirements:',
      '- 4+ years building production data pipelines',
      '- Strong SQL and Python',
      '- Hands-on dbt and Airflow',
      '- Warehouse experience (Snowflake, BigQuery, or Redshift)',
      '- Data quality testing and documentation',
      '- Familiarity with GDPR-aware pipelines',
      '- Comfortable in written English; Portuguese is a plus',
      '',
      'Nice to have: Kafka, CI/CD, dbt Cloud, Looker.',
      '',
      'We sponsor eligible EU work authorisation for this role. Apply with a CV and a short cover letter.'
    ].join('\n')
  };

  var flowerHint = [
    'Optional flower notes (from Seeker\'s Seven Petals exercise). Use these to judge aspirational fit, not to invent CV facts:',
    '- Who they are / values',
    '- What they want to do',
    '- Where (geography, remote vs onsite)',
    '- How they like to work',
    '- Who they want to work with',
    '- Conditions (salary floor, hours, deal-breakers)',
    '- Why this work matters to them'
  ].join('\n');

  return {
    version: 1,
    verifyDisclaimer: VERIFY,
    roles: roles,
    destinations: destinations,
    sharedCredentials: sharedCredentials,
    statuses: statuses,
    samples: samples,
    flowerHint: flowerHint
  };
});
