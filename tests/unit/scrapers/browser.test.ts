import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkObscuraAvailable } from '../../../src/scrapers/browser'

describe('browser module', () => {
  describe('checkObscuraAvailable', () => {
    it('returns false for non-existent binary', () => {
      const result = checkObscuraAvailable('/nonexistent/obscura')
      expect(result).toBe(false)
    })

    it('returns false when no binary path given and no env var', () => {
      const result = checkObscuraAvailable()
      expect(result).toBe(false)
    })
  })

  describe('getBrowser fallback', () => {
    beforeEach(async () => {
      vi.resetModules()
      // Mock playwright-core so we don't launch a real browser
      const fakePage = {
        goto: vi.fn(),
        waitForTimeout: vi.fn(),
        evaluate: vi.fn(),
        content: vi.fn(),
        close: vi.fn(),
      }
      const fakeContext = {
        pages: vi.fn().mockReturnValue([]),
        newPage: vi.fn().mockResolvedValue(fakePage),
      }
      const fakeBrowser = {
        close: vi.fn(),
        contexts: vi.fn().mockReturnValue([]),
        newContext: vi.fn().mockResolvedValue(fakeContext),
      }
      vi.doMock('playwright-core', () => ({
        chromium: {
          launch: vi.fn().mockResolvedValue(fakeBrowser),
          connectOverCDP: vi.fn(),
        },
      }))

      vi.doMock('child_process', () => ({
        spawn: vi.fn(() => {
          const EventEmitter = require('events')
          const proc = new EventEmitter()
          proc.stdout = new EventEmitter()
          proc.stderr = new EventEmitter()
          proc.killed = false
          proc.kill = vi.fn()
          process.nextTick(() => proc.emit('error', new Error('spawn obscura ENOENT')))
          return proc
        }),
      }))
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('falls back to plain Playwright when obscura is unavailable', async () => {
      const { getBrowser } = await import('../../../src/scrapers/browser')
      const browser = await getBrowser()
      expect(browser).toBeDefined()
      expect(typeof browser.close).toBe('function')
    })
  })
})
