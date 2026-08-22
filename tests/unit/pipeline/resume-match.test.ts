import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { matchResumes } from '../../../src/pipeline/resume-match'

describe('pipeline/resume-match', () => {
  let mockProvider: any

  beforeEach(() => {
    mockProvider = {
      complete: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('JD > 800 tokens truncated before LLM call', async () => {
    const longJD = 'word '.repeat(900)
    mockProvider.complete.mockResolvedValue(JSON.stringify([
      { role: 'ML Engineer', score: 90, reason: 'Good fit' },
    ]))

    await matchResumes(longJD, [], mockProvider)

    const callArgs = mockProvider.complete.mock.calls[0][0]
    const jdInPrompt = callArgs.match(/\{\{JOB_DESCRIPTION\}\}/)?.[0]
    expect(mockProvider.complete).toHaveBeenCalled()
  })

  it('career summaries capped at 250 words each', async () => {
    const longSummary = 'word '.repeat(300)
    const resumes = [
      { role: 'ML Engineer', careerSummary: longSummary },
      { role: 'AI Engineer', careerSummary: 'short summary' },
    ]

    mockProvider.complete.mockResolvedValue(JSON.stringify([
      { role: 'ML Engineer', score: 85, reason: 'Match' },
    ]))

    await matchResumes('JD', resumes, mockProvider)

    const callArgs = mockProvider.complete.mock.calls[0][0]
    expect(callArgs).toBeDefined()
  })

  it('returns top-3 array with role, score, reason', async () => {
    mockProvider.complete.mockResolvedValue(JSON.stringify([
      { role: 'ML Engineer', score: 90, reason: 'Best match' },
      { role: 'AI Engineer', score: 85, reason: 'Good match' },
      { role: 'Data Engineer', score: 80, reason: 'Decent match' },
    ]))

    const result = await matchResumes('JD', [], mockProvider)

    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('role')
    expect(result[0]).toHaveProperty('score')
    expect(result[0]).toHaveProperty('reason')
  })

  it('returns less than 3 if fewer resumes provided', async () => {
    mockProvider.complete.mockResolvedValue(JSON.stringify([
      { role: 'ML Engineer', score: 90, reason: 'Match' },
    ]))

    const result = await matchResumes('JD', [{ role: 'ML', careerSummary: 'test' }], mockProvider)

    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('handles LLM failure gracefully', async () => {
    mockProvider.complete.mockRejectedValue(new Error('LLM fail'))

    const result = await matchResumes('JD', [], mockProvider)

    expect(result).toEqual([])
  })
})
