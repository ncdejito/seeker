import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { buildApp } from '../../../src/api/server'
import { FastifyInstance } from 'fastify'

describe('API /jobs/status', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /jobs/status returns 200 with correct shape', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/jobs/status',
    })

    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('status')
    expect(body).toHaveProperty('progress')
    expect(body).toHaveProperty('current_step')
  })

  it('response matches PRD section 5.7 shape', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/jobs/status',
    })

    const body = JSON.parse(response.body)
    expect(body).toMatchObject({
      status: expect.any(String),
      progress: expect.any(Number),
      current_step: expect.any(String),
    })
  })
})
