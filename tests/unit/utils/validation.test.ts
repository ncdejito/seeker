import { describe, it, expect, beforeEach } from 'vitest'
import { validateJobDescription } from '../../../src/utils/validation'

describe('utils/validation', () => {
  let config: { MIN_CHAR_LENGTH: number; ROLE_KEYWORDS: string }

  beforeEach(() => {
    config = {
      MIN_CHAR_LENGTH: 100,
      ROLE_KEYWORDS: 'engineer,developer,python,machine learning',
    }
  })

  it('text below minCharLength returns valid false with reason', () => {
    const shortText = 'Short'

    const result = validateJobDescription(shortText, config)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('minCharLength')
  })

  it('no keyword matches returns valid false with reason', () => {
    const text = 'We are looking for a sales representative with marketing experience.'

    const result = validateJobDescription(text, config)

    expect(result.valid).toBe(false)
    expect(result.reason).toContain('keyword')
  })

  it('meets both length and keyword requirements returns valid true', () => {
    const text = 'We are hiring a Python engineer with machine learning experience. '.repeat(10)

    const result = validateJobDescription(text, config)

    expect(result.valid).toBe(true)
  })

  it('text exactly at minCharLength with keywords returns valid true', () => {
    const keyword = 'engineer'
    const padding = 'a'.repeat(100 - keyword.length)
    const text = `${keyword}${padding}`

    const result = validateJobDescription(text, config)

    expect(result.valid).toBe(true)
  })

  it('case insensitive keyword matching', () => {
    const text = 'We need a PYTHON DEVELOPER with ML skills.'.repeat(5)

    const result = validateJobDescription(text, config)

    expect(result.valid).toBe(true)
  })
})
