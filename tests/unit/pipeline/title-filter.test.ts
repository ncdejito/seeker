import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { filterByTitle } from '../../../src/pipeline/title-filter'

describe('pipeline/title-filter', () => {
  let mockProvider: any

  beforeEach(() => {
    mockProvider = {
      complete: vi.fn(),
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('score >= 40 returns skip: false', async () => {
    mockProvider.complete.mockResolvedValue(JSON.stringify({ score: 75 }))

    const result = await filterByTitle('Python Engineer', 'engineer,python', mockProvider)

    expect(result.skip).toBe(false)
  })

  it('score < 40 returns skip: true with reason', async () => {
    mockProvider.complete.mockResolvedValue(JSON.stringify({ score: 25 }))

    const result = await filterByTitle('Sales Manager', 'engineer,python', mockProvider)

    expect(result.skip).toBe(true)
    expect(result.skipReason).toContain('low title fit (score: 25)')
  })

  it('LLM response with markdown fences still parses correctly', async () => {
    mockProvider.complete.mockResolvedValue('```json\n{"score": 50}\n```')

    const result = await filterByTitle('Developer', 'developer', mockProvider)

    expect(result.skip).toBe(false)
  })

  it('handles LLM returning only score field', async () => {
    mockProvider.complete.mockResolvedValue(JSON.stringify({ score: 40 }))

    const result = await filterByTitle('ML Engineer', 'ml,engineer', mockProvider)

    expect(result.skip).toBe(false)
  })

  it('returns skip: true when LLM returns malformed JSON', async () => {
    mockProvider.complete.mockResolvedValue('not json')

    const result = await filterByTitle('Test Title', 'test', mockProvider)

    expect(result.skip).toBe(true)
    expect(result.skipReason).toBeDefined()
  })
})
