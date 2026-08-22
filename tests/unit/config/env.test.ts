import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadConfig } from '../../../src/config/env'

describe('config/env', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('throws with variable name when required var is missing', () => {
    delete process.env.OPENAI_API_KEY
    delete process.env.MODEL_PROVIDER
    delete process.env.LOCAL_CV_PATH

    expect(() => loadConfig()).toThrow(/OPENAI_API_KEY/)
  })

  it('returns typed config object when all required vars present', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.MODEL_PROVIDER = 'openai'
    process.env.LOCAL_CV_PATH = '/path/to/cv.pdf'

    const config = loadConfig()
    expect(config.OPENAI_API_KEY).toBe('sk-test-key')
    expect(config.MODEL_PROVIDER).toBe('openai')
    expect(config.LOCAL_CV_PATH).toBe('/path/to/cv.pdf')
  })

  it('uses default PORT=3000 when not set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.MODEL_PROVIDER = 'openai'
    process.env.LOCAL_CV_PATH = '/path/to/cv.pdf'
    delete process.env.PORT

    const config = loadConfig()
    expect(config.PORT).toBe(3000)
  })

  it('uses default MAX_CONCURRENCY=5 when not set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.MODEL_PROVIDER = 'openai'
    process.env.LOCAL_CV_PATH = '/path/to/cv.pdf'
    delete process.env.MAX_CONCURRENCY

    const config = loadConfig()
    expect(config.MAX_CONCURRENCY).toBe(5)
  })

  it('uses default LOG_LEVEL=info when not set', () => {
    process.env.OPENAI_API_KEY = 'sk-test-key'
    process.env.MODEL_PROVIDER = 'openai'
    process.env.LOCAL_CV_PATH = '/path/to/cv.pdf'
    delete process.env.LOG_LEVEL

    const config = loadConfig()
    expect(config.LOG_LEVEL).toBe('info')
  })
})
