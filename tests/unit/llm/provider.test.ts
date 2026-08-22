import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createProvider, OpenAIProvider, LocalLlamaProvider } from '../../../src/llm/provider'

describe('llm/provider', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('createProvider with MODEL_PROVIDER=openai returns OpenAIProvider', () => {
    process.env.MODEL_PROVIDER = 'openai'
    process.env.OPENAI_API_KEY = 'sk-test-key'

    const provider = createProvider()

    expect(provider).toBeInstanceOf(OpenAIProvider)
  })

  it('createProvider with MODEL_PROVIDER=local returns LocalLlamaProvider', () => {
    process.env.MODEL_PROVIDER = 'local'
    process.env.LOCAL_LLM_BASE_URL = 'http://localhost:8080'

    const provider = createProvider()

    expect(provider).toBeInstanceOf(LocalLlamaProvider)
  })

  it('createProvider with unknown value throws', () => {
    process.env.MODEL_PROVIDER = 'unknown-provider'

    expect(() => createProvider()).toThrow()
  })

  it('createProvider with missing MODEL_PROVIDER throws', () => {
    delete process.env.MODEL_PROVIDER

    expect(() => createProvider()).toThrow()
  })

  it('OpenAIProvider has complete method', () => {
    process.env.MODEL_PROVIDER = 'openai'
    process.env.OPENAI_API_KEY = 'sk-test-key'

    const provider = createProvider()

    expect(typeof provider.complete).toBe('function')
  })

  it('LocalLlamaProvider has complete method', () => {
    process.env.MODEL_PROVIDER = 'local'
    process.env.LOCAL_LLM_BASE_URL = 'http://localhost:8080'

    const provider = createProvider()

    expect(typeof provider.complete).toBe('function')
  })
})
