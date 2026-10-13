import { createRequire } from 'node:module'
import { describe, it, expect } from 'vitest'

const require = createRequire(import.meta.url)
const {
  extractKeywords,
  containsKeyword,
  scoreMatch,
  roleKeywordCoverage,
} = require('../../../apply-kit/lib/keyword-score.js')

describe('apply-kit/keyword-score', () => {
  it('returns score 0 and empty lists for empty JD', () => {
    const result = scoreMatch('python sql airflow', '')
    expect(result.score).toBe(0)
    expect(result.matched).toEqual([])
    expect(result.missing).toEqual([])
    expect(result.total).toBe(0)
  })

  it('is case-insensitive and treats python in CV as a match', () => {
    const result = scoreMatch(
      'Built PYTHON pipelines and wrote SQL every day.',
      'We need Python and SQL. Experience with Kafka is required.'
    )
    expect(result.matched).toEqual(expect.arrayContaining(['python', 'sql']))
    expect(result.missing).toEqual(expect.arrayContaining(['kafka']))
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })

  it('scores 100 when every extracted JD keyword is in the CV', () => {
    const jd = 'Python SQL Airflow dbt Snowflake'
    const cv = 'python sql airflow dbt snowflake'
    const result = scoreMatch(cv, jd)
    expect(result.missing).toEqual([])
    expect(result.score).toBe(100)
    expect(result.total).toBeGreaterThan(0)
  })

  it('scores 0 when the CV has no overlapping skill words', () => {
    const result = scoreMatch(
      'Retail cashier at a neighborhood bakery in Quezon City.',
      'Kubernetes Terraform Kafka Snowflake Databricks'
    )
    expect(result.matched).toEqual([])
    expect(result.score).toBe(0)
    expect(result.missing.length).toBeGreaterThan(0)
  })

  it('does not treat stopwords as keywords', () => {
    const keys = extractKeywords('The team and the company with years of experience and responsibilities')
    expect(keys).not.toEqual(expect.arrayContaining(['the', 'and', 'with', 'years', 'experience', 'responsibilities']))
  })

  it('matches multi-word phrases such as machine learning', () => {
    const result = scoreMatch(
      'Shipped a machine learning ranking model.',
      'Looking for machine learning experience and Kubernetes.'
    )
    expect(containsKeyword('Shipped a machine learning ranking model.', 'machine learning')).toBe(true)
    expect(result.matched).toEqual(expect.arrayContaining(['machine learning']))
    expect(result.missing).toEqual(expect.arrayContaining(['kubernetes']))
  })

  it('matches C++ style tokens', () => {
    expect(containsKeyword('Five years of C++ on Windows.', 'c++')).toBe(true)
    expect(containsKeyword('Five years of Java.', 'c++')).toBe(false)
  })

  it('clamps scores to 0–100', () => {
    const result = scoreMatch('sql', 'sql python')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('keeps job-ad skill terms and drops filler words', () => {
    const data = require('../../../apply-kit/lib/data.js')
    const result = scoreMatch(data.samples.cvText, data.samples.jobDescription)
    expect(result.matched).toEqual(expect.arrayContaining(['python', 'sql', 'airflow', 'dbt']))
    expect(result.missing).toEqual(expect.arrayContaining(['snowflake', 'kafka', 'gdpr']))
    expect(result.keywords).not.toEqual(expect.arrayContaining(['iberia', 'lisbon', 'cover letter', 'similar']))
    expect(result.score).toBeGreaterThanOrEqual(25)
    expect(result.score).toBeLessThan(80)
  })

  it('reports role keyword coverage independently of the JD extract', () => {
    const coverage = roleKeywordCoverage(
      ['SQL', 'Python', 'Kafka'],
      'Python and SQL daily',
      'Need Python, SQL, and Kafka'
    )
    expect(coverage).toEqual([
      { keyword: 'SQL', inJd: true, inCv: true },
      { keyword: 'Python', inJd: true, inCv: true },
      { keyword: 'Kafka', inJd: true, inCv: false },
    ])
  })
})
