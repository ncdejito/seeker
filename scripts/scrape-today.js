import { chromium } from 'playwright';
import csvWriter from 'csv-writer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, '..', 'output');
const OUTPUT_FILE = join(OUTPUT_DIR, `jobs_today_${new Date().toISOString().split('T')[0]}.csv`);
const MAX_JOBS_PER_SITE = 2;

const csv = csvWriter.createObjectCsvWriter({
  path: OUTPUT_FILE,
  header: [
    { id: 'date', title: 'date' },
    { id: 'job_url', title: 'job_url' },
    { id: 'job_title', title: 'job_title' },
    { id: 'company', title: 'company' },
    { id: 'location', title: 'location' },
    { id: 'source', title: 'source' },
  ],
});

async function scrapeHiringCafe(page) {
  const jobs = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Scraping Hiring Cafe with filters...');
    
    const searchState = {
      seniorityLevel: ["Mid Level", "Senior Level"],
      roleTypes: ["Individual Contributor"],
      dateFetchedPastNDays: 2,
      locations: [
        {"id":"ZhY1yZQBoEtHp_8UEq3V","types":["country"],"address_components":[{"long_name":"Germany","short_name":"DE","types":["country"]}],"formatted_address":"Germany","population":82927922,"workplace_types":[],"options":{"flexible_regions":["anywhere_in_continent","anywhere_in_world"]}}
      ],
      jobTitleQuery: "(\"ai\" OR \"ml\") AND \"engineer\"",
      excludedCompanyKeywords: ["defense"]
    };
    
    const url = `https://hiring.cafe/?searchState=${encodeURIComponent(JSON.stringify(searchState))}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    const jobLinks = await page.$$eval('a[href*="/viewjob/"]', (links) => {
      return links
        .filter(a => !a.textContent?.includes('View all'))
        .slice(0, 10)
        .map(a => a.href);
    });
    
    console.log(`Found ${jobLinks.length} job links on Hiring Cafe`);

    for (const jobUrl of jobLinks) {
      try {
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const jobData = await page.evaluate(() => {
          const title = document.querySelector('h1')?.textContent?.trim() || 
                      document.querySelector('h2')?.textContent?.trim() || '';
          const company = document.querySelector('[class*="company"]')?.textContent?.trim() || '';
          const location = document.querySelector('[class*="location"]')?.textContent?.trim() || '';
          return { title, company, location };
        });
        
        if (jobData.title) {
          jobs.push({
            date: today,
            job_url: jobUrl,
            job_title: jobData.title,
            company: jobData.company || '',
            location: jobData.location || '',
            source: 'hiring_cafe',
          });
          console.log(`  - ${jobData.title}`);
        }
      } catch (err) {
        console.error(`Error visiting ${jobUrl}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error scraping Hiring Cafe:', err.message);
  }

  return jobs;
}

async function scrapeClimateBase(page) {
  const jobs = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Scraping Climate Base with filters...');
    
    // Use the main jobs page without filters first
    const url = 'https://climatebase.org/jobs';
    console.log('Climate Base URL:', url);
    
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(8000);

    const jobCards = await page.$$('[class*="sc-9e90a453-1"]');
    console.log(`Found ${jobCards.length} job cards on Climate Base`);
    
    const cardsToProcess = jobCards.slice(0, MAX_JOBS_PER_SITE);
    
    for (const card of cardsToProcess) {
      try {
        const jobData = await page.evaluate((card) => {
          const getText = (sel) => card.querySelector(sel)?.textContent?.trim() || '';
          
          const title = getText('h2[data-testid="card-title"]') || getText('h2') || '';
          
          const lis = Array.from(card.querySelectorAll('li'));
          let company = '', location = '';
          
          for (const li of lis) {
            const text = li.textContent?.trim() || '';
            if (text.includes('Remote') || text.includes('Hybrid') || text.includes('Onsite') || 
                text.includes('In-person')) {
              if (!location) location = text;
            } else if (!company && text && !text.match(/^(Full|Part|Contract|Internship)/)) {
              company = text;
            }
          }
          
          const link = card.closest('a') || card.querySelector('a');
          const url = link?.href || '';
          
          return { title, company, location, url };
        }, card);
        
        if (jobData.title && jobData.title.length > 3) {
          jobs.push({
            date: today,
            job_url: jobData.url || 'https://climatebase.org/jobs',
            job_title: jobData.title,
            company: jobData.company || '',
            location: jobData.location || '',
            source: 'climate_base',
          });
          console.log(`  - ${jobData.title} at ${jobData.company}`);
        }
      } catch (err) {
        console.error('Error extracting job from Climate Base:', err.message);
      }
    }
  } catch (err) {
    console.error('Error scraping Climate Base:', err.message);
  }

  return jobs;
}

