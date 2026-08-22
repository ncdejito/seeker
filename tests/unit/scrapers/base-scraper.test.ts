import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { BaseScraper } from '../../../src/scrapers/base-scraper'

describe('scrapers/base-scraper', () => {
  let scraper: BaseScraper

  beforeEach(() => {
    scraper = new BaseScraper('https://example.com')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('checkRobotsCompliance: allowed path returns true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('User-agent: *\nAllow: /jobs'),
    }) as any

    const result = await scraper.checkRobotsCompliance('/jobs')

    expect(result).toBe(true)
  })

  it('checkRobotsCompliance: disallowed path returns false and logs warning', async () => {
    const warnSpy = vi.spyOn(scraper['logger'], 'warn').mockImplementation(() => {})

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('User-agent: *\nDisallow: /jobs'),
    }) as any

    const result = await scraper.checkRobotsCompliance('/jobs')

    expect(result).toBe(false)
    expect(warnSpy).toHaveBeenCalled()
  })

  it('throttledRequest: delay within min-max range', async () => {
    const minDelay = 1000
    const maxDelay = 3000
    scraper['minDelay'] = minDelay
    scraper['maxDelay'] = maxDelay

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
      cb()
      return {} as any
    })

    await scraper['throttledRequest'](() => Promise.resolve('done'))

    const delay = setTimeoutSpy.mock.calls[0][1] as number
    expect(delay).toBeGreaterThanOrEqual(minDelay)
    expect(delay).toBeLessThanOrEqual(maxDelay)

    setTimeoutSpy.mockRestore()
  })

  it('extractPostDate throws Not implemented', () => {
    expect(() => scraper.extractPostDate('')).toThrow('Not implemented')
  })

  it('constructor sets baseUrl correctly', () => {
    const scraper = new BaseScraper('https://climatebase.org')

    expect(scraper['baseUrl']).toBe('https://climatebase.org')
  })
})
