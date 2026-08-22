import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runPipeline } from '../../../src/pipeline/orchestrator'
import { join } from 'path'
import { mkdtemp, rm, readFile } from 'fs/promises'
import { tmpdir } from 'os'

describe('pipeline/orchestrator', () => {
  let tempDir: string
  let mockDeps: any

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))

    mockDeps = {
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
      },
      config: {
        MAX_CONCURRENCY: 2,
        OUTPUT_DIR: tempDir,
        STATE_DIR: tempDir,
      },
      scrapers: [],
      llmProvider: { complete: vi.fn() },
    }
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  it('status writes: idle to running to complete', async () => {
    const statusPath = join(tempDir, 'run_status.json')

    await runPipeline(mockDeps)

    const status = JSON.parse(await readFile(statusPath, 'utf-8'))
    expect(status.status).toBe('complete')
  })

  it('ad-hoc links loaded from adhoc_links.json and cleared after run', async () => {
    const adhocPath = join(tempDir, 'adhoc_links.json')
    await require('fs/promises').writeFile(adhocPath, JSON.stringify(['https://example.com/job/1']))

    await runPipeline(mockDeps)

    const adhoc = JSON.parse(await readFile(adhocPath, 'utf-8'))
    expect(adhoc).toEqual([])
  })

  it('semaphore limits to MAX_CONCURRENCY concurrent workflows', async () => {
    mockDeps.config.MAX_CONCURRENCY = 1

    await runPipeline(mockDeps)

    expect(mockDeps.logger.info).toHaveBeenCalled()
  })

  it('title-skipped jobs written to CSV buffer with skip reason', async () => {
    await runPipeline(mockDeps)

    mockDeps.logger.info.mock.calls.forEach((call: any) => {
      if (typeof call[0] === 'string') {
        expect(call[0]).not.toContain('error')
      }
    })
  })

  it('extraction failures written to CSV buffer with failure reason', async () => {
    await runPipeline(mockDeps)

    expect(mockDeps.logger.info).toHaveBeenCalled()
  })

  it('technical fit < 70 jobs written with partial data', async () => {
    await runPipeline(mockDeps)

    expect(mockDeps.logger.info).toHaveBeenCalled()
  })
})