async function scrapeEURES(page) {
  const jobs = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Scraping EURES...');
    const url = 'https://europa.eu/eures/portal/jv-se/search?page=1&resultsPerPage=10&orderBy=BEST_MATCH&keywordsEverywhere=ai&publicationPeriod=LAST_DAY&lang=en';

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for Angular app to load
    await page.waitForTimeout(15000);

    // Accept cookies if dialog appears
    await page.locator('button:has-text("Accept all"), button:has-text("Accept"), [data-testid*="accept"]').first().click().catch(() => {});
    await page.waitForTimeout(3000);

    // Extract text content from the page and look for job-like entries
    const pageText = await page.evaluate(() => {
      // Get all text nodes that might contain job titles
      const walk = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      const texts = [];
      let node;
      while (node = walk.nextNode()) {
        const text = node.textContent?.trim();
        if (text && text.length > 15 && text.length < 150) {
          texts.push(text);
        }
      }
      return texts;
    });

    // Filter for job-related text
    const jobTitles = pageText.filter(text => {
      const lower = text.toLowerCase();
      return (lower.includes('engineer') || lower.includes('developer') || lower.includes('scientist') ||
              lower.includes('analyst') || lower.includes('specialist') || lower.includes('manager')) &&
              !lower.includes('cookie') && !lower.includes('search') && !lower.includes('login') &&
              !lower.includes('europa') && !lower.includes('portal');
    });

    console.log(`Found ${jobTitles.length} potential job titles on EURES`);

    for (let i = 0; i < Math.min(jobTitles.length, MAX_JOBS_PER_SITE); i++) {
      const title = jobTitles[i];
      if (title && title.length > 10) {
        jobs.push({
          date: today,
          job_url: url,
          job_title: title.trim(),
          company: '',
          location: '',
          source: 'eures',
        });
        console.log(`  - ${title.trim()}`);
      }
    }

    if (jobs.length === 0) {
      console.log('No job listings found on EURES - site uses complex JS rendering');
    }
  } catch (err) {
    console.error('Error scraping EURES:', err.message);
  }

  return jobs;
}

async function scrapeWorkInFinland(page) {
  const jobs = [];
  const today = new Date().toISOString().split('T')[0];

  try {
    console.log('Scraping Work in Finland...');
    const url = 'https://www.workinfinland.com/en/open-jobs/?category=deep-tech%2Csoftware-development&query=ai';
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(8000);

    const jobLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="job"]'));
      return links
        .filter(a => {
          const text = a.textContent?.toLowerCase() || '';
          return a.href.includes('/job/') &&
                 !text.includes('cookie') &&
                 !text.includes('find a job') &&
                 text.length > 5;
        })
        .slice(0, 10)
        .map(a => a.href);
    });

    console.log(`Found ${jobLinks.length} job links on Work in Finland`);

    for (const jobUrl of jobLinks.slice(0, MAX_JOBS_PER_SITE)) {
      try {
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(3000);

        const jobData = await page.evaluate(() => {
          const title = document.querySelector('h1')?.textContent?.trim() ||
                      document.querySelector('[class*="title"]')?.textContent?.trim() ||
                      document.querySelector('h2')?.textContent?.trim() || '';
          const company = document.querySelector('[class*="employer"]')?.textContent?.trim() ||
                         document.querySelector('[class*="company"]')?.textContent?.trim() ||
                         document.querySelector('[class*="organisation"]')?.textContent?.trim() || '';
          const location = document.querySelector('[class*="location"]')?.textContent?.trim() ||
                          document.querySelector('[class*="city"]')?.textContent?.trim() || '';
          return { title, company, location };
        });

        if (jobData.title && jobData.title.length > 5) {
          jobs.push({
            date: today,
            job_url: jobUrl,
            job_title: jobData.title,
            company: jobData.company || '',
            location: jobData.location || '',
            source: 'work_in_finland',
          });
          console.log(`  - ${jobData.title}`);
        }
      } catch (err) {
        console.error(`Error visiting ${jobUrl}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error scraping Work in Finland:', err.message);
  }

  return jobs;
}

async function main() {
  console.log('Starting job scraper (4 sources: Hiring Cafe, Climate Base, EURES, Work in Finland)...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const hiringCafeJobs = await scrapeHiringCafe(page);
    console.log(`Scraped ${hiringCafeJobs.length} jobs from Hiring Cafe`);

    const climateBaseJobs = await scrapeClimateBase(page);
    console.log(`Scraped ${climateBaseJobs.length} jobs from Climate Base`);

    const euresJobs = await scrapeEURES(page);
    console.log(`Scraped ${euresJobs.length} jobs from EURES`);

    const workInFinlandJobs = await scrapeWorkInFinland(page);
    console.log(`Scraped ${workInFinlandJobs.length} jobs from Work in Finland`);

    const allJobs = [...hiringCafeJobs, ...climateBaseJobs, ...euresJobs, ...workInFinlandJobs];

    if (allJobs.length > 0) {
      await csv.writeRecords(allJobs);
      console.log(`Successfully wrote ${allJobs.length} jobs to ${OUTPUT_FILE}`);
    } else {
      console.log('No jobs found. Check selectors and site availability.');
    }
  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
