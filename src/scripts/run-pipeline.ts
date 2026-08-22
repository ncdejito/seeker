import 'dotenv/config';
import { loadConfig } from '../config/env';
import { createLogger } from '../utils/logger';
import { createProvider } from '../llm/provider';
import { runPipeline } from '../pipeline/orchestrator';

async function main() {
  const config = loadConfig();
  const logger = createLogger(config.OUTPUT_DIR || 'output');
  const llmProvider = createProvider();

  // Parse flower answers from environment if provided
  let flowerAnswers: any = undefined;
  const part1 = process.env.FLOWER_PART1;
  const part2 = process.env.FLOWER_PART2;
  const part3 = process.env.FLOWER_PART3;
  const part4 = process.env.FLOWER_PART4;
  const part5 = process.env.FLOWER_PART5;
  const part6 = process.env.FLOWER_PART6;
  const part7 = process.env.FLOWER_PART7;

  if (part1 || part2 || part3 || part4 || part5 || part6 || part7) {
    flowerAnswers = {
      part1: part1 || '',
      part2: part2 || '',
      part3: part3 || '',
      part4: part4 || '',
      part5: part5 || '',
      part6: part6 || '',
      part7: part7 || '',
    };
    logger.info('Flower exercise answers loaded from environment');
  }

  try {
    await runPipeline({
      logger,
      config: {
        MAX_CONCURRENCY: config.MAX_CONCURRENCY,
        OUTPUT_DIR: config.OUTPUT_DIR || 'output',
        STATE_DIR: config.STATE_DIR || 'state',
      },
      scrapers: [],
      llmProvider,
      flowerAnswers,
    });
    logger.info('Pipeline run completed successfully');
  } catch (err: any) {
    logger.fatal(`Pipeline run failed: ${err?.message || err}`);
    process.exit(1);
  }
}

main();