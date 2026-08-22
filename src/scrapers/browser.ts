import { spawn, ChildProcess } from 'child_process';
import { chromium, Browser } from 'playwright-core';

export interface ObscuraConfig {
  chromiumArgs: string[];
  userAgent: string;
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
}

let browserInstance: Browser | null = null;
let obsProcessInstance: ChildProcess | null = null;

/**
 * Spawn obscura process and return config for Playwright
 * obscura acts as a CDP server that Playwright connects to
 */
export async function spawnObscura(obscuraPath?: string): Promise<{ browser: Browser; config: ObscuraConfig }> {
  const binPath = obscuraPath || process.env.OBSCURA_BIN_PATH || 'obscura';
  
  // Start obscura in serve mode with stealth
  // obscura serve -p 9222 (starts CDP server with stealth)
  const obsProcess: ChildProcess = spawn(binPath, ['serve', '-p', '9222', '-v'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for obscura to start (listen for CDP ready message)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('obscura failed to start within 10s'));
    }, 10000);

    obsProcess.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log(`[obscura] ${output.trim()}`);
      if (output.includes('Listening') || output.includes('9222') || output.includes('ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    obsProcess.stderr?.on('data', (data: Buffer) => {
      console.error(`[obscura stderr] ${data.toString().trim()}`);
    });

    obsProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start obscura: ${err.message}`));
    });
  });

  // Connect Playwright to obscura's CDP endpoint
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');

  const config: ObscuraConfig = {
    chromiumArgs: ['--stealth'],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  };

  return { browser, config };
}

/**
 * Get or create a shared browser instance.
 * Tries obscura first; falls back to plain Playwright if obscura is unavailable.
 */
export async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance;
  
  try {
    const { browser } = await spawnObscura();
    browserInstance = browser;
    return browser;
  } catch (err) {
    console.warn(`obscura not available (${err}). Falling back to plain Playwright.`);
    const browser = await chromium.launch({ headless: true });
    browserInstance = browser;
    return browser;
  }
}

/**
 * Close browser and obscura process
 */
export async function closeBrowser(browser: Browser, obsProcess?: ChildProcess): Promise<void> {
  await browser.close();
  if (obsProcess && !obsProcess.killed) {
    obsProcess.kill();
  }
}

/**
 * Check if obscura binary exists
 */
export function checkObscuraAvailable(obscuraPath?: string): boolean {
  const binPath = obscuraPath || process.env.OBSCURA_BIN_PATH || 'obscura';
  try {
    const { execSync } = require('child_process');
    execSync(`${binPath} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
