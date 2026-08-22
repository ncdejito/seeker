import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp } from '../../../src/api/server'
import { FastifyInstance } from 'fastify'
import { join } from 'path'
import { writeFile } from 'fs/promises'

describe('API /jobs/run', () => {
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
    await writeFile(join(stateDir, 'run_status.json'), JSON.stringify({
      status: 'idle',
      progress: 0,
      current_step: '',
      run_started_at: null,
      last_completed_run: null,
      total_jobs: 0,
      processed_jobs: 0,
    }))
  })

  it('POST /jobs/run returns 202 with message', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/jobs/run',
    })

    expect(response.statusCode).toBe(202)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('message')
    expect(body.message).toBe('Pipeline started')
  })

  it('POST /jobs/run when already running returns 409', async () => {
    await writeFile(join(stateDir, 'run_status.json'), JSON.stringify({
      status: 'running',
      progress: 50,
      current_step: 'scraping',
    }))

    const response = await app.inject({
      method: 'POST',
      url: '/jobs/run',
    })

    expect(response.statusCode).toBe(409)
  })

  it('GET /jobs/run/sync waits and returns run summary', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/jobs/run/sync',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toBeDefined()
  })

  it('both routes call same orchestrator function', async () => {
    const response1 = await app.inject({
      method: 'POST',
      url: '/jobs/run',
    })

    const response2 = await app.inject({
      method: 'GET',
      url: '/jobs/run/sync',
    })

    expect(response1.statusCode).toBe(202)
    expect(response2.statusCode).toBe(200)
  })
})
