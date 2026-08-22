import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EURESScraper } from '../../../src/scrapers/sites/eures'

const mockPage = vi.hoisted(() => ({
  goto: vi.fn().mockResolvedValue(undefined),
  waitForTimeout: vi.fn().mockResolvedValue(undefined),
  $$eval: vi.fn().mockResolvedValue([]),
  evaluate: vi.fn().mockResolvedValue({ title: '', company: '', location: '' }),
  content: vi.fn().mockResolvedValue(''),
  close: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../src/scrapers/browser', () => ({
  getBrowser: vi.fn().mockResolvedValue({
    contexts: vi.fn().mockReturnValue([]),
    newContext: vi.fn().mockResolvedValue({
      pages: vi.fn().mockReturnValue([]),
      newPage: vi.fn().mockResolvedValue(mockPage),
    })
  })
}))

describe('scrapers/eures', () => {
  let scraper: EURESScraper

  beforeEach(() => {
    scraper = new EURESScraper()
    vi.spyOn(scraper, 'checkRobotsCompliance').mockResolvedValue(true)
    vi.spyOn(scraper, 'throttledRequest').mockImplementation((fn: any) => fn())
    vi.spyOn(global, 'setTimeout').mockImplementation((fn: any) => fn())
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should be defined', () => {
    expect(scraper).toBeDefined()
  })

  it('should have correct baseUrl', () => {
    expect(scraper['baseUrl']).toBe('https://europa.eu')
  })

  it('extractCompanyName parses from formatted description', async () => {
    const result = await scraper.extractCompanyName('', 'Company: Acme Corp')
    expect(result).toBe('Acme Corp')
  })

  it('extractCompanyName returns null when no match', async () => {
    const result = await scraper.extractCompanyName('', '')
    expect(result).toBeNull()
  })

  it('fetchListingUrls extracts job links via browser', async () => {
    const fakeUrls = [
      'https://europa.eu/eures/portal/jv-se/jv-details/123',
      'https://europa.eu/eures/portal/jv-se/jv-details/456',
    ]
    mockPage.$$eval.mockResolvedValueOnce(fakeUrls)

    const urls = await scraper.fetchListingUrls(1)

    expect(mockPage.goto).toHaveBeenCalledOnce()
    expect(mockPage.goto).toHaveBeenCalledWith(
      expect.stringContaining('europa.eu/eures/portal/jv-se/search'),
      expect.objectContaining({ waitUntil: 'networkidle' })
    )
    expect(mockPage.$$eval).toHaveBeenCalledWith(
      'a[href*="/jv-se/jv-details/"]',
      expect.any(Function)
    )
    expect(urls).toEqual(fakeUrls)
  })

  it('fetchListingUrls returns empty array on error', async () => {
    mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'))
    const urls = await scraper.fetchListingUrls(1)
    expect(urls).toEqual([])
  })

  it('fetchJobDescription extracts job details via browser', async () => {
    mockPage.evaluate.mockResolvedValueOnce({
      title: 'AI Engineer',
      company: 'Acme Corp',
      location: 'Berlin',
    })

    const description = await scraper.fetchJobDescription('https://europa.eu/job/1')

    expect(mockPage.goto).toHaveBeenCalledWith(
      'https://europa.eu/job/1',
      expect.objectContaining({ waitUntil: 'networkidle' })
    )
    expect(mockPage.evaluate).toHaveBeenCalledOnce()
    expect(description).toBe('Title: AI Engineer\nCompany: Acme Corp\nLocation: Berlin')
  })

  it('fetchJobDescription returns empty string on error', async () => {
    mockPage.goto.mockRejectedValueOnce(new Error('Navigation failed'))
    const description = await scraper.fetchJobDescription('https://europa.eu/job/1')
    expect(description).toBe('')
  })
})
