import { describe, it, expect } from 'vitest'
import { ClimatebaseScraper } from '../../../src/scrapers/sites/climatebase'

describe('scrapers/climatebase', () => {
  it('constructs without throwing', () => {
    expect(() => new ClimatebaseScraper()).not.toThrow()
  })

  it('has correct baseUrl', () => {
    const scraper = new ClimatebaseScraper()
    expect((scraper as any).baseUrl).toBe('https://climatebase.org')
  })

  it('fetchListingUrls throws ClimateBase blocked error', async () => {
    const scraper = new ClimatebaseScraper()
    await expect(scraper.fetchListingUrls(1)).rejects.toThrow('ClimateBase blocked')
  })

  it('fetchJobDescription throws ClimateBase blocked error', async () => {
    const scraper = new ClimatebaseScraper()
    await expect(scraper.fetchJobDescription('https://climatebase.org/test')).rejects.toThrow('ClimateBase blocked')
  })

  it('extractCompanyName throws ClimateBase blocked error', async () => {
    const scraper = new ClimatebaseScraper()
    await expect(scraper.extractCompanyName('', '')).rejects.toThrow('ClimateBase blocked')
  })
})
