import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { HiringCafeScraper } from '../scrapers/sites/hiring-cafe.js';
import { EURESScraper } from '../scrapers/sites/eures.js';
import { WorkInFinlandScraper } from '../scrapers/sites/work-in-finland.js';
import { AdzunaAUScraper } from '../scrapers/sites/adzuna-au.js';
import { BaseScraper } from '../scrapers/base-scraper.js';
import { writeCSV, JobRecord } from '../pipeline/csv-writer.js';

const SOURCES: { name: string; scraper: BaseScraper }[] = [
  { name: 'Hiring Cafe', scraper: new HiringCafeScraper() },
  { name: 'EURES', scraper: new EURESScraper() },
  { name: 'Work in Finland', scraper: new WorkInFinlandScraper() },
  { name: 'Adzuna AU', scraper: new AdzunaAUScraper() },
];

interface Preferences {
  role_keywords?: string;
  excluded_levels?: string[];
}

function loadPreferences(): Preferences {
  const stateDir = process.env.STATE_DIR || 'state';
  try {
    return JSON.parse(readFileSync(join(stateDir, 'preferences.json'), 'utf-8'));
  } catch {
    console.warn('No state/preferences.json found (cp state/preferences.example.json state/preferences.json) — skipping seniority/level filtering.');
    return {};
  }
}

function isExcluded(title: string, excludedLevels: string[]): boolean {
  const words = title.toLowerCase().split(/\W+/);
  return excludedLevels.some(level => words.includes(level.toLowerCase()));
}

async function main() {
  console.log(`Starting job scraper (${SOURCES.length} sources: ${SOURCES.map(s => s.name).join(', ')})...`);

  const preferences = loadPreferences();
  const excludedLevels = preferences.excluded_levels || [];

  const allJobs: JobRecord[] = [];
  let excludedCount = 0;

  for (const { name, scraper } of SOURCES) {
    try {
      console.log(`\nScraping ${name}...`);
      const urls = await scraper.fetchListingUrls(1);
      console.log(`Found ${urls.length} job links on ${name}`);

      for (const url of urls) {
        const description = await scraper.fetchJobDescription(url);
        const lines = description.split('\n');
        const job_title = lines[0]?.replace('Title: ', '') || '';
        const company = lines[1]?.replace('Company: ', '') || '';
        const location = lines[2]?.replace('Location: ', '') || '';

        if (isExcluded(job_title, excludedLevels)) {
          console.log(`  - [excluded: seniority] ${job_title}`);
          excludedCount++;
          continue;
        }

        allJobs.push({ job_title, company, location, job_url: url, source: name });
        console.log(`  - ${job_title}`);
      }
    } catch (err) {
      console.error(`Error scraping ${name}:`, err);
    }
  }

  if (allJobs.length > 0) {
    const outFile = await writeCSV(allJobs, process.env.OUTPUT_DIR);
    console.log(`\nWrote ${outFile}`);
  } else {
    console.log('No jobs found. Check selectors and site availability.');
  }

  console.log(`Total jobs kept: ${allJobs.length} (excluded ${excludedCount} by preferences.json excluded_levels)`);
}

main().catch(console.error);
