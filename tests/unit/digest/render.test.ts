import { describe, it, expect } from 'vitest'
import { DIGEST_DISCLAIMER } from '../../../src/digest/config'
import { renderHtml, renderTelegram } from '../../../src/digest/render'
import type { DigestOutput } from '../../../src/digest/types'
import { sampleConfig, sampleJob } from './fixtures'

const digest: DigestOutput = {
  generatedAt: '2026-10-13T12:00:00.000Z',
  audience: sampleConfig.audience,
  disclaimer: DIGEST_DISCLAIMER,
  officialLinks: sampleConfig.officialLinks,
  sources: [{ id: 'eures', ok: true, fetched: 4, kept: 2, error: null }],
  jobs: [
    sampleJob(),
    sampleJob({
      id: 'remoteok:fs',
      title: 'Full Stack Engineer <script>alert(1)</script>',
      company: 'Remote OK Co',
      location: 'Worldwide',
      url: 'https://remoteok.com/remote-jobs/fs-1',
      source: 'Remote OK',
      roleId: 'full-stack-engineer',
      roleLabel: 'Full Stack Engineer',
      destinationId: 'remote',
      destinationLabel: 'Remote',
      eligibility: 'worldwide-remote',
      eligibilityLabel: 'Worldwide remote',
    }),
  ],
  counts: {
    total: 2,
    byRole: { 'data-engineer': 1, 'full-stack-engineer': 1 },
    byDestination: { eu: 1, remote: 1 },
  },
}

describe('digest/render', () => {
  it('renders a grouped mobile-friendly page with filters and visa disclaimer', () => {
    const html = renderHtml(digest, sampleConfig)
    expect(html).toContain('Daily Job Digest')
    expect(html).toContain('viewport')
    expect(html.toLowerCase()).toContain('verify on official site')
    expect(html).toContain('https://home-affairs.ec.europa.eu/policies/migration-and-asylum/eu-immigration-portal/eu-blue-card_en')
    expect(html).toContain('params.get("role")')
    expect(html).toContain('data-filter-role="data-engineer"')
    expect(html).toContain('data-filter-dest="spain"')
    expect(html).toContain('Data Engineer')
    expect(html).toContain('EU / EEA')
    expect(html).toContain('Worldwide remote')
    expect(html).toContain('Remote OK')
    expect(html).toContain('https://remoteok.com')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('renders a short Telegram summary', () => {
    const text = renderTelegram(digest, 'https://ncdejito.github.io/seeker/')
    expect(text).toContain('Seeker Daily Job Digest')
    expect(text).toContain('https://ncdejito.github.io/seeker/')
    expect(text).toContain('Data Engineer')
  })
})
