import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../../../src/api/server'
import { FastifyInstance } from 'fastify'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'

describe('API /jobs/adhoc', () => {
  let app: FastifyInstance
  let stateDir: string

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
    stateDir = app.config?.STATE_DIR || 'state'
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    await writeFile(join(stateDir, 'adhoc_links.json'), JSON.stringify([]))
  })

  it('POST /jobs/adhoc with urls appends to adhoc_links.json', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/jobs/adhoc',
      payload: {
        urls: ['https://example.com/job/1', 'https://example.com/job/2'],
      },
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('queued')
    expect(body).toHaveProperty('total_queued')

    const adhoc = JSON.parse(await readFile(join(stateDir, 'adhoc_links.json'), 'utf-8'))
    expect(adhoc).toHaveLength(2)
  })

  it('returns correct queued count', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/jobs/adhoc',
      payload: {
        urls: ['https://example.com/job/1'],
      },
    })

    const body = JSON.parse(response.body)
    expect(body.queued).toBe(1)
  })
})
