import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WorkInFinlandScraper } from '../../../src/scrapers/sites/work-in-finland'

vi.mock('../../../src/scrapers/browser', () => ({
  getBrowser: vi.fn().mockResolvedValue({
    contexts: vi.fn().mockReturnValue([]),
    newContext: vi.fn().mockResolvedValue({
      pages: vi.fn().mockReturnValue([]),
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(undefined),
        waitForTimeout: vi.fn().mockResolvedValue(undefined),
        $$eval: vi.fn().mockResolvedValue([]),
        evaluate: vi.fn().mockResolvedValue({ title: '', company: '', location: '' }),
        content: vi.fn().mockResolvedValue(''),
        close: vi.fn().mockResolvedValue(undefined),
      })
    })
  })
}))

describe('scrapers/work-in-finland', () => {
  let scraper: WorkInFinlandScraper

  beforeEach(() => {
    scraper = new WorkInFinlandScraper()
    vi.spyOn(scraper, 'checkRobotsCompliance').mockResolvedValue(true)
    vi.spyOn(scraper, 'throttledRequest').mockImplementation((fn: any) => fn())
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(scraper).toBeDefined()
  })

  it('should have correct baseUrl', () => {
    expect(scraper['baseUrl']).toBe('https://www.workinfinland.com')
  })

  it('extractCompanyName returns null or string', async () => {
    const result = await scraper.extractCompanyName('', '')
    expect(result === null || typeof result === 'string').toBe(true)
  })

  it('fetchListingUrls returns array', async () => {
    const urls = await scraper.fetchListingUrls(1)
    expect(urls).toBeInstanceOf(Array)
  })

  it('fetchJobDescription returns string', async () => {
    const description = await scraper.fetchJobDescription('https://workinfinland.com/test')
    expect(typeof description).toBe('string')
  })
})
