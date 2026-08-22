import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { mkdtemp, readFile, unlink, readdir, rmdir } from 'fs/promises'
import { tmpdir } from 'os'
import { createLogger, LogLevel } from '../../../src/utils/logger'

describe('utils/logger', () => {
  let tempDir: string
  let logFilePath: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))
  })

  afterEach(async () => {
    try {
      if (logFilePath) {
        await unlink(logFilePath).catch(() => {})
      }
      const files = await readdir(tempDir).catch(() => [])
      await Promise.all(files.map(f => unlink(join(tempDir, f)).catch(() => {})))
      await rmdir(tempDir).catch(() => {})
    } catch {
      // ignore cleanup errors
    }
  })

  it('creates log file with name pattern run_YYYY-MM-DD_HH-MM-SS.log', async () => {
    const logger = createLogger(tempDir)
    await logger.info('test message')

    const files = await readdir(tempDir)
    const logFile = files.find(f => /^run_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.log$/.test(f))

    expect(logFile).toBeDefined()
    logFilePath = join(tempDir, logFile!)
  })

  it('writes [TIMESTAMP] [LEVEL] message format', async () => {
    const logger = createLogger(tempDir)
    await logger.info('test message')

    const files = await readdir(tempDir)
    logFilePath = join(tempDir, files[0])

    const content = await readFile(logFilePath, 'utf-8')
    const lines = content.trim().split('\n')

    expect(lines[0]).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] test message$/)
  })

  it('fatal writes to stderr and log file', async () => {
    const stderrOutput: string[] = []
    const originalStderr = process.stderr.write
    process.stderr.write = ((chunk: string) => {
      stderrOutput.push(chunk)
      return true
    }) as typeof process.stderr.write

    const logger = createLogger(tempDir)
    await logger.fatal('fatal error message')

    const files = await readdir(tempDir)
    logFilePath = join(tempDir, files[0])

    const content = await readFile(logFilePath, 'utf-8')
    expect(content).toContain('[FATAL] fatal error message')

    const stderrText = stderrOutput.join('')
    expect(stderrText).toContain('[FATAL] fatal error message')

    process.stderr.write = originalStderr
  })

  it('writes warn level messages correctly', async () => {
    const logger = createLogger(tempDir)
    await logger.warn('warning message')

    const files = await readdir(tempDir)
    logFilePath = join(tempDir, files[0])

    const content = await readFile(logFilePath, 'utf-8')
    expect(content).toContain('[WARN] warning message')
  })

  it('writes error level messages correctly', async () => {
    const logger = createLogger(tempDir)
    await logger.error('error message')

    const files = await readdir(tempDir)
    logFilePath = join(tempDir, files[0])

    const content = await readFile(logFilePath, 'utf-8')
    expect(content).toContain('[ERROR] error message')
  })
})
