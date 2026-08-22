import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { mkdtemp, writeFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { loadFromLocal, loadFromGDrive } from '../../../src/resume/cv-loader'

describe('resume/cv-loader', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('loadFromLocal returns file text', async () => {
    const filePath = join(tempDir, 'cv.txt')
    await writeFile(filePath, 'John Doe\nPython Engineer\n5 years experience', 'utf-8')

    const content = await loadFromLocal(filePath)

    expect(content).toBe('John Doe\nPython Engineer\n5 years experience')
  })

  it('loadFromLocal with non-existent file throws', async () => {
    const filePath = join(tempDir, 'non-existent.txt')

    await expect(loadFromLocal(filePath)).rejects.toThrow()
  })

  it('loadFromGDrive throws with correct message', async () => {
    const gdriveUrl = 'https://drive.google.com/file/d/abc123/view'

    await expect(loadFromGDrive(gdriveUrl)).rejects.toThrow(
      'GDrive CV fetch not implemented. Set LOCAL_CV_PATH instead.'
    )
  })

  it('loadFromLocal with empty file returns empty string', async () => {
    const filePath = join(tempDir, 'empty.txt')
    await writeFile(filePath, '', 'utf-8')

    const content = await loadFromLocal(filePath)

    expect(content).toBe('')
  })

  it('loadFromLocal preserves file encoding', async () => {
    const filePath = join(tempDir, 'cv-utf8.txt')
    const content = 'Special chars: ñáéíóú'
    await writeFile(filePath, content, 'utf-8')

    const result = await loadFromLocal(filePath)

    expect(result).toBe(content)
  })
})
