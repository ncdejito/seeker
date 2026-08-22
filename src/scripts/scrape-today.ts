import { HiringCafeScraper } from '../scrapers/sites/hiring-cafe.js';
import { EURESScraper } from '../scrapers/sites/eures.js';
import { WorkInFinlandScraper } from '../scrapers/sites/work-in-finland.js';
import { writeCSV, JobRecord } from '../pipeline/csv-writer.js';

async function main() {
  console.log('Starting job scraper (3 sources: Hiring Cafe, EURES, Work in Finland)...');

  const allJobs: JobRecord[] = [];

  // Hiring Cafe
  try {
    console.log('\nScraping Hiring Cafe...');
    const hiringCafe = new HiringCafeScraper();
    const urls = await hiringCafe.fetchListingUrls(1);
    console.log(`Found ${urls.length} job links on Hiring Cafe`);

    for (const url of urls) {
      const description = await hiringCafe.fetchJobDescription(url);
      const lines = description.split('\n');
      allJobs.push({
        job_title: lines[0]?.replace('Title: ', '') || '',
        company: lines[1]?.replace('Company: ', '') || '',
      });
      console.log(`  - ${lines[0]}`);
    }
  } catch (err) {
    console.error('Error scraping Hiring Cafe:', err);
  }

  // EURES
  try {
    console.log('\nScraping EURES...');
    const eures = new EURESScraper();
    const urls = await eures.fetchListingUrls(1);
    console.log(`Found ${urls.length} potential jobs on EURES`);

    for (const url of urls) {
      allJobs.push({
        job_title: `Job listing from EURES`,
        company: '',
      });
    }
  } catch (err) {
    console.error('Error scraping EURES:', err);
  }

  // Work in Finland
  try {
    console.log('\nScraping Work in Finland...');
    const workInFinland = new WorkInFinlandScraper();
    const urls = await workInFinland.fetchListingUrls(1);
    console.log(`Found ${urls.length} job links on Work in Finland`);

    for (const url of urls) {
      const description = await workInFinland.fetchJobDescription(url);
      const lines = description.split('\n');
      allJobs.push({
        job_title: lines[0]?.replace('Title: ', '') || '',
        company: lines[1]?.replace('Company: ', '') || '',
      });
      console.log(`  - ${lines[0]}`);
    }
  } catch (err) {
    console.error('Error scraping Work in Finland:', err);
  }

  // Write to CSV
  if (allJobs.length > 0) {
    await writeCSV(allJobs);
  } else {
    console.log('No jobs found. Check selectors and site availability.');
  }

  console.log(`\nTotal jobs scraped: ${allJobs.length}`);
}

main().catch(console.error);
