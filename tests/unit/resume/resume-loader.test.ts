import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { mkdtemp, writeFile, rm, mkdir } from 'fs/promises'
import { tmpdir } from 'os'
import { loadResumes } from '../../../src/resume/resume-loader'

describe('resume/resume-loader', () => {
  let tempDir: string
  let resumesDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))
    resumesDir = join(tempDir, 'resumes')
    await mkdir(resumesDir, { recursive: true })
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('scans resumes dir and returns ResumeMetadata[]', async () => {
    const resumeContent1 = `export default { role: 'ML Engineer', careerSummary: 'ML experience', filePath: '${join(resumesDir, 'mlops.ts')}' }`
    const resumeContent2 = `export default { role: 'AI Engineer', careerSummary: 'AI experience', filePath: '${join(resumesDir, 'ai-eng.ts')}' }`

    await writeFile(join(resumesDir, 'mlops.ts'), resumeContent1, 'utf-8')
    await writeFile(join(resumesDir, 'ai-eng.ts'), resumeContent2, 'utf-8')

    const resumes = await loadResumes(resumesDir)

    expect(resumes).toHaveLength(2)
    expect(resumes[0]).toHaveProperty('role')
    expect(resumes[0]).toHaveProperty('careerSummary')
    expect(resumes[0]).toHaveProperty('filePath')
  })

  it('each item has shape {role, careerSummary, filePath}', async () => {
    const resumeContent = `export default { role: 'Data Engineer', careerSummary: 'Data experience', filePath: '${join(resumesDir, 'data-eng.ts')}' }`
    await writeFile(join(resumesDir, 'data-eng.ts'), resumeContent, 'utf-8')

    const resumes = await loadResumes(resumesDir)

    expect(resumes[0]).toEqual({
      role: 'Data Engineer',
      careerSummary: 'Data experience',
      filePath: expect.any(String),
    })
  })

  it('returns empty array for empty resumes dir', async () => {
    const resumes = await loadResumes(resumesDir)

    expect(resumes).toEqual([])
  })

  it('ignores non-typescript files', async () => {
    await writeFile(join(resumesDir, 'readme.txt'), 'Not a resume', 'utf-8')
    await writeFile(join(resumesDir, 'mlops.ts'), 'export default { role: "ML" }', 'utf-8')

    const resumes = await loadResumes(resumesDir)

    expect(resumes).toHaveLength(1)
  })
})
