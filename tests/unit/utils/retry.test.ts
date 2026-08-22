import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry } from '../../../src/utils/retry'

describe('utils/retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('succeeds on 3rd attempt after 2 failures', async () => {
    let attempts = 0
    const fn = vi.fn().mockImplementation(() => {
      attempts++
      if (attempts < 3) {
        throw new Error('fail')
      }
      return 'success'
    })

    const promise = withRetry(fn, 5)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after 5 failures with attempt count in message', async () => {
    const fn = vi.fn().mockImplementation(() => {
      throw new Error('always fails')
    })

    const promise = withRetry(fn, 5)
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow(/5/)
    expect(fn).toHaveBeenCalledTimes(5)
  })

  it('backoff delays correct: 1s, 2s, 4s, 8s, 16s', async () => {
    let attempts = 0
    const fn = vi.fn().mockImplementation(() => {
      attempts++
      if (attempts <= 5) {
        throw new Error('fail')
      }
    })

    const setTimeoutSpy = vi.spyOn(global, 'setTimeout')

    const promise = withRetry(fn, 5)
    await vi.runAllTimersAsync()

    await promise.catch(() => {})

    const delays = setTimeoutSpy.mock.calls
      .map(call => call[1] as number)
      .filter(delay => delay !== undefined)

    expect(delays[0]).toBe(1000)
    expect(delays[1]).toBe(2000)
    expect(delays[2]).toBe(4000)
    expect(delays[3]).toBe(8000)
    expect(delays[4]).toBe(16000)

    setTimeoutSpy.mockRestore()
  })

  it('returns result immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('immediate success')

    const result = await withRetry(fn, 5)

    expect(result).toBe('immediate success')
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
