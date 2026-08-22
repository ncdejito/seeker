import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scoreAspirationalFit } from '../../../src/pipeline/aspirational-fit'

describe('pipeline/aspirational-fit', () => {
  let mockProvider: any

  beforeEach(() => {
    mockProvider = {
      complete: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses JSON shape with dimensions object', async () => {
    const response = JSON.stringify({
      dimensions: {
        salary: 4,
        growth: 5,
        stability: 3,
        mission: 4,
        learning: 5,
      },
      overall: 4.2,
    })

    mockProvider.complete.mockResolvedValue(response)

    const result = await scoreAspirationalFit('Job Description', mockProvider)

    expect(result.dimensions).toBeDefined()
    expect(result.dimensions.salary).toBe(4)
    expect(result.overall).toBe(4.2)
  })

  it('JD without salary mention sets dimensions.salary = 2', async () => {
    const response = JSON.stringify({
      dimensions: {
        growth: 5,
        stability: 3,
        mission: 4,
        learning: 5,
      },
      overall: 4,
    })

    mockProvider.complete.mockResolvedValue(response)

    const result = await scoreAspirationalFit('Looking for engineer with Python', mockProvider)

    expect(result.dimensions.salary).toBe(2)
  })

  it('fetchGlassdoorRating stub exists but is NOT called during scoreAspirationalFit', async () => {
    const { fetchGlassdoorRating } = await import('../../../src/pipeline/aspirational-fit')
    const glassdoorSpy = vi.spyOn(await import('../../../src/pipeline/aspirational-fit'), 'fetchGlassdoorRating')

    mockProvider.complete.mockResolvedValue(JSON.stringify({
      dimensions: { salary: 3, growth: 4 },
      overall: 3.5,
    }))

    await scoreAspirationalFit('JD text', mockProvider)

    expect(glassdoorSpy).not.toHaveBeenCalled()
  })

  it('returns default dimensions when LLM fails', async () => {
    mockProvider.complete.mockRejectedValue(new Error('LLM error'))

    const result = await scoreAspirationalFit('JD', mockProvider)

    expect(result.dimensions).toBeDefined()
    expect(result.overall).toBeDefined()
  })
})
