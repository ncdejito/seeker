import { describe, it, expect } from 'vitest'
import { dedupeJobs, normalizeJobUrl, titleCompanyKey } from '../../../src/digest/dedupe'
import { sampleJob } from './fixtures'

describe('digest/dedupe', () => {
  it('normalizes tracking query params and trailing slashes', () => {
    expect(normalizeJobUrl('https://WWW.Example.com/job/1/?utm_source=x&ref=y')).toBe(
      'https://example.com/job/1'
    )
  })

  it('drops a duplicate URL after normalization', () => {
    const a = sampleJob({ url: 'https://example.com/job/1?utm_source=eures', postedAt: '2026-10-01T00:00:00.000Z' })
    const b = sampleJob({
      id: 'other',
      url: 'https://www.example.com/job/1/',
      postedAt: '2026-10-10T00:00:00.000Z',
      snippet: 'Newer copy',
    })
    const out = dedupeJobs([a, b])
    expect(out).toHaveLength(1)
    expect(out[0].postedAt).toBe('2026-10-10T00:00:00.000Z')
  })

  it('drops the same title+company posted on two boards', () => {
    const a = sampleJob({ url: 'https://eures.example/a', source: 'EURES' })
    const b = sampleJob({
      id: 'arbeitnow:b',
      url: 'https://arbeitnow.example/b',
      source: 'Arbeitnow',
      postedAt: '2026-10-11T00:00:00.000Z',
    })
    expect(titleCompanyKey(a.title, a.company)).toBe(titleCompanyKey(b.title, b.company))
    const out = dedupeJobs([a, b])
    expect(out).toHaveLength(1)
    expect(out[0].source).toBe('Arbeitnow')
  })
})
