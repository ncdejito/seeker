import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { mkdtemp, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { loadPrompt, interpolate } from '../../../src/llm/prompt-loader'

describe('llm/prompt-loader', () => {
  let tempDir: string
  const originalEnv = { ...process.env }

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))
    process.env = { ...originalEnv, PROMPTS_DIR: tempDir }
  })

  afterEach(async () => {
    process.env = originalEnv
    await rm(tempDir, { recursive: true, force: true })
  })

  it('loadPrompt returns file contents from prompts dir', async () => {
    const promptPath = join(tempDir, 'test-prompt.txt')
    await writeFile(promptPath, 'Hello {{NAME}}', 'utf-8')

    const content = await loadPrompt('test-prompt.txt')

    expect(content).toBe('Hello {{NAME}}')
  })

  it('loadPrompt with non-existent file throws', async () => {
    await expect(loadPrompt('non-existent.txt')).rejects.toThrow()
  })

  it('interpolate replaces all {{VAR}} tokens', () => {
    const template = 'Hello {{NAME}}, welcome to {{PLACE}}!'
    const vars = { NAME: 'Alice', PLACE: 'Wonderland' }

    const result = interpolate(template, vars)

    expect(result).toBe('Hello Alice, welcome to Wonderland!')
  })

  it('interpolate with unknown variable throws with var name', () => {
    const template = 'Hello {{UNKNOWN_VAR}}'

    expect(() => interpolate(template, {})).toThrow(/UNKNOWN_VAR/)
  })

  it('interpolate handles multiple same variables', () => {
    const template = '{{GREETING}} {{NAME}}, {{GREETING}} again!'
    const vars = { GREETING: 'Hi', NAME: 'Bob' }

    const result = interpolate(template, vars)

    expect(result).toBe('Hi Bob, Hi again!')
  })

  it('interpolate with no variables returns template unchanged', () => {
    const template = 'No variables here!'

    const result = interpolate(template, {})

    expect(result).toBe(template)
  })
})
