import { describe, it, expect } from 'vitest'
import { capPerGroup, classifyListing, detectEligibility, matchDestination, matchRole } from '../../../src/digest/filter'
import { rawListings, sampleConfig, sampleJob } from './fixtures'

describe('digest/filter', () => {
  it('matches data engineer titles and skips unrelated engineer titles', () => {
    expect(matchRole('Senior Data Engineer', '', sampleConfig.roles)?.id).toBe('data-engineer')
    expect(matchRole('Software Engineer', '', sampleConfig.roles)).toBeNull()
  })

  it('matches full-stack variants and Spanish civil engineer titles', () => {
    expect(matchRole('Fullstack Developer', '', sampleConfig.roles)?.id).toBe('full-stack-engineer')
    expect(matchRole('Ingeniero Civil', '', sampleConfig.roles)?.id).toBe('civil-engineer')
  })

  it('excludes product designer from the product manager role', () => {
    expect(matchRole('Product Designer', 'Figma', sampleConfig.roles)).toBeNull()
    expect(matchRole('Product Manager', '', sampleConfig.roles)?.id).toBe('product-manager')
  })

  it('classifies Spain, Australia, EU, and remote destinations', () => {
    expect(matchDestination(rawListings[3], sampleConfig.destinations)?.id).toBe('spain')
    expect(matchDestination(rawListings[4], sampleConfig.destinations)?.id).toBe('australia')
    expect(matchDestination(rawListings[0], sampleConfig.destinations)?.id).toBe('eu')
    expect(matchDestination(rawListings[2], sampleConfig.destinations)?.id).toBe('remote')
  })

  it('flags visa sponsorship and worldwide remote from listing text', () => {
    expect(detectEligibility(rawListings[0]).flag).toBe('visa-sponsorship')
    expect(detectEligibility(rawListings[2]).flag).toBe('worldwide-remote')
  })

  it('drops jobs older than maxAgeDays', () => {
    const now = new Date('2026-10-13T00:00:00.000Z')
    const old = { ...rawListings[0], postedAt: '2026-08-01T00:00:00.000Z' }
    expect(classifyListing(old, sampleConfig, now)).toBeNull()
  })

  it('classifies a matching listing into role + destination + eligibility', () => {
    const now = new Date('2026-10-13T00:00:00.000Z')
    const job = classifyListing(rawListings[0], sampleConfig, now)
    expect(job?.roleId).toBe('data-engineer')
    expect(job?.destinationId).toBe('eu')
    expect(job?.eligibility).toBe('visa-sponsorship')
  })

  it('does not classify a product designer as a digest job', () => {
    const now = new Date('2026-10-13T00:00:00.000Z')
    expect(classifyListing(rawListings[1], sampleConfig, now)).toBeNull()
  })

  it('caps jobs per role and destination', () => {
    const jobs = Array.from({ length: 5 }, (_, i) =>
      sampleJob({ id: `j${i}`, url: `https://example.com/${i}` })
    )
    expect(capPerGroup(jobs, 2)).toHaveLength(2)
  })
})
