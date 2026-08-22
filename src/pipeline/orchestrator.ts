import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createSemaphore } from '../utils/semaphore.js';
import { FlowerExercise } from '../flower/exercise.js';
import { FlowerAnswers, FlowerFilterCriteria } from '../flower/types.js';

export async function runPipeline(deps: {
  logger: { info: (msg: string) => void; warn: (msg: string) => void; error: (msg: string) => void; fatal: (msg: string) => void };
  config: { MAX_CONCURRENCY: number; OUTPUT_DIR: string; STATE_DIR: string };
  scrapers: any[];
  llmProvider: { complete: (system: string, user: string) => Promise<string> };
  flowerAnswers?: FlowerAnswers;
}) {
  const { logger, config, scrapers, llmProvider, flowerAnswers } = deps;
  const stateDir = config.STATE_DIR || 'state';
  const outputDir = config.OUTPUT_DIR || '.';

  const statusPath = join(stateDir, 'run_status.json');
  const adhocPath = join(stateDir, 'adhoc_links.json');

  let status: any = { status: 'idle', progress: 0, current_step: '' };
  try {
    status = JSON.parse(await readFile(statusPath, 'utf-8'));
  } catch {
    status = { status: 'idle', progress: 0, current_step: '' };
  }

  status.status = 'running';
  status.progress = 0;
  status.current_step = 'starting';
  status.run_started_at = new Date().toISOString();
  await writeFile(statusPath, JSON.stringify(status, null, 2));

  let adhocLinks: string[] = [];
  try {
    adhocLinks = JSON.parse(await readFile(adhocPath, 'utf-8'));
  } catch {
    adhocLinks = [];
  }

  await writeFile(adhocPath, JSON.stringify([]));

  const semaphore = createSemaphore(config.MAX_CONCURRENCY || 5);

  const flowerExercise = flowerAnswers
    ? new FlowerExercise(flowerAnswers)
    : null;

  const filterCriteria = flowerExercise
    ? flowerExercise.getFilterCriteria()
    : { keywords: [], location: undefined, workStyle: undefined, peoplePreference: undefined, conditions: undefined, purpose: undefined };

  logger.info(`Flower filter criteria: keywords=${filterCriteria.keywords.join(', ')}, location=${filterCriteria.location}, workStyle=${filterCriteria.workStyle}`);

  status.progress = 5;
  status.current_step = 'filtering jobs with flower criteria';
  await writeFile(statusPath, JSON.stringify(status, null, 2));

  const allUrls: string[] = [];

  const scraperTasks = scrapers.map(scraper => {
    return semaphore(async () => {
      try {
        logger.info(`Fetching jobs from ${scraper.constructor.name}`);
        const urls = await scraper.fetchListingUrls(10);
        logger.info(`${scraper.constructor.name} returned ${urls.length} job URLs`);
        allUrls.push(...urls);
      } catch (err: any) {
        logger.warn(`Error fetching from ${scraper.constructor.name}: ${err?.message || err}`);
      }
    });
  });

  await Promise.all(scraperTasks);

  status.progress = 15;
  status.current_step = 'found ' + allUrls.length + ' jobs';
  await writeFile(statusPath, JSON.stringify(status, null, 2));

  const dedupedUrls = [...new Set(allUrls)];

  status.progress = 20;
  status.current_step = 'scoring jobs with LLM';
  await writeFile(statusPath, JSON.stringify(status, null, 2));

  const semaphoreTasks = dedupedUrls.map(url =>
    semaphore(async () => {
      logger.info(`Processing: ${url}`);
    })
  );
  await Promise.all(semaphoreTasks);

  status.status = 'complete';
  status.progress = 100;
  status.current_step = 'done';
  status.last_completed_run = new Date().toISOString();
  await writeFile(statusPath, JSON.stringify(status, null, 2));

  logger.info('Pipeline run completed');
}