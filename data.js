/**
 * Seeker PH Job Hub — editable data.
 *
 * Change keywords, board URLs, and visa notes here. The page has no backend.
 * After editing, open index.html (or refresh) to see the result.
 *
 * Deep links: #role=data-engineer&dest=spain
 */
(function (root) {
  function enc(s) {
    return encodeURIComponent(s);
  }

  const urls = {
    eures: function (kw, loc) {
      var q = 'page=1&resultsPerPage=25&orderBy=BEST_MATCH&keywordsEverywhere=' + enc(kw) + '&lang=en';
      if (loc) q += '&locationCodes=' + enc(loc);
      return 'https://europa.eu/eures/portal/jv-se/search?' + q;
    },
    linkedin: function (kw, loc) {
      return 'https://www.linkedin.com/jobs/search/?keywords=' + enc(kw) + '&location=' + enc(loc);
    },
    linkedinRemote: function (kw) {
      return 'https://www.linkedin.com/jobs/search/?keywords=' + enc(kw) + '&f_WT=2';
    },
    infojobs: function (kw) {
      return 'https://www.infojobs.net/jobsearch/search-results/list.xhtml?keyword=' + enc(kw);
    },
    tecnoempleo: function (kw) {
      return 'https://www.tecnoempleo.com/busqueda-empleo.php?te=' + enc(kw);
    },
    seek: function (kw) {
      return 'https://www.seek.com.au/jobs?keywords=' + enc(kw);
    },
    adzunaAu: function (kw) {
      return 'https://www.adzuna.com.au/search?q=' + enc(kw);
    },
    indeedAu: function (kw) {
      return 'https://au.indeed.com/jobs?q=' + enc(kw);
    },
    indeedEs: function (kw) {
      return 'https://es.indeed.com/jobs?q=' + enc(kw) + '&l=Espa%C3%B1a';
    },
    workInFinland: function (kw) {
      return 'https://www.workinfinland.com/en/open-jobs/?search_input=' + enc(kw);
    },
    makeItGermany: function (kw) {
      return 'https://www.make-it-in-germany.com/en/working-in-germany/job-listings?tx_solr%5Bq%5D=' + enc(kw);
    },
    remotive: function (kw) {
      return 'https://remotive.com/remote-jobs?search=' + enc(kw);
    },
    remoteok: function (slug) {
      return 'https://remoteok.com/remote-' + slug + '-jobs';
    },
    wwr: function (kw) {
      return 'https://weworkremotely.com/remote-jobs/search?term=' + enc(kw);
    },
    workingNomads: function (path) {
      return 'https://www.workingnomads.com/' + path;
    },
    hiringCafe: function () {
      return 'https://hiringcafe.com/';
    },
    euroEngineer: function (kw) {
      return 'https://www.euroengineerjobs.com/job_search/keyword/' + enc(kw);
    }
  };

  function link(name, url, keywords, note) {
    return { name: name, url: url, keywords: keywords, note: note || '' };
  }

  const OFFICIAL = {
    euBlueCard: 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/eu-blue-card_en',
    euPortal: 'https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal_en',
    euRegProf: 'https://ec.europa.eu/growth/tools-databases/regprof/',
    enicNaric: 'https://www.enic-naric.net/',
    makeItGermany: 'https://www.make-it-in-germany.com/en',
    makeItBlueCard: 'https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card',
    spainHqp: 'https://one.gob.es/en/procedures/application-residence-highly-qualified-professionals',
    spainHomolog: 'https://www.ciencia.gob.es/Universidades/validate/homologacion.html',
    spainManila: 'https://www.exteriores.gob.es/Consulados/manila/es/paginas/index.aspx',
    spainBls: 'https://ph.blsspainvisa.com/',
    spainInclusion: 'https://inclusion.gob.es/web/migraciones/home',
    au482: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482',
    auOccupations: 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list',
    auSkills: 'https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment',
    engineersAu: 'https://www.engineersaustralia.org.au/migrants/migration-skills-assessment',
    acs: 'https://www.acs.org.au/msa.html',
    vetassess: 'https://www.vetassess.com.au/',
    tra: 'https://www.tradesrecognitionaustralia.gov.au/',
    dmw: 'https://www.dmw.gov.ph/',
    dmwAgencies: 'https://dmw.gov.ph/inquiry/licensed-recruitment-agencies',
    dmwJobOrders: 'https://dmw.gov.ph/inquiry/approved-job-orders',
    prc: 'https://www.prc.gov.ph/'
  };

  const VERIFY = 'Verify every requirement, salary floor, and form on the official site before you apply. Rules change.';

  const roles = [
    {
      id: 'data-engineer',
      label: 'Data Engineer',
      blurb: 'Pipelines, warehouses, Spark/SQL, cloud data platforms.',
      keywords: {
        en: 'data engineer',
        es: 'ingeniero de datos',
        au: 'data engineer',
        remoteSlug: 'engineer'
      }
    },
    {
      id: 'product-manager',
      label: 'Product Manager',
      blurb: 'Product owner, discovery, roadmaps, B2B or consumer product.',
      keywords: {
        en: 'product manager',
        es: 'product manager OR jefe de producto',
        au: 'product manager',
        remoteSlug: 'product-manager'
      }
    },
    {
      id: 'full-stack-engineer',
      label: 'Full Stack Engineer',
      blurb: 'Web/app engineer across frontend and backend.',
      keywords: {
        en: 'full stack developer',
        es: 'desarrollador full stack',
        au: 'full stack developer',
        remoteSlug: 'full-stack'
      }
    },
    {
      id: 'civil-engineer',
      label: 'Civil Engineer',
      blurb: 'Design and site work: structural, roads, water, buildings.',
      keywords: {
        en: 'civil engineer',
        es: 'ingeniero civil OR ingeniero de caminos',
        au: 'civil engineer',
        remoteSlug: 'engineer'
      }
    },
    {
      id: 'metal-press-technician',
      label: 'Metal Press Technician',
      blurb: 'Press / stamping operator, hydraulic press, sheet-metal production.',
      keywords: {
        en: 'metal press operator',
        es: 'operario de prensa OR estampación metálica',
        au: 'press operator OR metal fabricator',
        remoteSlug: 'engineer'
      }
    }
  ];

  const destinations = [
    {
      id: 'eu',
      label: 'EU',
      blurb: 'European Union member states (Blue Card + national work permits).'
    },
    {
      id: 'spain',
      label: 'Spain',
      blurb: 'Spain-specific boards, highly-qualified permit, and Manila consulate.'
    },
    {
      id: 'australia',
      label: 'Australia',
      blurb: 'Seek / Adzuna plus Skills in Demand (subclass 482) occupation lists.'
    },
    {
      id: 'remote',
      label: 'Remote',
      blurb: 'Fully remote boards. You can stay in the Philippines as contractor or EOR.'
    }
  ];

  const searches = {
    'data-engineer': {
      eu: [
        link('EURES (EU job portal)', urls.eures('data engineer'), 'data engineer', 'Official EU public employment portal.'),
        link('LinkedIn — Europe', urls.linkedin('data engineer', 'European Union'), 'data engineer', ''),
        link('Work in Finland', urls.workInFinland('data engineer'), 'data engineer', ''),
        link('Make it in Germany job listings', urls.makeItGermany('data engineer'), 'data engineer', 'Official German skilled-worker portal.'),
        link('Hiring Cafe', urls.hiringCafe(), 'data engineer', 'Open the site and search “data engineer”.')
      ],
      spain: [
        link('EURES — Spain', urls.eures('data engineer', 'es'), 'data engineer', 'Filter is Spain (locationCodes=es).'),
        link('InfoJobs — ingeniero de datos', urls.infojobs('ingeniero de datos'), 'ingeniero de datos', 'Spanish wording finds more local ads.'),
        link('LinkedIn — Spain', urls.linkedin('data engineer OR ingeniero de datos', 'Spain'), 'data engineer, ingeniero de datos', ''),
        link('Tecnoempleo', urls.tecnoempleo('ingeniero de datos'), 'ingeniero de datos', 'Spain tech board.'),
        link('Indeed España', urls.indeedEs('ingeniero de datos'), 'ingeniero de datos', '')
      ],
      australia: [
        link('SEEK', urls.seek('data engineer'), 'data engineer', 'Australia’s main job board.'),
        link('Adzuna Australia', urls.adzunaAu('data engineer'), 'data engineer', ''),
        link('LinkedIn — Australia', urls.linkedin('data engineer', 'Australia'), 'data engineer', ''),
        link('Indeed Australia', urls.indeedAu('data engineer'), 'data engineer', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'data engineer', 'Open the site and search “data engineer”.')
      ],
      remote: [
        link('We Work Remotely', urls.wwr('data engineer'), 'data engineer', ''),
        link('Remote OK', urls.remoteok('engineer'), 'engineer', 'Browse/filter for data / backend.'),
        link('Remotive', urls.remotive('data engineer'), 'data engineer', ''),
        link('Working Nomads — development', urls.workingNomads('remote-development-jobs'), 'development', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'data engineer', 'Open the site and search “data engineer remote”.')
      ]
    },
    'product-manager': {
      eu: [
        link('EURES (EU job portal)', urls.eures('product manager'), 'product manager', 'Official EU public employment portal.'),
        link('LinkedIn — Europe', urls.linkedin('product manager OR product owner', 'European Union'), 'product manager, product owner', ''),
        link('Work in Finland', urls.workInFinland('product manager'), 'product manager', ''),
        link('Make it in Germany job listings', urls.makeItGermany('product manager'), 'product manager', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'product manager', 'Open the site and search “product manager”.')
      ],
      spain: [
        link('EURES — Spain', urls.eures('product manager', 'es'), 'product manager', ''),
        link('InfoJobs — product manager', urls.infojobs('product manager'), 'product manager, jefe de producto', ''),
        link('LinkedIn — Spain', urls.linkedin('product manager OR jefe de producto', 'Spain'), 'product manager, jefe de producto', ''),
        link('Tecnoempleo', urls.tecnoempleo('product manager'), 'product manager', ''),
        link('Indeed España', urls.indeedEs('product manager'), 'product manager', '')
      ],
      australia: [
        link('SEEK', urls.seek('product manager'), 'product manager', ''),
        link('Adzuna Australia', urls.adzunaAu('product manager'), 'product manager', ''),
        link('LinkedIn — Australia', urls.linkedin('product manager', 'Australia'), 'product manager', ''),
        link('Indeed Australia', urls.indeedAu('product manager'), 'product manager', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'product manager', 'Open the site and search “product manager”.')
      ],
      remote: [
        link('We Work Remotely', urls.wwr('product manager'), 'product manager', ''),
        link('Remote OK — product manager', urls.remoteok('product-manager'), 'product-manager', ''),
        link('Remotive', urls.remotive('product manager'), 'product manager', ''),
        link('Working Nomads', urls.workingNomads('jobs'), 'product manager', 'Use the on-site search for “product”.'),
        link('Hiring Cafe', urls.hiringCafe(), 'product manager', 'Open the site and search “product manager remote”.')
      ]
    },
    'full-stack-engineer': {
      eu: [
        link('EURES (EU job portal)', urls.eures('full stack developer'), 'full stack developer', 'Official EU public employment portal.'),
        link('LinkedIn — Europe', urls.linkedin('full stack developer', 'European Union'), 'full stack developer', ''),
        link('Work in Finland', urls.workInFinland('full stack developer'), 'full stack developer', ''),
        link('Make it in Germany job listings', urls.makeItGermany('full stack developer'), 'full stack developer', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'full stack developer', 'Open the site and search “full stack”.')
      ],
      spain: [
        link('EURES — Spain', urls.eures('full stack developer', 'es'), 'full stack developer', ''),
        link('InfoJobs — desarrollador full stack', urls.infojobs('desarrollador full stack'), 'desarrollador full stack', ''),
        link('LinkedIn — Spain', urls.linkedin('desarrollador full stack OR full stack', 'Spain'), 'desarrollador full stack, full stack', ''),
        link('Tecnoempleo', urls.tecnoempleo('full stack'), 'full stack', ''),
        link('Indeed España', urls.indeedEs('desarrollador full stack'), 'desarrollador full stack', '')
      ],
      australia: [
        link('SEEK', urls.seek('full stack developer'), 'full stack developer', ''),
        link('Adzuna Australia', urls.adzunaAu('full stack developer'), 'full stack developer', ''),
        link('LinkedIn — Australia', urls.linkedin('full stack developer', 'Australia'), 'full stack developer', ''),
        link('Indeed Australia', urls.indeedAu('full stack developer'), 'full stack developer', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'full stack developer', 'Open the site and search “full stack”.')
      ],
      remote: [
        link('We Work Remotely', urls.wwr('full stack'), 'full stack', ''),
        link('Remote OK — full stack', urls.remoteok('full-stack'), 'full-stack', ''),
        link('Remotive — software development', urls.remotive('full stack'), 'full stack', ''),
        link('Working Nomads — programming', urls.workingNomads('remote-programming-jobs'), 'programming', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'full stack', 'Open the site and search “full stack remote”.')
      ]
    },
    'civil-engineer': {
      eu: [
        link('EURES (EU job portal)', urls.eures('civil engineer'), 'civil engineer', 'Official EU public employment portal.'),
        link('LinkedIn — Europe', urls.linkedin('civil engineer', 'European Union'), 'civil engineer', ''),
        link('Euro Engineer Jobs', urls.euroEngineer('civil engineer'), 'civil engineer', 'Engineering-focused EU board.'),
        link('Make it in Germany job listings', urls.makeItGermany('civil engineer'), 'civil engineer', ''),
        link('Work in Finland', urls.workInFinland('civil engineer'), 'civil engineer', '')
      ],
      spain: [
        link('EURES — Spain', urls.eures('civil engineer', 'es'), 'civil engineer, ingeniero de caminos', ''),
        link('InfoJobs — ingeniero civil', urls.infojobs('ingeniero civil'), 'ingeniero civil', ''),
        link('InfoJobs — ingeniero de caminos', urls.infojobs('ingeniero de caminos'), 'ingeniero de caminos', 'Local title for civil / public works.'),
        link('LinkedIn — Spain', urls.linkedin('ingeniero civil OR ingeniero de caminos', 'Spain'), 'ingeniero civil, ingeniero de caminos', ''),
        link('Indeed España', urls.indeedEs('ingeniero civil'), 'ingeniero civil', '')
      ],
      australia: [
        link('SEEK', urls.seek('civil engineer'), 'civil engineer', ''),
        link('Adzuna Australia', urls.adzunaAu('civil engineer'), 'civil engineer', ''),
        link('LinkedIn — Australia', urls.linkedin('civil engineer', 'Australia'), 'civil engineer', ''),
        link('Indeed Australia', urls.indeedAu('civil engineer'), 'civil engineer', ''),
        link('Euro Engineer Jobs', urls.euroEngineer('civil engineer Australia'), 'civil engineer', '')
      ],
      remote: [
        link('LinkedIn — remote civil / BIM', urls.linkedinRemote('civil engineer OR BIM engineer'), 'civil engineer, BIM engineer', 'Civil roles are often on-site; look for BIM, design, or consulting.'),
        link('We Work Remotely', urls.wwr('civil engineer'), 'civil engineer', ''),
        link('Remotive', urls.remotive('civil engineer'), 'civil engineer', ''),
        link('Remote OK', urls.remoteok('engineer'), 'engineer', 'Filter for design / BIM if listed.'),
        link('Hiring Cafe', urls.hiringCafe(), 'civil engineer remote BIM', 'Open the site and search “civil engineer BIM remote”.')
      ]
    },
    'metal-press-technician': {
      eu: [
        link('EURES — press operator', urls.eures('press operator metal'), 'press operator metal', 'Official EU public employment portal.'),
        link('EURES — stamping', urls.eures('metal stamping operator'), 'metal stamping operator', ''),
        link('LinkedIn — Europe', urls.linkedin('press operator OR stamping operator', 'European Union'), 'press operator, stamping operator', ''),
        link('Make it in Germany job listings', urls.makeItGermany('press operator'), 'press operator', 'Germany has a vocational skilled-worker route.'),
        link('Work in Finland', urls.workInFinland('machine operator metal'), 'machine operator metal', '')
      ],
      spain: [
        link('EURES — Spain', urls.eures('operario de prensa', 'es'), 'operario de prensa', ''),
        link('InfoJobs — operario de prensa', urls.infojobs('operario de prensa'), 'operario de prensa', ''),
        link('InfoJobs — estampación metálica', urls.infojobs('estampación metálica'), 'estampación metálica', ''),
        link('LinkedIn — Spain', urls.linkedin('operario de prensa OR estampación', 'Spain'), 'operario de prensa, estampación', ''),
        link('Indeed España', urls.indeedEs('operario de prensa'), 'operario de prensa', '')
      ],
      australia: [
        link('SEEK — press operator', urls.seek('press operator'), 'press operator', ''),
        link('SEEK — metal fabricator', urls.seek('metal fabricator'), 'metal fabricator', 'Nearby trade title on AU occupation lists.'),
        link('Adzuna Australia', urls.adzunaAu('press operator OR metal fabricator'), 'press operator, metal fabricator', ''),
        link('Indeed Australia', urls.indeedAu('press operator'), 'press operator', ''),
        link('LinkedIn — Australia', urls.linkedin('press operator OR metal fabricator', 'Australia'), 'press operator, metal fabricator', '')
      ],
      remote: [
        link('LinkedIn — remote CNC / CAD-CAM', urls.linkedinRemote('CNC programmer OR CAD CAM press tooling'), 'CNC programmer, CAD CAM', 'Shop-floor press work is almost never remote. CAD/CAM or CNC programming sometimes is.'),
        link('We Work Remotely', urls.wwr('manufacturing'), 'manufacturing', ''),
        link('Remotive', urls.remotive('manufacturing technician'), 'manufacturing technician', ''),
        link('Hiring Cafe', urls.hiringCafe(), 'CNC programmer remote', 'Open the site and search “CNC” or “manufacturing remote”.'),
        link('Remote OK', urls.remoteok('engineer'), 'engineer', 'Unlikely for press-operator titles; try manufacturing engineering.')
      ]
    }
  };

  const dmw = {
    title: 'DMW / former POEA — Filipino workers',
    summary:
      'The Department of Migrant Workers (DMW) absorbed the old POEA. If anyone in the Philippines recruits you for a job abroad, they must be on the DMW licensed-agency list, and the vacancy should appear as an approved job order. Direct applications to a foreign employer are common for professional roles — still never pay a “guaranteed visa” fee, never surrender your passport, and never travel on a tourist visa to “convert” to work.',
    warning:
      'Illegal recruiters often use Facebook, Telegram, or “too good” salaries. Verify the agency on the official DMW list. Report tips to airtipinfo@dmw.gov.ph, mwpb@dmw.gov.ph, DMW hotlines (02) 8722-1144 / 8722-1155, or emergency 1348.',
    links: [
      { label: 'DMW home', url: OFFICIAL.dmw },
      { label: 'Licensed recruitment agencies (verify here)', url: OFFICIAL.dmwAgencies },
      { label: 'Approved job orders', url: OFFICIAL.dmwJobOrders }
    ]
  };

  const pathways = {
    eu: {
      title: 'EU pathway',
      visaRoutes: [
        {
          name: 'EU Blue Card',
          summary:
            'For highly qualified non-EU workers with a contract or binding offer of at least 6 months, higher-education qualifications (or, in some ICT jobs, relevant experience), and a salary at or above the national Blue Card threshold (set by each country, between about 1× and 1.6× average pay). Does not apply in Denmark or Ireland. You or the employer apply to that country’s authorities — the European Commission does not issue Blue Cards.',
          url: OFFICIAL.euBlueCard
        },
        {
          name: 'National work / single permit',
          summary:
            'Every EU country also has its own work-and-residence permit. Shortage lists, labour-market tests, and salary floors differ. Start on the EU Immigration Portal map for the member state you actually want, then read that country’s official page.',
          url: OFFICIAL.euPortal
        },
        {
          name: 'Germany skilled-worker route (example)',
          summary:
            'Germany’s Make it in Germany site covers the EU Blue Card and the Skilled Immigration Act, including vocational (non-degree) skilled workers and the Opportunity Card. Use it only as a country example — other member states have their own rules.',
          url: OFFICIAL.makeItGermany
        }
      ],
      dmwExtra:
        'EU professional jobs are often direct hire. If a Manila agency is involved, check they are DMW-licensed and that the job order is approved. A tourist Schengen visa is not a work permit.',
      roleNotes: {
        'data-engineer': {
          heading: 'Data Engineer in the EU',
          credentials:
            'Software / data roles are usually unregulated. Bring your diploma (apostille + translation if asked) and detailed employment certificates. Some member states accept several years of ICT experience in place of a degree for the Blue Card. Check recognition via ENIC-NARIC if a university asks for it.',
          credentialLinks: [
            { label: 'ENIC-NARIC recognition', url: OFFICIAL.enicNaric },
            { label: 'EU Blue Card (official)', url: OFFICIAL.euBlueCard }
          ],
          caveats: [
            'You almost always need a signed job offer before the visa.',
            'Salary thresholds are national — look up the destination country, not a blog average.'
          ]
        },
        'product-manager': {
          heading: 'Product Manager in the EU',
          credentials:
            'Product management is typically unregulated. Employers care about shipped products, English (plus the local language in many teams), and a degree or equivalent experience. Blue Card eligibility still depends on that country’s qualification and salary rules.',
          credentialLinks: [
            { label: 'EU Immigration Portal', url: OFFICIAL.euPortal },
            { label: 'EU Blue Card (official)', url: OFFICIAL.euBlueCard }
          ],
          caveats: ['A “product owner” title may map better in some markets (Nordics, DACH).']
        },
        'full-stack-engineer': {
          heading: 'Full Stack Engineer in the EU',
          credentials:
            'ICT is often unregulated. The revised Blue Card rules let some ICT managers/professionals use professional experience instead of a degree — only where that member state implemented it. Always confirm on the national page.',
          credentialLinks: [
            { label: 'EU Blue Card (official)', url: OFFICIAL.euBlueCard },
            { label: 'Make it in Germany — Blue Card', url: OFFICIAL.makeItBlueCard }
          ],
          caveats: []
        },
        'civil-engineer': {
          heading: 'Civil Engineer in the EU',
          credentials:
            'Civil engineering is a regulated profession in many member states. A PRC license in the Philippines does not automatically let you sign off work in the EU. You will likely need recognition of professional qualifications (see the EU regulated-professions database) plus ENIC-NARIC for the degree. Bring apostilled transcripts and your PRC ID.',
          credentialLinks: [
            { label: 'EU regulated professions database', url: OFFICIAL.euRegProf },
            { label: 'ENIC-NARIC', url: OFFICIAL.enicNaric },
            { label: 'PRC (Philippines)', url: OFFICIAL.prc }
          ],
          caveats: [
            'You may be hired first in a non-signing role (designer, BIM, site engineer) while recognition is in progress.',
            'Language (German, French, Nordic languages) is often required on site.'
          ]
        },
        'metal-press-technician': {
          heading: 'Metal Press Technician in the EU',
          credentials:
            'This is a skilled-trade path, not a typical EU Blue Card path (Blue Card is for highly qualified / degree-level roles). Look at national shortage lists and vocational skilled-worker visas (Germany’s Skilled Immigration Act is the best-documented example). TESDA/NC certificates, employment history, and machine types (hydraulic press, stamping, CNC) help. Recognition is via trade/vocational authorities, not a university homologación.',
          credentialLinks: [
            { label: 'Make it in Germany (skilled workers)', url: OFFICIAL.makeItGermany },
            { label: 'EU Immigration Portal', url: OFFICIAL.euPortal }
          ],
          caveats: [
            'Expect an employer to sponsor a national work permit, not a Blue Card.',
            'Collective agreements and safety certificates (e.g. forklift, overhead crane) can be required on the shop floor.'
          ]
        }
      }
    },
    spain: {
      title: 'Spain pathway',
      visaRoutes: [
        {
          name: 'Highly Qualified Professional (national permit) / EU Blue Card',
          summary:
            'Spain’s Large Companies and Strategic Groups Unit (UGE-CE) handles residence for highly qualified professionals, including an EU Blue Card track and a national highly-qualified track under Law 14/2013. You generally need a firm job offer; the employer often files first. After authorisation, apply for the national visa at the Consulate General of Spain in Manila (appointments via BLS).',
          url: OFFICIAL.spainHqp
        },
        {
          name: 'Ordinary work visa (cuenta ajena)',
          summary:
            'If the role is not “highly qualified”, the employer in Spain applies for an initial residence-and-work authorisation, then you collect the national work visa in Manila. Filipinos follow the consulate’s national-visa checklist.',
          url: OFFICIAL.spainManila
        },
        {
          name: 'Job-search residence — limited, not an open “seeker visa”',
          summary:
            'Spain’s job-search / business-project residence is mainly for people who already finished qualifying studies in Spain. It is not a general permit that lets someone fly from Manila to look for work. Ignore agencies that sell an “open job-seeker visa” for Spain.',
          url: OFFICIAL.spainInclusion
        }
      ],
      dmwExtra:
        'Work visas for Spain are issued by the Spanish consulate (via BLS in Manila), not by a Facebook “processor”. If a PH agency is used, it must be DMW-licensed. Do not enter Spain as a tourist intending to work.',
      roleNotes: {
        'data-engineer': {
          heading: 'Data Engineer in Spain',
          credentials:
            'Not a regulated profession. Use English titles plus “ingeniero de datos”. For the highly-qualified route, a 3-year higher-education qualification (or accepted experience) plus a qualifying salary is typical. Degree equivalencia (academic level) is different from homologación (needed only for regulated professions). Apostille CHED/university documents if asked.',
          credentialLinks: [
            { label: 'Highly qualified residence (ONE)', url: OFFICIAL.spainHqp },
            { label: 'Homologación / equivalencia (official)', url: OFFICIAL.spainHomolog },
            { label: 'Consulate General of Spain in Manila', url: OFFICIAL.spainManila }
          ],
          caveats: ['Spanish language helps a lot outside international tech hubs (Madrid, Barcelona, Málaga, Valencia).']
        },
        'product-manager': {
          heading: 'Product Manager in Spain',
          credentials:
            'Unregulated. Search “product manager”, “product owner”, and “jefe de producto”. Highly-qualified / Blue Card is realistic at the right salary band with a degree or equivalent experience. Prepare apostilled diploma and employment letters in Spanish or with sworn translation if the UGE asks.',
          credentialLinks: [
            { label: 'Highly qualified residence (ONE)', url: OFFICIAL.spainHqp },
            { label: 'BLS Spain visa centre — Philippines', url: OFFICIAL.spainBls }
          ],
          caveats: []
        },
        'full-stack-engineer': {
          heading: 'Full Stack Engineer in Spain',
          credentials:
            'Unregulated ICT role. Spanish ads use “desarrollador full stack”, “programador”, or English titles. Highly-qualified or Blue Card is the usual sponsored path for non-EU engineers. Equivalencia of your degree is sometimes requested; homologación is not, unless the contract is for a regulated engineering title.',
          credentialLinks: [
            { label: 'Highly qualified residence (ONE)', url: OFFICIAL.spainHqp },
            { label: 'Homologación / equivalencia (official)', url: OFFICIAL.spainHomolog }
          ],
          caveats: []
        },
        'civil-engineer': {
          heading: 'Civil Engineer in Spain',
          credentials:
            'Regulated. A PRC civil-engineering license does not by itself let you practise as “ingeniero de caminos, canales y puertos” or sign projects. Homologación of a foreign higher-education degree to a Spanish regulated profession is done through the Ministry (sede electrónica). Employers may hire you in a supporting role while homologación is pending. Apostille + sworn Spanish translation of diploma, transcript, and PRC certificate.',
          credentialLinks: [
            { label: 'Homologación of foreign degrees (official)', url: OFFICIAL.spainHomolog },
            { label: 'PRC (Philippines)', url: OFFICIAL.prc },
            { label: 'Consulate General of Spain in Manila', url: OFFICIAL.spainManila }
          ],
          caveats: [
            'Homologación can take many months — start the paperwork as soon as you have a serious employer conversation.',
            'Colegio membership may be required to sign off work.'
          ]
        },
        'metal-press-technician': {
          heading: 'Metal Press Technician in Spain',
          credentials:
            'Shop-floor press / stamping is usually an ordinary work permit (cuenta ajena), not the highly-qualified track. Search “operario de prensa”, “estampación metálica”, “prensa hidráulica”. TESDA or company certificates, machine list, and safety training help. No university homologación is typical unless the contract is for a regulated engineering title.',
          credentialLinks: [
            { label: 'Spanish consulate in Manila', url: OFFICIAL.spainManila },
            { label: 'BLS Spain visa centre — Philippines', url: OFFICIAL.spainBls },
            { label: 'Migration home (Inclusion)', url: OFFICIAL.spainInclusion }
          ],
          caveats: [
            'The employer in Spain must obtain authorisation before you book a work-visa appointment.',
            'Do not pay a recruiter who tells you to fly Schengen tourist and “fix papers there”.'
          ]
        }
      }
    },
    australia: {
      title: 'Australia pathway',
      visaRoutes: [
        {
          name: 'Skills in Demand visa (subclass 482)',
          summary:
            'The 482 Skills in Demand visa replaced new Temporary Skill Shortage applications. An Australian employer sponsors you for a listed occupation (Core Skills Occupation List for the Core Skills stream, or the Specialist Skills stream at a high salary). Stay can be up to 4 years. Occupation lists and income thresholds change — read the current Home Affairs page.',
          url: OFFICIAL.au482
        },
        {
          name: 'Occupation lists + skills assessment',
          summary:
            'Your ANZSCO occupation must be on the list that matches the visa. Many applicants also need a skills assessment from the authority named for that occupation (ACS for many ICT roles, Engineers Australia for professional engineers, TRA or VETASSESS for many trades/technicians). Check both the occupation list and the skills-assessment page before paying anyone.',
          url: OFFICIAL.auOccupations
        }
      ],
      dmwExtra:
        'Australian professional and trade visas are employer- or points-based through Home Affairs, not through a Facebook “immigration fixer”. If a PH agency claims they can “guarantee 482”, verify they are DMW-licensed and that Home Affairs is the only visa decision-maker.',
      roleNotes: {
        'data-engineer': {
          heading: 'Data Engineer in Australia',
          credentials:
            '“Data Engineer” is often assessed under ICT occupations (for example Developer Programmer or Software Engineer) by the Australian Computer Society (ACS). Your exact ANZSCO code depends on duties, not the job title on your business card. Compare your tasks to the occupation list, then follow ACS migration skills assessment instructions.',
          credentialLinks: [
            { label: 'Skills in Demand (subclass 482)', url: OFFICIAL.au482 },
            { label: 'Skilled occupation list', url: OFFICIAL.auOccupations },
            { label: 'ACS migration skills assessment', url: OFFICIAL.acs }
          ],
          caveats: [
            'Title mismatch is common — map duties to ANZSCO before you book ACS.',
            'English (IELTS/PTE or equivalent) is often required for the skills assessment or visa.'
          ]
        },
        'product-manager': {
          heading: 'Product Manager in Australia',
          credentials:
            'Product Manager is not always a single ANZSCO code. Close occupations may include ICT Business Analyst, ICT Project Manager, or others assessed by ACS or VETASSESS depending on whether the work is ICT. Confirm the code on the official occupation list and the assessing authority before you apply.',
          credentialLinks: [
            { label: 'Skilled occupation list', url: OFFICIAL.auOccupations },
            { label: 'Skills assessment overview (Home Affairs)', url: OFFICIAL.auSkills },
            { label: 'VETASSESS', url: OFFICIAL.vetassess }
          ],
          caveats: ['Employer-sponsored 482 still needs the occupation to be list-eligible and paid at market rate / threshold.']
        },
        'full-stack-engineer': {
          heading: 'Full Stack Engineer in Australia',
          credentials:
            'Usually maps to Developer Programmer, Software Engineer, or similar ICT occupations assessed by ACS. Gather detailed employment references (hours, duties, tech stack) in the ACS format.',
          credentialLinks: [
            { label: 'Skills in Demand (subclass 482)', url: OFFICIAL.au482 },
            { label: 'ACS migration skills assessment', url: OFFICIAL.acs },
            { label: 'Skilled occupation list', url: OFFICIAL.auOccupations }
          ],
          caveats: []
        },
        'civil-engineer': {
          heading: 'Civil Engineer in Australia',
          credentials:
            'Civil Engineer (ANZSCO 233211) is a standard professional-engineer occupation. Engineers Australia is the assessing authority for migration skills assessment. A PRC license is useful evidence of professional standing; it is not a substitute for the EA assessment. Check whether your Philippine degree is recognised under the Washington Accord (CHED/program and graduation year matter).',
          credentialLinks: [
            { label: 'Engineers Australia — migration skills assessment', url: OFFICIAL.engineersAu },
            { label: 'Skilled occupation list', url: OFFICIAL.auOccupations },
            { label: 'PRC (Philippines)', url: OFFICIAL.prc }
          ],
          caveats: [
            'If the degree is not Accord-accredited, EA may require a Competency Demonstration Report (CDR).',
            'State registration to independently practise is separate from the migration skills assessment.'
          ]
        },
        'metal-press-technician': {
          heading: 'Metal Press Technician in Australia',
          credentials:
            'There may be no ANZSCO code literally named “metal press technician”. Nearby trades include Metal Fabricator, Sheetmetal Worker, Engineering Production roles, or Mechanical Engineering Technician. Trades Recognition Australia (TRA) or VETASSESS assesses many of these. Confirm the occupation is on the current Core Skills Occupation List before paying for an assessment.',
          credentialLinks: [
            { label: 'Skilled occupation list', url: OFFICIAL.auOccupations },
            { label: 'Skills assessment overview (Home Affairs)', url: OFFICIAL.auSkills },
            { label: 'Trades Recognition Australia', url: OFFICIAL.tra },
            { label: 'VETASSESS', url: OFFICIAL.vetassess }
          ],
          caveats: [
            'Do not assume press-operator experience automatically matches Metal Fabricator — read the ANZSCO task list.',
            'Photos of machines, training records, and employer letters with hours/duties are the usual evidence pack.'
          ]
        }
      }
    },
    remote: {
      title: 'Remote pathway (work from the Philippines)',
      visaRoutes: [
        {
          name: 'Stay in the PH: contractor',
          summary:
            'Many remote companies hire Filipinos as independent contractors. You invoice the company, register the activity with BIR as required, and keep your own benefits. This is not a visa. It is a tax and contract setup — confirm current BIR rules with a PH accountant; this page is not tax advice.',
          url: 'https://www.bir.gov.ph/'
        },
        {
          name: 'Stay in the PH: Employer of Record (EOR / payroll)',
          summary:
            'If the company wants you as an employee (SSS, PhilHealth, Pag-IBIG, 13th month), they can use an Employer of Record in the Philippines. You become an employee of the EOR, which invoices the foreign company. Ask the employer if they already use an EOR. Never pay a “processor” to invent an EOR for you.',
          url: 'https://www.bir.gov.ph/'
        },
        {
          name: 'Want to live in Spain/EU while remote?',
          summary:
            'Working remotely for a non-Spanish company from Spain is a different visa (teletrabajo / digital nomad under Law 14/2013). That is not the same as “remote from Manila”. Start at the Consulate General of Spain in Manila and the official ONE/exteriores pages — do not buy a packaged “nomad visa” from an unlicensed agent.',
          url: OFFICIAL.spainManila
        }
      ],
      dmwExtra:
        'Pure remote work for a foreign company while you remain in the Philippines is not overseas deployment. If someone still “recruits you for abroad” (relocation, tourist-visa hopping, training in a third country), treat it as overseas employment and verify them on the DMW list.',
      roleNotes: {
        'data-engineer': {
          heading: 'Remote Data Engineer',
          credentials:
            'No host-country license. A strong GitHub/portfolio, cloud certs, and English writing matter more than PRC. Time-zone overlap with EU (CET) or AU (AEST) is a selling point. Spell out that you can work as a PH contractor or via EOR.',
          credentialLinks: [
            { label: 'BIR (tax — verify your setup)', url: 'https://www.bir.gov.ph/' }
          ],
          caveats: [
            'Some US/EU postings are “remote, country X only” — read the location limit before you write a long application.',
            'Never pay for a “remote job slot” or “visa-free US payroll”. Those are classic scams.'
          ]
        },
        'product-manager': {
          heading: 'Remote Product Manager',
          credentials:
            'Unregulated. Case studies, product metrics, and async communication samples help. Contractor vs EOR as above.',
          credentialLinks: [
            { label: 'BIR (tax — verify your setup)', url: 'https://www.bir.gov.ph/' }
          ],
          caveats: ['Product roles are often limited to specific time zones or employment countries.']
        },
        'full-stack-engineer': {
          heading: 'Remote Full Stack Engineer',
          credentials:
            'Unregulated. Public code, production systems, and a CV in English are the usual pack. Contractor or EOR.',
          credentialLinks: [
            { label: 'BIR (tax — verify your setup)', url: 'https://www.bir.gov.ph/' }
          ],
          caveats: []
        },
        'civil-engineer': {
          heading: 'Remote Civil Engineer',
          credentials:
            'Fully remote civil jobs are uncommon (site visits). Remote-friendly slices: BIM, drawing production, quantity take-off, design under a locally licensed engineer. Your PRC license still does not let you stamp drawings in another country. If the client is PH-based, PRC rules apply.',
          credentialLinks: [
            { label: 'PRC (Philippines)', url: OFFICIAL.prc },
            { label: 'BIR (tax — verify your setup)', url: 'https://www.bir.gov.ph/' }
          ],
          caveats: ['Do not sign or stamp work in a country where you are not licensed.']
        },
        'metal-press-technician': {
          heading: 'Remote Metal Press Technician',
          credentials:
            'A hydraulic press cannot be operated from home. Treat this destination as a stretch: CAD/CAM, CNC programming, tooling design, or maintenance documentation. For actual press work, pick EU, Spain, or Australia instead.',
          credentialLinks: [
            { label: 'DMW licensed agencies (if anyone offers relocation)', url: OFFICIAL.dmwAgencies }
          ],
          caveats: [
            'If a posting is “remote press operator”, it is probably mis-tagged or a scam — walk away.',
            'Relocation offers must still be checked against DMW if recruitment happens in the PH.'
          ]
        }
      }
    }
  };

  const checklist = [
    {
      title: 'Name what you actually want',
      body: 'Do the Seven Petals / flower exercise so you are not applying to every ad. Paste the prompt into ChatGPT, Claude, or any AI chat and answer specifically.'
    },
    {
      title: 'Pick a role and a destination on this page',
      body: 'Use the buttons above. Bookmark or share the URL — it keeps your choices in the hash (example: #role=data-engineer&dest=spain).'
    },
    {
      title: 'Open every search link and save alerts',
      body: 'Click the boards for your combo. Create email/job alerts with the local keywords (Spanish titles for Spain, ANZSCO-friendly titles for Australia).'
    },
    {
      title: 'Refresh your CV in the language of the market',
      body: 'English for EU/AU/remote. Add a Spanish CV for Spain. Use the same keywords the ads use. Keep a one-page PDF ready.'
    },
    {
      title: 'Gather documents before you need them',
      body: 'Passport, diploma + transcript, apostille, PRC ID if you have one, employment certificates with duties and dates, TESDA/trade papers. Sworn translations if Spain asks.'
    },
    {
      title: 'Read the pathway card, then verify on the official site',
      body: 'Visa lists here are a map, not a filing kit. Open the government URLs. Salary floors, occupation lists, and forms change. Do not rely on a recruiter’s screenshot of an old PDF.'
    },
    {
      title: 'Apply directly — and treat recruiters as guilty until licensed',
      body: 'Send applications to employers yourself. If anyone in the Philippines recruits you for work abroad, search them on the DMW licensed-agency list first. Never pay a “guarantee”, never hand over your passport, never fly as a tourist “to process the work visa there”.'
    }
  ];

  const flowerExercise = {
    label: 'Flower exercise prompt',
    localHtml: 'flower-exercise.html',
    localMd: 'prompts/flower-exercise.md',
    repoMd: '../prompts/flower-exercise.md',
    github: 'https://github.com/ncdejito/seeker/blob/main/prompts/flower-exercise.md'
  };

  function getRole(id) {
    for (var i = 0; i < roles.length; i++) if (roles[i].id === id) return roles[i];
    return null;
  }

  function getDest(id) {
    for (var i = 0; i < destinations.length; i++) if (destinations[i].id === id) return destinations[i];
    return null;
  }

  function getCombo(roleId, destId) {
    var role = getRole(roleId);
    var dest = getDest(destId);
    if (!role || !dest) return null;
    var links = (searches[roleId] && searches[roleId][destId]) || [];
    var destPath = pathways[destId];
    var notes = destPath && destPath.roleNotes && destPath.roleNotes[roleId];
    if (!destPath || !notes) return null;
    return {
      role: role,
      dest: dest,
      links: links,
      pathway: {
        heading: notes.heading,
        destTitle: destPath.title,
        visaRoutes: destPath.visaRoutes,
        credentials: notes.credentials,
        credentialLinks: notes.credentialLinks || [],
        caveats: notes.caveats || [],
        dmw: dmw,
        dmwExtra: destPath.dmwExtra || ''
      },
      checklist: checklist,
      flowerExercise: flowerExercise,
      verify: VERIFY
    };
  }

  const HUB = {
    version: '1.0.0',
    title: 'Seeker PH Job Hub',
    official: OFFICIAL,
    verify: VERIFY,
    roles: roles,
    destinations: destinations,
    searches: searches,
    pathways: pathways,
    dmw: dmw,
    checklist: checklist,
    flowerExercise: flowerExercise,
    getCombo: getCombo,
    getRole: getRole,
    getDest: getDest
  };

  if (typeof module === 'object' && module.exports) {
    module.exports = HUB;
  }
  root.SEEKER_HUB = HUB;
})(typeof globalThis !== 'undefined' ? globalThis : this);
