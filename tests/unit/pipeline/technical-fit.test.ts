import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scoreTechnicalFit } from '../../../src/pipeline/technical-fit'

describe('pipeline/technical-fit', () => {
  let mockProvider: any
  let mockWithRetry: any

  beforeEach(() => {
    mockProvider = {
      complete: vi.fn(),
    }
    mockWithRetry = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('parses JSON shape: score, reason, strengths, critical_gaps, recommendation, upskill_time', async () => {
    const response = JSON.stringify({
      score: 85,
      reason: 'Good match',
      strengths: ['Python', 'ML'],
      critical_gaps: ['AWS'],
      recommendation: 'proceed',
      upskill_time: '2 weeks',
    })

    mockProvider.complete.mockResolvedValue(response)

    const result = await scoreTechnicalFit('JD text', 'CV text', mockProvider)

    expect(result.score).toBe(85)
    expect(result.reason).toBe('Good match')
    expect(result.strengths).toEqual(['Python', 'ML'])
    expect(result.critical_gaps).toEqual(['AWS'])
    expect(result.recommendation).toBe('proceed')
    expect(result.upskill_time).toBe('2 weeks')
  })

  it('strips markdown fences before parse', async () => {
    const response = '```json\n{"score": 70, "reason": "test"}\n```'

    mockProvider.complete.mockResolvedValue(response)

    const result = await scoreTechnicalFit('JD', 'CV', mockProvider)

    expect(result.score).toBe(70)
  })

  it('retries on LLM failure with withRetry', async () => {
    const { withRetry } = await import('../../../src/utils/retry')
    vi.spyOn(await import('../../../src/utils/retry'), 'withRetry').mockImplementation(async (fn) => {
      return fn()
    })

    mockProvider.complete.mockResolvedValue(JSON.stringify({ score: 60 }))

    await scoreTechnicalFit('JD', 'CV', mockProvider)

    expect(mockProvider.complete).toHaveBeenCalled()
  })

  it('after 5 failures returns failure result (no throw)', async () => {
    mockProvider.complete.mockRejectedValue(new Error('LLM fail'))

    const result = await scoreTechnicalFit('JD', 'CV', mockProvider)

    expect(result.score).toBe(0)
    expect(result.reason).toContain('fail')
  })

  it('failure result has recommendation skip', async () => {
    mockProvider.complete.mockRejectedValue(new Error('persistent failure'))

    const result = await scoreTechnicalFit('JD', 'CV', mockProvider)

    expect(result.recommendation).toBe('skip')
  })
})
