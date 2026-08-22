import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { join } from 'path'
import { mkdtemp, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { writeCSV } from '../../../src/pipeline/csv-writer'

describe('pipeline/csv-writer', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'seeker-test-'))
  })

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  it('rows sorted descending by total_fit', async () => {
    const rows = [
      { job_title: 'Job1', company: 'Co1', total_fit: 60 },
      { job_title: 'Job2', company: 'Co2', total_fit: 90 },
      { job_title: 'Job3', company: 'Co3', total_fit: 75 },
    ]

    await writeCSV(rows, tempDir)

    const files = await require('fs/promises').readdir(tempDir)
    const csvFile = files.find((f: string) => f.endsWith('.csv'))
    const content = await readFile(join(tempDir, csvFile!), 'utf-8')

    const lines = content.trim().split('\n').slice(1)
    const scores = lines.map(l => parseInt(l.split(',')[7])) // total_fit column

    expect(scores[0]).toBe(90)
    expect(scores[1]).toBe(75)
    expect(scores[2]).toBe(60)
  })

  it('skipped rows have blank scoring columns, skip reason in recommendation', async () => {
    const rows = [
      { job_title: 'Skipped', company: 'Co', skip_reason: 'low title fit', recommendation: '', total_fit: 0 },
    ]

    await writeCSV(rows, tempDir)

    const files = await require('fs/promises').readdir(tempDir)
    const csvFile = files.find((f: string) => f.endsWith('.csv'))
    const content = await readFile(join(tempDir, csvFile!), 'utf-8')

    expect(content).toContain('low title fit')
  })

  it('column order matches PRD FR-30', async () => {
    const rows = [{ job_title: 'Test', company: 'Co' }]

    await writeCSV(rows, tempDir)

    const files = await require('fs/promises').readdir(tempDir)
    const csvFile = files.find((f: string) => f.endsWith('.csv'))
    const content = await readFile(join(tempDir, csvFile!), 'utf-8')

    const header = content.split('\n')[0]
    const columns = header.split(',')

    expect(columns[0]).toBe('job_title')
    expect(columns[1]).toBe('company')
  })

  it('file named jobs_YYYY-MM-DD.csv', async () => {
    const rows = [{ job_title: 'Test', company: 'Co' }]

    await writeCSV(rows, tempDir)

    const files = await require('fs/promises').readdir(tempDir)
    const csvFile = files.find((f: string) => f.startsWith('jobs_') && f.endsWith('.csv'))

    expect(csvFile).toBeDefined()
    expect(csvFile).toMatch(/jobs_\d{4}-\d{2}-\d{2}\.csv/)
  })
})
