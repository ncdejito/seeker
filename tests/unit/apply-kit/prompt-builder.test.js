import { createRequire } from 'node:module'
import { describe, it, expect } from 'vitest'

const require = createRequire(import.meta.url)
const { buildPrompt, roleById, destinationById } = require('../../../apply-kit/lib/prompt-builder.js')
const data = require('../../../apply-kit/lib/data.js')

describe('apply-kit/prompt-builder', () => {
  const cv = 'Maria Santos\nData Engineer\nPython SQL Airflow BigQuery\nPRC not applicable\nTESDA not applicable'
  const jd = 'Senior Data Engineer in Lisbon. Snowflake, dbt, Airflow, GDPR.'

  it('embeds the CV and job description in the copied prompt', () => {
    const prompt = buildPrompt({
      role: 'data-engineer',
      destination: 'eu',
      cvText: cv,
      jobDescription: jd,
      matchScore: 42,
      missingKeywords: ['snowflake', 'gdpr'],
    })
    expect(prompt).toContain(cv)
    expect(prompt).toContain(jd)
    expect(prompt).toContain('42/100')
    expect(prompt).toContain('snowflake')
    expect(prompt).not.toMatch(/\{\{[A-Z_]+\}\}/)
  })

  it('uses Europass / EU conventions for the EU destination', () => {
    const prompt = buildPrompt({ role: 'data-engineer', destination: 'eu', cvText: cv, jobDescription: jd })
    expect(prompt.toLowerCase()).toContain('europass')
    expect(prompt).toContain('CEFR')
    expect(prompt).toContain('immigration-portal.ec.europa.eu')
    expect(prompt).toContain('Verify on the official site')
  })

  it('uses Spanish CV conventions for Spain', () => {
    const prompt = buildPrompt({ role: 'product-manager', destination: 'spain', cvText: cv, jobDescription: jd })
    expect(prompt.toLowerCase()).toMatch(/curr[ií]culum|carta de presentaci[oó]n|datos personales/)
    expect(prompt).toContain('inclusion.gob.es')
  })

  it('uses Australian resume conventions (no photo / no DOB)', () => {
    const prompt = buildPrompt({ role: 'full-stack-engineer', destination: 'australia', cvText: cv, jobDescription: jd })
    expect(prompt.toLowerCase()).toContain('no photo')
    expect(prompt.toLowerCase()).toContain('date of birth')
    expect(prompt).toContain('immi.homeaffairs.gov.au')
  })

  it('uses async / timezone language for remote', () => {
    const prompt = buildPrompt({ role: 'full-stack-engineer', destination: 'remote', cvText: cv, jobDescription: jd })
    expect(prompt.toLowerCase()).toContain('async')
    expect(prompt.toLowerCase()).toContain('timezone')
    expect(prompt).toContain('dmw.gov.ph')
  })

  it('includes TESDA guidance for metal press technician', () => {
    const prompt = buildPrompt({
      role: 'metal-press-technician',
      destination: 'eu',
      cvText: 'TESDA Press Machine Operation NC I, 80-ton mechanical press',
      jobDescription: 'Press operator, stamping, 150-ton',
    })
    expect(prompt).toMatch(/TESDA/)
    expect(prompt.toLowerCase()).toContain('press')
    expect(roleById('metal-press-technician').label).toMatch(/metal press/i)
  })

  it('includes PRC license guidance for civil engineer', () => {
    const prompt = buildPrompt({
      role: 'civil-engineer',
      destination: 'australia',
      cvText: 'PRC Civil Engineer License No. 0012345, AutoCAD, site supervision',
      jobDescription: 'Structural engineer, Revit, site inspections',
    })
    expect(prompt).toMatch(/PRC/)
    expect(prompt).toContain('prc.gov.ph')
    expect(prompt).toContain('engineers')
  })

  it('asks for missing CV or JD instead of leaving {{placeholders}}', () => {
    const prompt = buildPrompt({ role: 'data-engineer', destination: 'eu' })
    expect(prompt).toContain('not provided')
    expect(prompt).not.toMatch(/\{\{CV_TEXT\}\}/)
    expect(prompt).not.toMatch(/\{\{JOB_DESCRIPTION\}\}/)
  })

  it('includes brutal technical-fit and resume-match sections adapted from repo prompts', () => {
    const prompt = buildPrompt({ role: 'data-engineer', destination: 'eu', cvText: cv, jobDescription: jd })
    expect(prompt).toMatch(/Brutal Job Fit Analyzer/i)
    expect(prompt).toMatch(/critical_gaps/)
    expect(prompt).toMatch(/Resume match/i)
    expect(prompt).toMatch(/apply \| upskill first \| skip/)
  })

  it('includes flower notes when provided', () => {
    const prompt = buildPrompt({
      role: 'data-engineer',
      destination: 'eu',
      cvText: cv,
      jobDescription: jd,
      flowerNotes: 'I want Lisbon hybrid, not night shift.',
    })
    expect(prompt).toContain('Lisbon hybrid')
    expect(prompt).toMatch(/flower-fit/i)
  })

  it('resolves every destination and role in the data file', () => {
    data.roles.forEach((role) => {
      data.destinations.forEach((dest) => {
        const prompt = buildPrompt({
          role: role.id,
          destination: dest.id,
          cvText: 'sample cv',
          jobDescription: 'sample jd',
        })
        expect(prompt).toContain(role.label)
        expect(prompt).toContain(dest.label)
        dest.visas.forEach((v) => {
          expect(v.url.startsWith('https://')).toBe(true)
        })
      })
    })
    expect(destinationById('eu').cvStyleName).toMatch(/Europass/i)
  })
})
