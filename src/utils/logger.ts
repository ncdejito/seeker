import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogMethod {
  (message: string): Promise<void>;
}

export interface Logger {
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  fatal: LogMethod;
}

export function createLogger(logDir: string): Logger {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  const logFile = join(logDir, `run_${timestamp}.log`);

  async function ensureDir() {
    await mkdir(logDir, { recursive: true });
  }

  async function write(level: LogLevel, message: string): Promise<void> {
    await ensureDir();
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level}] ${message}\n`;
    await appendFile(logFile, line, { encoding: 'utf-8' });
  }

  return {
    async info(message: string) { await write('INFO', message); },
    async warn(message: string) { await write('WARN', message); },
    async error(message: string) { await write('ERROR', message); },
    async fatal(message: string) {
      process.stderr.write(`[FATAL] ${message}\n`);
      await write('FATAL', message);
    },
  };
}
