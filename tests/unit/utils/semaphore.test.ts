import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSemaphore } from '../../../src/utils/semaphore'

describe('utils/semaphore', () => {
  let semaphore: ReturnType<typeof createSemaphore>

  beforeEach(() => {
    semaphore = createSemaphore(2)
  })

  it('never exceeds maxConcurrent simultaneous executions', async () => {
    let concurrent = 0
    let maxConcurrent = 0

    const task = async () => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise(resolve => setTimeout(resolve, 50))
      concurrent--
      return 'done'
    }

    const results = await Promise.all([
      semaphore(task),
      semaphore(task),
      semaphore(task),
      semaphore(task),
    ])

    expect(maxConcurrent).toBeLessThanOrEqual(2)
    expect(results).toHaveLength(4)
  })

  it('queued tasks run after slot freed', async () => {
    const executionOrder: number[] = []

    const slowTask = (id: number) => async () => {
      executionOrder.push(id)
      await new Promise(resolve => setTimeout(resolve, 100))
      return id
    }

    const semaphore = createSemaphore(1)

    const p1 = semaphore(slowTask(1))
    const p2 = semaphore(slowTask(2))
    const p3 = semaphore(slowTask(3))

    await Promise.all([p1, p2, p3])

    expect(executionOrder).toEqual([1, 2, 3])
  })

  it('returns correct results from wrapped functions', async () => {
    const semaphore = createSemaphore(3)

    const results = await Promise.all([
      semaphore(() => 'result1'),
      semaphore(() => 'result2'),
      semaphore(() => Promise.resolve('result3')),
    ])

    expect(results).toContain('result1')
    expect(results).toContain('result2')
    expect(results).toContain('result3')
  })
})
