import { createRequire } from 'node:module'
import { describe, it, expect } from 'vitest'

const require = createRequire(import.meta.url)
const { serializeCsv, parseCsv, HEADERS } = require('../../../apply-kit/lib/csv.js')

describe('apply-kit/csv', () => {
  const rows = [
    {
      company: 'Iberia Insights',
      role: 'Data engineer',
      link: 'https://example.com/job/1',
      country: 'Portugal',
      status: 'applied',
      date: '2026-04-10',
      next_step: 'Follow up Friday',
      notes: 'Hybrid, 3 days',
    },
    {
      company: 'Acme, Ltd.',
      role: 'PM',
      link: '',
      country: 'Spain',
      status: 'saved',
      date: '2026-04-11',
      next_step: 'Need "cover letter"',
      notes: 'Line 1\nLine 2',
    },
  ]

  it('round-trips commas, quotes, and newlines', () => {
    const csv = serializeCsv(rows)
    expect(csv.startsWith(HEADERS.join(','))).toBe(true)
    const parsed = parseCsv(csv)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].company).toBe('Iberia Insights')
    expect(parsed[1].company).toBe('Acme, Ltd.')
    expect(parsed[1].next_step).toBe('Need "cover letter"')
    expect(parsed[1].notes).toContain('Line 1')
    expect(parsed[1].notes).toContain('Line 2')
  })

  it('accepts BOM and header aliases used by helpers', () => {
    const text = '\uFEFFcompany,title,url,location,status,date,next step,note\nFoo,Bar,https://x.test,AU,interview,2026-01-01,Call,Hi\n'
    const parsed = parseCsv(text)
    expect(parsed[0]).toMatchObject({
      company: 'Foo',
      role: 'Bar',
      link: 'https://x.test',
      country: 'AU',
      status: 'interview',
      notes: 'Hi',
      next_step: 'Call',
    })
  })

  it('returns [] for empty input', () => {
    expect(parseCsv('')).toEqual([])
    expect(parseCsv('company,role\n')).toEqual([])
  })
})
